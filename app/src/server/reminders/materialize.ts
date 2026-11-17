import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  advanceNotices,
  expandRule,
  localDateOf,
} from "@/server/reminders/recurrence";
import { ruleSchema } from "@/server/reminders/rule-schema";

type Admin = SupabaseClient<Database>;
type OccurrenceInsert =
  Database["public"]["Tables"]["reminder_occurrences"]["Insert"];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Margen hacia atrás: lo que venció hace poco todavía se muestra y se avisa. */
const LOOKBACK_HOURS = 6;
const CHUNK = 500;
/** Filas por página al leer (tope de la API). */
const PAGE = 1000;
/** Cuántos ids de círculo van en una misma consulta. */
const ID_CHUNK = 100;

export interface MaterializeOptions {
  now: Date;
  /** Cuánto hacia adelante se preparan ocurrencias. */
  horizonHours?: number;
  /** Solo estos círculos (por ejemplo, al abrir "Hoy"). Sin esto, todos. */
  circleIds?: string[];
}

/**
 * Convierte las reglas de los recordatorios en ocurrencias concretas para las
 * próximas horas. El despachador de avisos y "Hoy" leen esa tabla, que es
 * pequeña y tiene índice, en vez de recalcular reglas cada minuto.
 *
 * Es idempotente: la clave única (recordatorio, tipo, instante, días de aviso)
 * hace que correrla dos veces no duplique nada.
 *
 * Usa el cliente admin porque corre sin sesión (cron) y para todos los círculos.
 */
export async function materializeOccurrences(
  admin: Admin,
  { now, horizonHours = 48, circleIds }: MaterializeOptions,
): Promise<{ created: number }> {
  if (circleIds && circleIds.length === 0) {
    return { created: 0 };
  }
  const from = new Date(now.getTime() - LOOKBACK_HOURS * HOUR);
  const to = new Date(now.getTime() + horizonHours * HOUR);

  // Círculos abiertos cuya cuidadora (quien lo creó) no tiene la cuenta desactivada.
  // Se lee de a páginas: la API entrega como máximo 1.000 filas por consulta.
  const timezones = new Map<string, string>();
  // Sin lista: todos los círculos (una sola pasada). Con lista: por tandas.
  const filters: (string[] | null)[] = circleIds
    ? Array.from({ length: Math.ceil(circleIds.length / ID_CHUNK) }, (_, i) =>
        circleIds.slice(i * ID_CHUNK, (i + 1) * ID_CHUNK),
      )
    : [null];
  for (const filter of filters) {
    for (let offset = 0; ; offset += PAGE) {
      let query = admin
        .from("circles")
        .select(
          "id, timezone, creator:profiles!circles_created_by_fkey(deactivated_at)",
        )
        .is("closed_at", null)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (filter) {
        query = query.in("id", filter);
      }
      const circles = await query;
      if (circles.error) {
        throw new Error(`materialize: círculos (${circles.error.code})`);
      }
      for (const circle of circles.data ?? []) {
        if (circle.creator && circle.creator.deactivated_at === null) {
          timezones.set(circle.id, circle.timezone);
        }
      }
      if ((circles.data?.length ?? 0) < PAGE) {
        break;
      }
    }
  }
  if (timezones.size === 0) {
    return { created: 0 };
  }

  // Recordatorios activos de esos círculos, pidiendo los círculos por tandas:
  // una lista de cientos de ids no cabe en una sola consulta.
  const activeReminders: {
    id: string;
    circle_id: string;
    rule: unknown;
    advance_days: number[] | null;
  }[] = [];
  const ids = [...timezones.keys()];
  for (let start = 0; start < ids.length; start += ID_CHUNK) {
    const chunk = ids.slice(start, start + ID_CHUNK);
    for (let offset = 0; ; offset += PAGE) {
      const reminders = await admin
        .from("reminders")
        .select("id, circle_id, rule, advance_days")
        .eq("active", true)
        .in("circle_id", chunk)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (reminders.error) {
        throw new Error(`materialize: recordatorios (${reminders.error.code})`);
      }
      activeReminders.push(...(reminders.data ?? []));
      if ((reminders.data?.length ?? 0) < PAGE) {
        break;
      }
    }
  }

  const rows: OccurrenceInsert[] = [];
  for (const reminder of activeReminders) {
    const tz = timezones.get(reminder.circle_id);
    const rule = ruleSchema.safeParse(reminder.rule);
    if (!tz || !rule.success) {
      // Una regla ilegible se salta: no puede frenar los avisos de todos los demás.
      continue;
    }
    const base = { reminder_id: reminder.id, circle_id: reminder.circle_id };

    for (const eventAt of expandRule(rule.data, tz, from, to)) {
      rows.push({
        ...base,
        kind: "main",
        advance_days: 0,
        due_at: eventAt.toISOString(),
        event_at: eventAt.toISOString(),
        local_date: localDateOf(eventAt, tz),
      });
    }

    const advanceDays = reminder.advance_days ?? [];
    if (advanceDays.length > 0) {
      // Para avisar "3 días antes" hay que mirar eventos más allá del horizonte.
      const farthest = new Date(
        to.getTime() + (Math.max(...advanceDays) + 1) * DAY,
      );
      for (const eventAt of expandRule(rule.data, tz, from, farthest)) {
        for (const notice of advanceNotices(eventAt, tz, advanceDays)) {
          const fireAt = notice.fireAt.getTime();
          if (fireAt >= from.getTime() && fireAt <= to.getTime()) {
            rows.push({
              ...base,
              kind: "advance",
              advance_days: notice.daysBefore,
              due_at: notice.fireAt.toISOString(),
              event_at: eventAt.toISOString(),
              local_date: localDateOf(eventAt, tz),
            });
          }
        }
      }
    }
  }

  let created = 0;
  for (let start = 0; start < rows.length; start += CHUNK) {
    const { data, error } = await admin
      .from("reminder_occurrences")
      .upsert(rows.slice(start, start + CHUNK), {
        onConflict: "reminder_id,kind,event_at,advance_days",
        ignoreDuplicates: true,
      })
      .select("id");
    if (error) {
      throw new Error(`materialize: ocurrencias (${error.code})`);
    }
    created += data?.length ?? 0;
  }
  return { created };
}
