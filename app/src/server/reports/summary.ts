import type { SupabaseClient } from "@supabase/supabase-js";
import { type Period, percent } from "@/lib/reports/view";
import type { Database } from "@/lib/supabase/database.types";
import { addDays } from "@/server/calendar/calendar";
import { localDateOf } from "@/server/reminders/recurrence";

type Client = SupabaseClient<Database>;
type ReminderKind = Database["public"]["Enums"]["reminder_kind"];
type OccurrenceStatus = Database["public"]["Enums"]["occurrence_status"];

export type { Period };
/** Quién mira: el estado propio de la cuidadora solo existe para `caregiver`. */
export type Audience = "caregiver" | "family";

/** Nunca aparecen en un informe: no interpretamos ni hablamos de clínica. */
export const BANNED_WORDS = [
  "diagnóstico",
  "deterioro",
  "empeora",
  "síntoma",
] as const;

/** Datos crudos de un informe. Todas las fechas son días locales `YYYY-MM-DD`. */
export interface ReportRows {
  timezone: string;
  /** Solo ocurrencias `main`. */
  occurrences: {
    localDate: string;
    kind: ReminderKind;
    status: OccurrenceStatus;
  }[];
  journal: { entryDate: string; dayRating: string }[];
  /** Tareas cerradas, con el día local en que se cerraron. */
  tasks: { doneDate: string }[];
  /** Bienestar propio de quien mira. Vacío si no corresponde. */
  selfcare: { date: string; score: number }[];
  /** Primer día con actividad en el círculo (no solo dentro del período). */
  firstActivity: string | null;
}

export interface KindCompliance {
  kind: ReminderKind;
  done: number;
  total: number;
  rate: number;
}

export interface Summary {
  period: Period;
  audience: Audience;
  /** Falso si no hay nada que mostrar todavía. */
  hasData: boolean;
  medication: { done: number; total: number; rate: number | null };
  compliance: KindCompliance[];
  activitiesDone: number;
  journal: { days: number; bueno: number; regular: number; dificil: number };
  tasksClosed: number;
  selfcare: { days: number; average: number } | null;
  sentences: string[];
}

const PERIOD_PHRASE: Record<Period, string> = {
  dia: "Hoy",
  semana: "Esta semana",
  mes: "Este mes",
};

const KIND_OBJECT: Record<ReminderKind, string> = {
  medication: "de los medicamentos",
  food: "de las comidas e hidratación",
  activity: "de las actividades",
  appointment: "de los controles y citas",
  errand: "de los trámites",
  important_date: "de las fechas importantes",
  custom: "de los otros recordatorios",
};

/** Orden en que se muestran los tipos. */
const KIND_ORDER: readonly ReminderKind[] = [
  "medication",
  "food",
  "activity",
  "appointment",
  "errand",
  "important_date",
  "custom",
];

/** Primer y último día local del período que termina en `today`. */
export function periodRange(
  period: Period,
  today: string,
): { from: string; to: string } {
  const back = period === "dia" ? 0 : period === "semana" ? 6 : 29;
  return { from: addDays(today, -back), to: today };
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

/**
 * Resume las filas de un período. Puro: sin reloj ni red. Solo cuenta lo
 * observado y nunca interpreta. Con `audience: "family"` no sale ningún dato
 * de bienestar de la cuidadora.
 */
export function summarize(
  rows: ReportRows,
  period: Period,
  audience: Audience,
): Summary {
  const phrase = PERIOD_PHRASE[period];
  // Lo saltado (círculo cerrado) no cuenta ni a favor ni en contra.
  const counted = rows.occurrences.filter((row) => row.status !== "skipped");

  const compliance: KindCompliance[] = [];
  for (const kind of KIND_ORDER) {
    const ofKind = counted.filter((row) => row.kind === kind);
    if (ofKind.length > 0) {
      const done = ofKind.filter((row) => row.status === "done").length;
      compliance.push({
        kind,
        done,
        total: ofKind.length,
        rate: done / ofKind.length,
      });
    }
  }
  const med = compliance.find((item) => item.kind === "medication");
  const activitiesDone = counted.filter(
    (row) => row.kind === "activity" && row.status === "done",
  ).length;

  const rating = (value: string) =>
    rows.journal.filter((entry) => entry.dayRating === value).length;
  const journal = {
    days: rows.journal.length,
    bueno: rating("bueno"),
    regular: rating("regular"),
    dificil: rating("dificil"),
  };
  const tasksClosed = rows.tasks.length;

  let selfcare: Summary["selfcare"] = null;
  if (audience === "caregiver" && rows.selfcare.length > 0) {
    const total = rows.selfcare.reduce((sum, row) => sum + row.score, 0);
    selfcare = {
      days: rows.selfcare.length,
      average: Math.round((total / rows.selfcare.length) * 10) / 10,
    };
  }

  const sentences: string[] = [];
  for (const item of compliance) {
    // Las actividades se cuentan abajo, como "se hicieron N".
    if (item.kind !== "activity") {
      sentences.push(
        `${phrase} se cumplió el ${percent(item.rate)} ${KIND_OBJECT[item.kind]}.`,
      );
    }
  }
  if (activitiesDone > 0) {
    sentences.push(
      `${phrase} ${plural(activitiesDone, "se hizo 1 actividad", `se hicieron ${activitiesDone} actividades`)}.`,
    );
  }
  if (journal.bueno > 0) {
    sentences.push(
      `Hubo ${journal.bueno} ${plural(journal.bueno, "día bueno", "días buenos")}.`,
    );
  }
  if (journal.regular > 0) {
    sentences.push(
      `Hubo ${journal.regular} ${plural(journal.regular, "día regular", "días regulares")}.`,
    );
  }
  if (journal.dificil > 0) {
    sentences.push(
      `Hubo ${journal.dificil} ${plural(journal.dificil, "día difícil", "días difíciles")}.`,
    );
  }
  if (tasksClosed > 0) {
    sentences.push(
      `${phrase} ${plural(tasksClosed, "se cerró 1 tarea", `se cerraron ${tasksClosed} tareas`)}.`,
    );
  }
  if (selfcare) {
    sentences.push(
      `Respondiste cómo estabas ${selfcare.days} ${plural(selfcare.days, "día", "días")}; tu promedio fue ${String(selfcare.average).replace(".", ",")} de 5.`,
    );
  }

  const hasData =
    counted.length > 0 || journal.days > 0 || tasksClosed > 0 || !!selfcare;

  return {
    period,
    audience,
    hasData,
    medication: {
      done: med?.done ?? 0,
      total: med?.total ?? 0,
      rate: med ? med.rate : null,
    },
    compliance,
    activitiesDone,
    journal,
    tasksClosed,
    selfcare,
    sentences,
  };
}

/**
 * Trae los datos del rango (días locales, ambos incluidos) con el cliente de la
 * usuaria: RLS decide qué ve. El bienestar solo se pide si se pasa `userId`, y
 * siempre es el suyo.
 */
export async function loadReportRows(
  client: Client,
  circleId: string,
  range: { from: string; to: string; timezone: string },
  userId?: string,
): Promise<ReportRows> {
  const { from, to, timezone } = range;
  // Margen de un día a cada lado: el filtro fino se hace con el día local.
  const fromInstant = new Date(`${addDays(from, -1)}T00:00:00Z`).toISOString();
  const toInstant = new Date(`${addDays(to, 2)}T00:00:00Z`).toISOString();

  const [occurrences, journal, tasks, selfcare, firstDone, firstEntry] =
    await Promise.all([
      client
        .from("reminder_occurrences")
        .select("local_date, status, reminder:reminders!inner(kind)")
        .eq("circle_id", circleId)
        .eq("kind", "main")
        .gte("local_date", from)
        .lte("local_date", to)
        .limit(1000),
      client
        .from("journal_entries")
        .select("entry_date, day_rating")
        .eq("circle_id", circleId)
        .gte("entry_date", from)
        .lte("entry_date", to)
        .limit(1000),
      client
        .from("tasks")
        .select("done_at")
        .eq("circle_id", circleId)
        .not("done_at", "is", null)
        .gte("done_at", fromInstant)
        .lt("done_at", toInstant)
        .limit(1000),
      userId
        ? client
            .from("selfcare_checkins")
            .select("checkin_date, score")
            .eq("user_id", userId)
            .gte("checkin_date", from)
            .lte("checkin_date", to)
            .limit(1000)
        : Promise.resolve({ data: [] }),
      client
        .from("reminder_occurrences")
        .select("local_date")
        .eq("circle_id", circleId)
        .eq("kind", "main")
        .eq("status", "done")
        .order("local_date", { ascending: true })
        .limit(1),
      client
        .from("journal_entries")
        .select("entry_date")
        .eq("circle_id", circleId)
        .order("entry_date", { ascending: true })
        .limit(1),
    ]);

  const firsts = [
    firstDone.data?.[0]?.local_date,
    firstEntry.data?.[0]?.entry_date,
  ].filter((value): value is string => Boolean(value));

  return {
    timezone,
    occurrences: (occurrences.data ?? []).map((row) => ({
      localDate: row.local_date,
      status: row.status,
      kind: row.reminder.kind,
    })),
    journal: (journal.data ?? []).map((row) => ({
      entryDate: row.entry_date,
      dayRating: row.day_rating,
    })),
    tasks: (tasks.data ?? [])
      .flatMap((row) => (row.done_at ? [row.done_at] : []))
      .map((doneAt) => ({ doneDate: localDateOf(new Date(doneAt), timezone) }))
      .filter((row) => row.doneDate >= from && row.doneDate <= to),
    selfcare: (selfcare.data ?? []).map((row) => ({
      date: row.checkin_date,
      score: row.score,
    })),
    firstActivity: firsts.length > 0 ? firsts.sort()[0] : null,
  };
}
