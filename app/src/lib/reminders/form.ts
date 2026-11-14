import { z } from "zod";
import { KINDS_WITH_ADVANCE } from "@/lib/reminders/labels";
import { Constants } from "@/lib/supabase/database.types";

// Forma del formulario de recordatorios (todo texto, como lo entrega el navegador)
// y su conversión a lo que guarda el servidor. El servidor valida de nuevo.

const KINDS = Constants.public.Enums.reminder_kind;
const IMPORTANCES = Constants.public.Enums.importance;
export const FREQUENCIES = [
  "daily",
  "weekly",
  "interval",
  "monthly",
  "yearly",
  "once",
] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Todos los días",
  weekly: "Algunos días de la semana",
  interval: "Cada cierta cantidad de días",
  monthly: "Una vez al mes",
  yearly: "Una vez al año",
  once: "Una sola vez",
};

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const inRange = (value: string, min: number, max: number) => {
  const number = Number(value);
  return /^\d+$/.test(value) && number >= min && number <= max;
};
const filled = (times: readonly string[]) =>
  times.filter((time) => time !== "");

export const reminderFormSchema = z
  .object({
    kind: z.enum(KINDS),
    title: z
      .string()
      .trim()
      .min(1, "Escribe un título.")
      .max(120, "El título es muy largo."),
    importance: z.enum(IMPORTANCES),
    medName: z.string().max(120, "El nombre es muy largo."),
    medInstructions: z.string().max(300, "La indicación es muy larga."),
    freq: z.enum(FREQUENCIES),
    date: z.string(),
    weekdays: z.array(z.string()),
    everyDays: z.string(),
    dayOfMonth: z.string(),
    month: z.string(),
    day: z.string(),
    times: z.array(z.string()).max(8, "Máximo 8 horas por día."),
    startDate: z.string().refine(isDate, "Elige la fecha de inicio."),
    endDate: z.string(),
    advance: z.array(z.string()),
    visibleToCared: z.boolean(),
  })
  .superRefine((values, context) => {
    const issue = (path: string, message: string) =>
      context.addIssue({ code: "custom", path: [path], message });
    const times = filled(values.times);
    if (times.length === 0) {
      issue("times", "Agrega al menos una hora.");
    } else if (new Set(times).size !== times.length) {
      issue("times", "Hay una hora repetida.");
    }
    if (values.freq === "once" && !isDate(values.date)) {
      issue("date", "Elige la fecha.");
    }
    if (values.freq === "weekly" && values.weekdays.length === 0) {
      issue("weekdays", "Elige al menos un día.");
    }
    if (values.freq === "interval" && !inRange(values.everyDays, 2, 365)) {
      issue("everyDays", "Escribe un número entre 2 y 365.");
    }
    if (values.freq === "monthly" && !inRange(values.dayOfMonth, 1, 31)) {
      issue("dayOfMonth", "Escribe un día entre 1 y 31.");
    }
    if (values.freq === "yearly" && !inRange(values.day, 1, 31)) {
      issue("day", "Escribe un día entre 1 y 31.");
    }
    if (values.endDate !== "" && values.endDate < values.startDate) {
      issue("endDate", "El término no puede ser antes del inicio.");
    }
  });

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;

export function defaultFormValues(startDate: string): ReminderFormValues {
  return {
    kind: "medication",
    title: "",
    importance: "normal",
    medName: "",
    medInstructions: "",
    freq: "daily",
    date: startDate,
    weekdays: [],
    everyDays: "2",
    dayOfMonth: String(Number(startDate.slice(8, 10))),
    month: String(Number(startDate.slice(5, 7))),
    day: String(Number(startDate.slice(8, 10))),
    times: [""],
    startDate,
    endDate: "",
    advance: ["3", "1", "0"],
    visibleToCared: false,
  };
}

/** Lo que el servidor devuelve de un recordatorio ya guardado. */
export interface StoredReminder {
  kind: ReminderFormValues["kind"];
  title: string;
  importance: ReminderFormValues["importance"];
  medName: string | null;
  medInstructions: string | null;
  rule: Record<string, unknown> & {
    freq: string;
    times: string[];
    startDate: string;
  };
  advanceDays: number[];
  visibleToCared: boolean;
}

export function formValuesFromStored(
  stored: StoredReminder,
): ReminderFormValues {
  const { rule } = stored;
  const base = defaultFormValues(rule.startDate);
  const text = (key: string, fallback: string) =>
    rule[key] === undefined ? fallback : String(rule[key]);
  return {
    ...base,
    kind: stored.kind,
    title: stored.title,
    importance: stored.importance,
    medName: stored.medName ?? "",
    medInstructions: stored.medInstructions ?? "",
    freq: FREQUENCIES.includes(rule.freq as Frequency)
      ? (rule.freq as Frequency)
      : "daily",
    date: text("date", base.date),
    weekdays: Array.isArray(rule.weekdays) ? rule.weekdays.map(String) : [],
    everyDays: text("everyDays", base.everyDays),
    dayOfMonth: text("dayOfMonth", base.dayOfMonth),
    month: text("month", base.month),
    day: text("day", base.day),
    times: rule.times.length > 0 ? rule.times : [""],
    endDate: text("endDate", ""),
    advance: stored.advanceDays.map(String),
    visibleToCared: stored.visibleToCared,
  };
}

/** Convierte el formulario en los datos que valida y guarda el servidor. */
export function toReminderInput(values: ReminderFormValues) {
  const common = {
    times: [...new Set(filled(values.times))].sort(),
    startDate: values.startDate,
    ...(values.endDate ? { endDate: values.endDate } : {}),
  };
  const rule = {
    once: { freq: "once", date: values.date, ...common },
    daily: { freq: "daily", ...common },
    weekly: {
      freq: "weekly",
      weekdays: values.weekdays.map(Number).sort((a, b) => a - b),
      ...common,
    },
    interval: {
      freq: "interval",
      everyDays: Number(values.everyDays),
      ...common,
    },
    monthly: {
      freq: "monthly",
      dayOfMonth: Number(values.dayOfMonth),
      ...common,
    },
    yearly: {
      freq: "yearly",
      month: Number(values.month),
      day: Number(values.day),
      ...common,
    },
  }[values.freq];

  const isMedication = values.kind === "medication";
  return {
    kind: values.kind,
    title: values.title.trim(),
    importance: values.importance,
    medName: isMedication ? values.medName.trim() : "",
    medInstructions: isMedication ? values.medInstructions.trim() : "",
    rule,
    advanceDays: KINDS_WITH_ADVANCE.includes(values.kind)
      ? values.advance.map(Number).sort((a, b) => b - a)
      : [],
    visibleToCared: values.visibleToCared,
  };
}
