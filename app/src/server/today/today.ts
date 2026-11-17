import { TZDate } from "@date-fns/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { decryptField } from "@/lib/crypto/field";
import { KINDS_WITH_ADVANCE } from "@/lib/reminders/labels";
import type { Database } from "@/lib/supabase/database.types";
import { materializeOccurrences } from "@/server/reminders/materialize";
import {
  expandRule,
  localDateOf,
  zonedInstant,
} from "@/server/reminders/recurrence";
import { ruleSchema } from "@/server/reminders/rule-schema";
import { todayTasks } from "@/server/tasks/tasks";

type Client = SupabaseClient<Database>;
type Enums = Database["public"]["Enums"];

const DAY = 86_400_000;
const UPCOMING_DAYS = 7;

export interface TodayItem {
  /**
   * De dónde sale: un recordatorio (se marca hecho, no hecho o pospuesto) o una
   * tarea sin hora que la cuidadora pasó a hoy (se gestiona en "Tareas").
   */
  source: "reminder" | "task";
  id: string;
  reminderId: string;
  title: string;
  kind: Enums["reminder_kind"];
  importance: Enums["importance"];
  /** Hora local `HH:MM`. */
  time: string;
  eventAt: string;
  status: Enums["occurrence_status"];
  /** Ya pasó su hora y sigue pendiente. */
  overdue: boolean;
  notDoneReason: string | null;
  /** Hora local `HH:MM` hasta la que está pospuesto. */
  snoozedUntil: string | null;
  /** Nombre e indicación del medicamento, ya descifrados. Nunca sale del servidor hacia un aviso. */
  detail: string | null;
}

export interface UpcomingItem {
  reminderId: string;
  title: string;
  kind: Enums["reminder_kind"];
  /** Día local `YYYY-MM-DD`. */
  date: string;
  time: string;
}

export interface Progress {
  done: number;
  total: number;
}

export interface TodayData {
  circleId: string;
  caredName: string;
  timezone: string;
  /** Día local `YYYY-MM-DD` que se muestra. */
  localDate: string;
  groups: Record<Enums["importance"], TodayItem[]>;
  upcoming: UpcomingItem[];
  progress: { day: Progress; week: Progress };
}

function dayOffset(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY)
    .toISOString()
    .slice(0, 10);
}

/** Lunes de la semana (ISO) de un día local. */
function mondayOf(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = domingo
  return dayOffset(date, -((weekday + 6) % 7));
}

function clock(instant: string, tz: string): string {
  return format(new TZDate(new Date(instant), tz), "HH:mm");
}

function medDetail(name: string | null, instructions: string | null) {
  const parts: string[] = [];
  for (const [value, context] of [
    [name, "reminders.med_name"],
    [instructions, "reminders.med_instructions"],
  ] as const) {
    if (value) {
      try {
        parts.push(decryptField(value, context));
      } catch {
        // Un campo ilegible se omite: no puede botar "Hoy".
      }
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * El día de un círculo. Primero prepara las ocurrencias de ese círculo (así
 * "Hoy" está completo aunque el cron no haya corrido); después lee con el
 * cliente de la usuaria, y RLS decide qué puede ver.
 *
 * Devuelve null si la usuaria no es miembro del círculo.
 */
export async function getToday(
  client: Client,
  admin: Client,
  circleId: string,
  now: Date,
): Promise<TodayData | null> {
  const circle = await client
    .from("circles")
    .select("id, cared_name, timezone, closed_at")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle.data) {
    return null;
  }
  const tz = circle.data.timezone;
  const today = localDateOf(now, tz);

  // El cliente admin solo se usa después de confirmar la pertenencia, y solo para este círculo.
  if (!circle.data.closed_at) {
    await materializeOccurrences(admin, { now, circleIds: [circleId] });
  }

  const [day, week, reminders, tasks] = await Promise.all([
    client
      .from("reminder_occurrences")
      .select(
        "id, reminder_id, event_at, status, not_done_reason, snoozed_until, reminder:reminders!inner(title, kind, importance, med_name_enc, med_instructions_enc)",
      )
      .eq("circle_id", circleId)
      .eq("kind", "main")
      .eq("local_date", today)
      .order("event_at", { ascending: true })
      .limit(200),
    client
      .from("reminder_occurrences")
      .select("status")
      .eq("circle_id", circleId)
      .eq("kind", "main")
      .gte("local_date", mondayOf(today))
      .lte("local_date", today)
      .limit(1000),
    client
      .from("reminders")
      .select("id, title, kind, rule")
      .eq("circle_id", circleId)
      .eq("active", true)
      .in("kind", [...KINDS_WITH_ADVANCE])
      .limit(200),
    todayTasks(client, circleId, today),
  ]);

  const groups: TodayData["groups"] = {
    important: [],
    normal: [],
    whenever: [],
  };
  for (const row of day.data ?? []) {
    const item: TodayItem = {
      source: "reminder",
      id: row.id,
      reminderId: row.reminder_id,
      title: row.reminder.title,
      kind: row.reminder.kind,
      importance: row.reminder.importance,
      time: clock(row.event_at, tz),
      eventAt: new Date(row.event_at).toISOString(),
      status: row.status,
      overdue:
        row.status === "pending" &&
        new Date(row.event_at).getTime() < now.getTime(),
      notDoneReason: row.not_done_reason,
      snoozedUntil: row.snoozed_until ? clock(row.snoozed_until, tz) : null,
      detail: medDetail(
        row.reminder.med_name_enc,
        row.reminder.med_instructions_enc,
      ),
    };
    groups[item.importance].push(item);
  }
  // Las tareas pasadas a hoy van al final de "Cuando puedas". No tienen hora ni
  // cuentan en el avance del día, que mide solo los recordatorios.
  for (const task of tasks) {
    groups.whenever.push({
      source: "task",
      id: task.id,
      reminderId: "",
      title: task.title,
      kind: "custom",
      importance: "whenever",
      time: "",
      eventAt: "",
      status: "pending",
      overdue: false,
      notDoneReason: null,
      snoozedUntil: null,
      detail: null,
    });
  }

  // Próximos días: controles, trámites y fechas, desde mañana.
  const from = zonedInstant(dayOffset(today, 1), "00:00", tz);
  const to = zonedInstant(dayOffset(today, UPCOMING_DAYS), "23:59", tz);
  const upcoming: UpcomingItem[] = [];
  for (const reminder of reminders.data ?? []) {
    const rule = ruleSchema.safeParse(reminder.rule);
    if (!rule.success) {
      continue;
    }
    for (const at of expandRule(rule.data, tz, from, to)) {
      upcoming.push({
        reminderId: reminder.id,
        title: reminder.title,
        kind: reminder.kind,
        date: localDateOf(at, tz),
        time: clock(at.toISOString(), tz),
      });
    }
  }
  upcoming.sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );

  const count = (rows: { status: string }[]): Progress => {
    // Lo saltado (círculo cerrado) no cuenta ni a favor ni en contra.
    const counted = rows.filter((row) => row.status !== "skipped");
    return {
      done: counted.filter((row) => row.status === "done").length,
      total: counted.length,
    };
  };

  return {
    circleId,
    caredName: circle.data.cared_name,
    timezone: tz,
    localDate: today,
    groups,
    upcoming: upcoming.slice(0, 20),
    progress: { day: count(day.data ?? []), week: count(week.data ?? []) },
  };
}
