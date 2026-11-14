import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { decryptField, encryptField } from "@/lib/crypto/field";
import { fail, ok, type Result } from "@/lib/result";
import { Constants, type Database } from "@/lib/supabase/database.types";
import { track } from "@/server/events/track";
import {
  advanceDaysSchema,
  type ReminderRule,
  ruleSchema,
} from "@/server/reminders/rule-schema";

type Client = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["reminders"]["Row"];
export type ReminderKind = Database["public"]["Enums"]["reminder_kind"];
export type Importance = Database["public"]["Enums"]["importance"];

export type ReminderErrorCode =
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "internal";

/** Tipos que avisan con días de anticipación (3 días antes, el día anterior y el mismo día). */
export const KINDS_WITH_ADVANCE: readonly ReminderKind[] = [
  "appointment",
  "errand",
  "important_date",
];

const MED_NAME = "reminders.med_name";
const MED_INSTRUCTIONS = "reminders.med_instructions";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const reminderInputSchema = z.object({
  kind: z.enum(Constants.public.Enums.reminder_kind),
  importance: z.enum(Constants.public.Enums.importance).default("normal"),
  title: z.string().trim().min(1).max(120),
  /** Texto libre: sin catálogo de fármacos. Solo se guarda si es un medicamento. */
  medName: optionalText(120),
  medInstructions: optionalText(300),
  rule: ruleSchema,
  advanceDays: advanceDaysSchema.optional(),
  visibleToCared: z.boolean().default(false),
});

export type ReminderInput = z.input<typeof reminderInputSchema>;

export interface ReminderView {
  id: string;
  circleId: string;
  kind: ReminderKind;
  importance: Importance;
  title: string;
  medName: string | null;
  medInstructions: string | null;
  rule: ReminderRule;
  advanceDays: number[];
  visibleToCared: boolean;
  active: boolean;
  source: string;
}

const MESSAGES = {
  validation: "Revisa el recordatorio: falta algo o hay un dato que no calza.",
  forbidden:
    "Solo quien administra este círculo puede cambiar los recordatorios.",
  notFound: "No encontramos ese recordatorio.",
  internal: "No pudimos guardar. Prueba de nuevo en un momento.",
} as const;

function fromPostgres(error: {
  code?: string;
}): Result<never, ReminderErrorCode> {
  return error.code === "42501"
    ? fail("forbidden", MESSAGES.forbidden)
    : fail("internal", MESSAGES.internal);
}

/** Columnas listas para guardar: cifra lo sensible y aplica los valores por defecto. */
function toColumns(data: z.output<typeof reminderInputSchema>) {
  const isMedication = data.kind === "medication";
  return {
    kind: data.kind,
    importance: data.importance,
    title: data.title,
    med_name_enc:
      isMedication && data.medName
        ? encryptField(data.medName, MED_NAME)
        : null,
    med_instructions_enc:
      isMedication && data.medInstructions
        ? encryptField(data.medInstructions, MED_INSTRUCTIONS)
        : null,
    rule: data.rule,
    advance_days:
      data.advanceDays ??
      (KINDS_WITH_ADVANCE.includes(data.kind) ? [3, 1, 0] : []),
    visible_to_cared: data.visibleToCared,
  };
}

function decryptOrNull(value: string | null, context: string): string | null {
  if (!value) {
    return null;
  }
  try {
    return decryptField(value, context);
  } catch {
    // Un campo ilegible no puede botar la lista entera de recordatorios.
    return null;
  }
}

function toView(row: Row): ReminderView {
  return {
    id: row.id,
    circleId: row.circle_id,
    kind: row.kind,
    importance: row.importance,
    title: row.title,
    medName: decryptOrNull(row.med_name_enc, MED_NAME),
    medInstructions: decryptOrNull(row.med_instructions_enc, MED_INSTRUCTIONS),
    rule: row.rule as ReminderRule,
    advanceDays: row.advance_days,
    visibleToCared: row.visible_to_cared,
    active: row.active,
    source: row.source,
  };
}

export async function createReminder(
  client: Client,
  userId: string,
  circleId: string,
  input: unknown,
): Promise<Result<{ id: string }, ReminderErrorCode>> {
  const parsed = reminderInputSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(circleId).success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  const { data, error } = await client
    .from("reminders")
    .insert({
      ...toColumns(parsed.data),
      circle_id: circleId,
      created_by: userId,
      source: "manual",
    })
    .select("id")
    .single();
  if (error || !data) {
    return fromPostgres(error ?? {});
  }
  await track(client, userId, "reminder.created", {
    kind: parsed.data.kind,
    importance: parsed.data.importance,
    source: "manual",
  });
  return ok({ id: data.id });
}

/** ¿Lo puede ver? ¿Lo pudo cambiar? Distingue "no existe" de "no te corresponde". */
async function changeReminder(
  client: Client,
  reminderId: string,
  changes: Database["public"]["Tables"]["reminders"]["Update"],
): Promise<Result<{ id: string }, ReminderErrorCode>> {
  if (!z.uuid().safeParse(reminderId).success) {
    return fail("not_found", MESSAGES.notFound);
  }
  const visible = await client
    .from("reminders")
    .select("id")
    .eq("id", reminderId)
    .maybeSingle();
  if (!visible.data) {
    return fail("not_found", MESSAGES.notFound);
  }
  const { data, error } = await client
    .from("reminders")
    .update(changes)
    .eq("id", reminderId)
    .select("id");
  if (error) {
    return fromPostgres(error);
  }
  if (!data || data.length === 0) {
    // RLS dejó verlo pero no cambiarlo: es familiar, no cuidadora.
    return fail("forbidden", MESSAGES.forbidden);
  }
  return ok({ id: reminderId });
}

export async function updateReminder(
  client: Client,
  reminderId: string,
  input: unknown,
): Promise<Result<{ id: string }, ReminderErrorCode>> {
  const parsed = reminderInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  return changeReminder(client, reminderId, toColumns(parsed.data));
}

/**
 * "Borrar" un recordatorio lo desactiva: deja de avisar, pero su historial
 * (lo que ya se hizo o no se hizo) se conserva para los informes.
 */
export function deleteReminder(
  client: Client,
  reminderId: string,
): Promise<Result<{ id: string }, ReminderErrorCode>> {
  return changeReminder(client, reminderId, { active: false });
}

/** Recordatorios activos del círculo, con los campos cifrados ya legibles. */
export async function listReminders(
  client: Client,
  circleId: string,
): Promise<ReminderView[]> {
  const { data } = await client
    .from("reminders")
    .select("*")
    .eq("circle_id", circleId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(500);
  return (data ?? []).map(toView);
}

export async function getReminder(
  client: Client,
  reminderId: string,
): Promise<ReminderView | null> {
  if (!z.uuid().safeParse(reminderId).success) {
    return null;
  }
  const { data } = await client
    .from("reminders")
    .select("*")
    .eq("id", reminderId)
    .maybeSingle();
  return data ? toView(data) : null;
}
