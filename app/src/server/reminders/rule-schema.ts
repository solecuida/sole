import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

// Regla de repetición de un recordatorio. Se guarda como JSON en `reminders.rule`
// y es legible a simple vista: { freq: "weekly", weekdays: [1,3,5], times: ["09:00"], … }.

/** ¿Es una fecha real del calendario? ("2026-02-30" no lo es). */
function isRealDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function allDistinct(values: readonly (string | number)[]): boolean {
  return new Set(values).size === values.length;
}

/** Fecha local `YYYY-MM-DD`. */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa el formato AAAA-MM-DD.")
  .refine(isRealDate, "Esa fecha no existe.");

/** Hora local `HH:MM` en 24 horas. */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa una hora entre 00:00 y 23:59.");

const times = z
  .array(timeSchema)
  .min(1, "Agrega al menos una hora.")
  .max(8, "Máximo 8 horas por día.")
  .refine(allDistinct, "Hay una hora repetida.");

// Lo propio de cada frecuencia, sin fechas de inicio ni término.
const frequencies = {
  /** Una sola vez, en `date`. */
  once: { freq: z.literal("once"), date: dateSchema, times },
  daily: { freq: z.literal("daily"), times },
  /** Días de la semana ISO: 1 = lunes … 7 = domingo. */
  weekly: {
    freq: z.literal("weekly"),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Elige al menos un día.")
      .max(7)
      .refine(allDistinct, "Hay un día repetido."),
    times,
  },
  /** Cada N días desde la fecha de inicio. */
  interval: {
    freq: z.literal("interval"),
    everyDays: z.number().int().min(2).max(365),
    times,
  },
  /** Si el mes no tiene ese día (31 en abril), se usa su último día. */
  monthly: {
    freq: z.literal("monthly"),
    dayOfMonth: z.number().int().min(1).max(31),
    times,
  },
  /** Cumpleaños y aniversarios. */
  yearly: {
    freq: z.literal("yearly"),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    times,
  },
} as const;

const dates = { startDate: dateSchema, endDate: dateSchema.optional() };

export const ruleSchema = z
  .discriminatedUnion("freq", [
    z.strictObject({ ...frequencies.once, ...dates }),
    z.strictObject({ ...frequencies.daily, ...dates }),
    z.strictObject({ ...frequencies.weekly, ...dates }),
    z.strictObject({ ...frequencies.interval, ...dates }),
    z.strictObject({ ...frequencies.monthly, ...dates }),
    z.strictObject({ ...frequencies.yearly, ...dates }),
  ])
  .refine((rule) => !rule.endDate || rule.endDate >= rule.startDate, {
    path: ["endDate"],
    message: "El término no puede ser antes del inicio.",
  });

export type ReminderRule = z.infer<typeof ruleSchema>;

/** Regla de un ítem de plantilla: la fecha de inicio se pone al crear el círculo. */
export const templateRuleSchema = z.discriminatedUnion("freq", [
  z.strictObject(frequencies.daily),
  z.strictObject(frequencies.weekly),
  z.strictObject(frequencies.interval),
  z.strictObject(frequencies.monthly),
  z.strictObject(frequencies.yearly),
]);

export type TemplateRule = z.infer<typeof templateRuleSchema>;

/** Días de anticipación de un aviso: 0 = el mismo día. */
export const advanceDaysSchema = z
  .array(z.number().int().min(0).max(30))
  .max(5)
  .refine(allDistinct, "Hay un día repetido.");

/** Un ítem de `care_templates.items`: se convierte en un recordatorio editable. */
export const templateItemSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  kind: z.enum(Constants.public.Enums.reminder_kind),
  importance: z.enum(Constants.public.Enums.importance),
  rule: templateRuleSchema,
  advanceDays: advanceDaysSchema,
  visibleToCared: z.boolean(),
});

export type TemplateItem = z.infer<typeof templateItemSchema>;
