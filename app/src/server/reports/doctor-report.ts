import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptField } from "@/lib/crypto/field";
import { MONTH_LABELS } from "@/lib/reminders/labels";
import { percent } from "@/lib/reports/view";
import type { Database } from "@/lib/supabase/database.types";
import { type ReportRows, summarize } from "@/server/reports/summary";

type Client = SupabaseClient<Database>;
type ReminderKind = Database["public"]["Enums"]["reminder_kind"];
type OccurrenceStatus = Database["public"]["Enums"]["occurrence_status"];

const PAGE_SIZE = 1000;
const MED_NAME_CONTEXT = "reminders.med_name";

/** Título fijo de la sección que la familia completa a mano. */
export const FAMILY_QUESTIONS_TITLE = "Preguntas de la familia para el control";

/** Datos crudos del informe del médico. Los medicamentos llegan con su nombre ya descifrado (o `null`). */
export interface DoctorRows {
  timezone: string;
  reminders: {
    id: string;
    kind: ReminderKind;
    title: string;
    /** Nombre del medicamento; `null` si no hay o no se pudo descifrar. */
    medName: string | null;
  }[];
  /** Solo ocurrencias `main`, con su día local `YYYY-MM-DD`. */
  occurrences: {
    reminderId: string;
    localDate: string;
    status: OccurrenceStatus;
  }[];
  journal: { entryDate: string; dayRating: string }[];
}

export interface DoctorMedication {
  reminderId: string;
  label: string;
  done: number;
  total: number;
  rate: number;
  /** "90 %" */
  text: string;
}

export interface DoctorReport {
  /** `YYYY-MM` */
  month: string;
  /** "marzo de 2027" */
  monthLabel: string;
  from: string;
  to: string;
  hasData: boolean;
  medication: DoctorMedication[];
  activities: { total: number; items: { label: string; done: number }[] };
  journal: { days: number; bueno: number; regular: number; dificil: number };
  /** Las mismas frases de los informes de Sole, sin bienestar de la cuidadora. */
  sentences: string[];
  /** Sección vacía: la familia la llena a mano. */
  questions: { title: string; blankLines: number };
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** `?mes=YYYY-MM`; cualquier otra cosa es el mes de `today` (`YYYY-MM-DD`). */
export function parseMonth(
  value: string | string[] | undefined,
  today: string,
): string {
  return typeof value === "string" && MONTH_PATTERN.test(value)
    ? value
    : today.slice(0, 7);
}

/** Primer y último día local del mes `YYYY-MM`. */
export function monthRange(month: string): { from: string; to: string } {
  const [year, number] = month.split("-").map(Number);
  const last = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
  };
}

/** "marzo de 2027" */
export function monthLabel(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return `${MONTH_LABELS[number - 1]} de ${year}`;
}

/** Mes `YYYY-MM` desplazado `by` meses (negativo hacia atrás). */
export function shiftMonth(month: string, by: number): string {
  const [year, number] = month.split("-").map(Number);
  const moved = new Date(Date.UTC(year, number - 1 + by, 1));
  return `${moved.getUTCFullYear()}-${String(moved.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Arma el informe del médico de un mes. Puro: sin reloj ni red. Solo cuenta lo
 * que se registró; no interpreta ni aconseja, y no recibe bienestar de la
 * cuidadora. Las frases salen de `summarize` (las mismas del resto de informes).
 */
export function buildDoctorReport(
  rows: DoctorRows,
  month: string,
): DoctorReport {
  const { from, to } = monthRange(month);
  const byId = new Map(
    rows.reminders.map((reminder) => [reminder.id, reminder]),
  );
  const counted = rows.occurrences.filter(
    (row) =>
      row.status !== "skipped" &&
      row.localDate >= from &&
      row.localDate <= to &&
      byId.has(row.reminderId),
  );

  const labelOf = (id: string): string => {
    const reminder = byId.get(id);
    return reminder?.medName?.trim() || reminder?.title || "Recordatorio";
  };

  const tally = new Map<string, { done: number; total: number }>();
  const activityCounts = new Map<string, number>();
  for (const row of counted) {
    const kind = byId.get(row.reminderId)?.kind;
    if (kind === "medication") {
      const entry = tally.get(row.reminderId) ?? { done: 0, total: 0 };
      entry.total += 1;
      entry.done += row.status === "done" ? 1 : 0;
      tally.set(row.reminderId, entry);
    } else if (kind === "activity" && row.status === "done") {
      activityCounts.set(
        row.reminderId,
        (activityCounts.get(row.reminderId) ?? 0) + 1,
      );
    }
  }

  const medication: DoctorMedication[] = [...tally]
    .map(([reminderId, { done, total }]) => ({
      reminderId,
      label: labelOf(reminderId),
      done,
      total,
      rate: done / total,
      text: percent(done / total),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

  const items = [...activityCounts]
    .map(([id, done]) => ({ label: labelOf(id), done }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));

  const monthJournal = rows.journal.filter(
    (entry) => entry.entryDate >= from && entry.entryDate <= to,
  );
  const rating = (value: string) =>
    monthJournal.filter((entry) => entry.dayRating === value).length;

  const summaryRows: ReportRows = {
    timezone: rows.timezone,
    occurrences: counted.map((row) => ({
      localDate: row.localDate,
      kind: byId.get(row.reminderId)?.kind ?? "custom",
      status: row.status,
    })),
    journal: monthJournal,
    tasks: [],
    selfcare: [],
    firstActivity: null,
  };
  const summary = summarize(summaryRows, "mes", "family");

  return {
    month,
    monthLabel: monthLabel(month),
    from,
    to,
    hasData: summary.hasData,
    medication,
    activities: {
      total: items.reduce((sum, item) => sum + item.done, 0),
      items,
    },
    journal: {
      days: monthJournal.length,
      bueno: rating("bueno"),
      regular: rating("regular"),
      dificil: rating("dificil"),
    },
    sentences: summary.sentences,
    questions: { title: FAMILY_QUESTIONS_TITLE, blankLines: 5 },
  };
}

function decryptOrNull(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return decryptField(value, MED_NAME_CONTEXT);
  } catch {
    // Si no se puede leer, el informe muestra el título del recordatorio.
    return null;
  }
}

/**
 * Trae las filas del mes con el cliente de la usuaria (RLS decide qué ve).
 * Lee por tandas de 1.000 filas. No pide bienestar ni notas de la bitácora.
 */
export async function loadDoctorRows(
  client: Client,
  circleId: string,
  month: string,
  timezone: string,
): Promise<DoctorRows> {
  const { from, to } = monthRange(month);
  const reminders = new Map<string, DoctorRows["reminders"][number]>();
  const occurrences: DoctorRows["occurrences"] = [];
  const journal: DoctorRows["journal"] = [];

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data } = await client
      .from("reminder_occurrences")
      .select(
        "id, reminder_id, local_date, status, reminder:reminders!inner(id, kind, title, med_name_enc)",
      )
      .eq("circle_id", circleId)
      .eq("kind", "main")
      .gte("local_date", from)
      .lte("local_date", to)
      .order("local_date", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
    const page = data ?? [];
    for (const row of page) {
      occurrences.push({
        reminderId: row.reminder_id,
        localDate: row.local_date,
        status: row.status,
      });
      if (!reminders.has(row.reminder.id)) {
        reminders.set(row.reminder.id, {
          id: row.reminder.id,
          kind: row.reminder.kind,
          title: row.reminder.title,
          medName:
            row.reminder.kind === "medication"
              ? decryptOrNull(row.reminder.med_name_enc)
              : null,
        });
      }
    }
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data } = await client
      .from("journal_entries")
      .select("id, entry_date, day_rating")
      .eq("circle_id", circleId)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);
    const page = data ?? [];
    for (const row of page) {
      journal.push({ entryDate: row.entry_date, dayRating: row.day_rating });
    }
    if (page.length < PAGE_SIZE) {
      break;
    }
  }

  return {
    timezone,
    reminders: [...reminders.values()],
    occurrences,
    journal,
  };
}
