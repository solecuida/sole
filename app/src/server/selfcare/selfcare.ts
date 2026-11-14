import { TZDate } from "@date-fns/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format, subDays } from "date-fns";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { localDate } from "@/server/circles/circles";
import { track } from "@/server/events/track";

type Client = SupabaseClient<Database>;

export type SelfcareErrorCode = "validation_failed" | "internal";

const DEFAULT_TIMEZONE = "America/Santiago";

const scoreSchema = z.number().int().min(1).max(5);

const MESSAGES = {
  validation: "Elige un número del 1 al 5.",
  internal: "No pudimos guardar tu respuesta. Prueba de nuevo en un momento.",
} as const;

/**
 * Guarda cómo está la cuidadora hoy (1 a 5). Una fila por día local: si ya
 * respondió, se cambia el puntaje. El puntaje nunca va a un evento.
 */
export async function checkIn(
  client: Client,
  userId: string,
  score: number,
  now: Date,
  tz: string = DEFAULT_TIMEZONE,
): Promise<Result<{ checkinDate: string }, SelfcareErrorCode>> {
  const parsed = scoreSchema.safeParse(score);
  if (!parsed.success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  const checkinDate = localDate(now, tz);

  const existing = await client
    .from("selfcare_checkins")
    .select("id")
    .eq("user_id", userId)
    .eq("checkin_date", checkinDate)
    .maybeSingle();
  if (existing.error) {
    return fail("internal", MESSAGES.internal);
  }

  const saved = existing.data
    ? await client
        .from("selfcare_checkins")
        .update({ score: parsed.data })
        .eq("id", existing.data.id)
    : await client.from("selfcare_checkins").insert({
        user_id: userId,
        checkin_date: checkinDate,
        score: parsed.data,
      });
  if (saved.error) {
    return fail("internal", MESSAGES.internal);
  }

  await track(client, userId, "selfcare.checked_in", {});
  return ok({ checkinDate });
}

/** Puntaje de hoy, o null si todavía no respondió. */
export async function todayScore(
  client: Client,
  userId: string,
  now: Date,
  tz: string = DEFAULT_TIMEZONE,
): Promise<number | null> {
  const { data } = await client
    .from("selfcare_checkins")
    .select("score")
    .eq("user_id", userId)
    .eq("checkin_date", localDate(now, tz))
    .maybeSingle();
  return data?.score ?? null;
}

/** `true` si hoy, ayer y anteayer tienen cada uno un puntaje de 2 o menos. */
export async function lowStreak(
  client: Client,
  userId: string,
  now: Date,
  tz: string = DEFAULT_TIMEZONE,
): Promise<boolean> {
  const today = new TZDate(now, tz);
  const days = [0, 1, 2].map((back) =>
    format(subDays(today, back), "yyyy-MM-dd"),
  );
  const { data, error } = await client
    .from("selfcare_checkins")
    .select("checkin_date, score")
    .eq("user_id", userId)
    .in("checkin_date", days);
  if (error || !data) {
    return false;
  }
  return days.every((day) =>
    data.some((row) => row.checkin_date === day && row.score <= 2),
  );
}

export interface ResourceView {
  id: string;
  name: string;
  description: string;
  phone: string | null;
  url: string | null;
  sourceUrl: string;
  verifiedAt: string;
  region: string;
}

/** Solo recursos activos y verificados, por nombre. */
export async function verifiedResources(
  client: Client,
): Promise<ResourceView[]> {
  const { data } = await client
    .from("resources")
    .select(
      "id, name, description, phone, url, source_url, verified_at, region",
    )
    .eq("active", true)
    .not("verified_at", "is", null)
    .order("name", { ascending: true });
  return (data ?? []).flatMap((row) =>
    row.verified_at
      ? [
          {
            id: row.id,
            name: row.name,
            description: row.description,
            phone: row.phone,
            url: row.url,
            sourceUrl: row.source_url,
            verifiedAt: row.verified_at,
            region: row.region,
          },
        ]
      : [],
  );
}

export interface EmergencyContactView {
  id: string;
  name: string;
  phone: string;
}

/** Contactos de emergencia del círculo. No lee las notas cifradas. */
export async function emergencyContacts(
  client: Client,
  circleId: string,
): Promise<EmergencyContactView[]> {
  const { data } = await client
    .from("contacts")
    .select("id, name, phone")
    .eq("circle_id", circleId)
    .eq("is_emergency", true)
    .order("name", { ascending: true });
  return data ?? [];
}
