import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { decryptField, encryptField } from "@/lib/crypto/field";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { DEFAULT_TIMEZONE, localDate } from "@/server/circles/circles";
import { track } from "@/server/events/track";

type Client = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["journal_entries"]["Row"];

export type JournalErrorCode = "validation_failed" | "forbidden" | "internal";

const NOTE_CONTEXT = "journal_entries.note";

export const DAY_RATINGS = ["bueno", "regular", "dificil"] as const;
export const MOODS = [
  "tranquila",
  "feliz",
  "triste",
  "irritable",
  "ansiosa",
  "desorientada",
  "con_dolor",
  "cansada",
  "otro",
] as const;
export const LEVELS = ["bien", "regular", "poco"] as const;

export type DayRating = (typeof DAY_RATINGS)[number];
export type Mood = (typeof MOODS)[number];
export type Level = (typeof LEVELS)[number];

export const journalInputSchema = z.object({
  dayRating: z.enum(DAY_RATINGS),
  moods: z
    .array(z.enum(MOODS))
    .max(MOODS.length)
    .refine((items) => new Set(items).size === items.length)
    .default([]),
  sleep: z.enum(LEVELS).nullish(),
  food: z.enum(LEVELS).nullish(),
  note: z.string().trim().max(1000).nullish(),
  /** Solo para el evento de medición; no se guarda. */
  durationMs: z.number().int().min(0).max(86_400_000).optional(),
});

export type JournalInput = z.input<typeof journalInputSchema>;

export interface JournalEntryView {
  id: string;
  entryDate: string;
  dayRating: DayRating;
  moods: Mood[];
  sleep: Level | null;
  food: Level | null;
  note: string | null;
}

const MESSAGES = {
  validation: "Revisa la bitácora: falta algo o hay un dato que no calza.",
  forbidden: "Solo quien cuida puede escribir en la bitácora.",
  internal: "No pudimos guardar. Prueba de nuevo en un momento.",
} as const;

function fromPostgres(error: {
  code?: string;
}): Result<never, JournalErrorCode> {
  return error.code === "42501"
    ? fail("forbidden", MESSAGES.forbidden)
    : fail("internal", MESSAGES.internal);
}

function decryptOrNull(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    return decryptField(value, NOTE_CONTEXT);
  } catch {
    // Una nota ilegible no puede botar la bitácora entera.
    return null;
  }
}

function toView(row: Row): JournalEntryView {
  return {
    id: row.id,
    entryDate: row.entry_date,
    dayRating: row.day_rating as DayRating,
    moods: row.moods as Mood[],
    sleep: row.sleep as Level | null,
    food: row.food as Level | null,
    note: decryptOrNull(row.note_enc),
  };
}

/**
 * Guarda la entrada del día local del círculo: una sola por día. Si ya existe
 * la actualiza. (Se busca y luego se actualiza o inserta, en vez de `upsert`,
 * porque la cuidadora solo puede actualizar algunas columnas.)
 */
export async function saveEntry(
  client: Client,
  userId: string,
  circleId: string,
  input: unknown,
  now: Date,
  timezone: string = DEFAULT_TIMEZONE,
): Promise<Result<{ id: string; entryDate: string }, JournalErrorCode>> {
  const parsed = journalInputSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(circleId).success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  const data = parsed.data;
  const entryDate = localDate(now, timezone);
  const columns = {
    day_rating: data.dayRating,
    moods: data.moods,
    sleep: data.sleep ?? null,
    food: data.food ?? null,
    note_enc: data.note ? encryptField(data.note, NOTE_CONTEXT) : null,
  };

  const update = async (
    id: string,
  ): Promise<Result<{ id: string }, JournalErrorCode>> => {
    const { data: rows, error } = await client
      .from("journal_entries")
      .update(columns)
      .eq("id", id)
      .select("id");
    if (error) {
      return fromPostgres(error);
    }
    if (!rows || rows.length === 0) {
      // RLS dejó verla pero no cambiarla: es familiar, no cuidadora.
      return fail("forbidden", MESSAGES.forbidden);
    }
    return ok({ id });
  };

  const findToday = () =>
    client
      .from("journal_entries")
      .select("id")
      .eq("circle_id", circleId)
      .eq("entry_date", entryDate)
      .maybeSingle();

  const existing = await findToday();
  if (existing.error) {
    return fromPostgres(existing.error);
  }

  let saved: Result<{ id: string }, JournalErrorCode>;
  if (existing.data) {
    saved = await update(existing.data.id);
  } else {
    const inserted = await client
      .from("journal_entries")
      .insert({
        ...columns,
        circle_id: circleId,
        author_id: userId,
        entry_date: entryDate,
      })
      .select("id")
      .single();
    if (inserted.error?.code === "23505") {
      // Otra pestaña la creó justo antes: se actualiza esa.
      const again = await findToday();
      saved = again.data
        ? await update(again.data.id)
        : fail("internal", MESSAGES.internal);
    } else if (inserted.error || !inserted.data) {
      saved = fromPostgres(inserted.error ?? {});
    } else {
      saved = ok({ id: inserted.data.id });
    }
  }

  if (!saved.ok) {
    return saved;
  }
  await track(client, userId, "journal.saved", {
    duration_ms: data.durationMs ?? 0,
    has_note: Boolean(data.note),
  });
  return ok({ id: saved.data.id, entryDate });
}

/** Últimas entradas del círculo, la más reciente primero, con la nota legible. */
export async function listEntries(
  client: Client,
  circleId: string,
  limit = 14,
): Promise<JournalEntryView[]> {
  const { data } = await client
    .from("journal_entries")
    .select("*")
    .eq("circle_id", circleId)
    .order("entry_date", { ascending: false })
    .limit(limit);
  return (data ?? []).map(toView);
}

export async function getEntry(
  client: Client,
  circleId: string,
  entryDate: string,
): Promise<JournalEntryView | null> {
  const { data } = await client
    .from("journal_entries")
    .select("*")
    .eq("circle_id", circleId)
    .eq("entry_date", entryDate)
    .maybeSingle();
  return data ? toView(data) : null;
}
