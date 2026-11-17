import { TZDate } from "@date-fns/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { track } from "@/server/events/track";
import { localDateOf } from "@/server/reminders/recurrence";

type Client = SupabaseClient<Database>;
type CareType = Database["public"]["Enums"]["care_type"];

export interface Tip {
  id: string;
  kind: "consejo" | "actividad";
  text: string;
  /** Título del ítem que queda en el día si se acepta (solo actividades). */
  activityTitle: string | null;
  /** Vacío = sirve para cualquier tipo de cuidado. */
  careTypes: CareType[];
}

/** Hash estable de un texto (FNV-1a de 32 bits): mismo día, mismo consejo. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/**
 * Consejo del día: se elige de forma determinista por la fecha entre los que
 * aplican a ese tipo de cuidado o a todos. Sin azar: quien abre "Hoy" varias
 * veces ve siempre el mismo.
 */
export function tipOfDay(
  tips: readonly Tip[],
  localDate: string,
  careType: CareType,
): Tip | null {
  const candidates = tips
    .filter(
      (tip) => tip.careTypes.length === 0 || tip.careTypes.includes(careType),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  if (candidates.length === 0) {
    return null;
  }
  return candidates[hash(localDate) % candidates.length];
}

export async function listActiveTips(client: Client): Promise<Tip[]> {
  const { data } = await client
    .from("tips")
    .select("id, kind, text, activity_title, care_types")
    .eq("active", true)
    .limit(500);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind === "actividad" ? "actividad" : "consejo",
    text: row.text,
    activityTitle: row.activity_title,
    careTypes: row.care_types,
  }));
}

export async function getActiveTip(
  client: Client,
  tipId: string,
): Promise<Tip | null> {
  return (await listActiveTips(client)).find((tip) => tip.id === tipId) ?? null;
}

/** Próxima hora en punto de hoy, en la zona del círculo; nunca pasa a mañana. */
function nextFullHour(now: Date, tz: string): string {
  const hour = Number(format(new TZDate(now, tz), "H"));
  return hour >= 23 ? "23:59" : `${String(hour + 1).padStart(2, "0")}:00`;
}

/** ¿Ya aceptó hoy esta actividad? */
export async function isActivityAccepted(
  client: Client,
  circleId: string,
  tip: Tip,
  localDate: string,
): Promise<boolean> {
  if (!tip.activityTitle) {
    return false;
  }
  const { data } = await client
    .from("reminders")
    .select("id")
    .eq("circle_id", circleId)
    .eq("source", "tip")
    .eq("active", true)
    .eq("title", tip.activityTitle)
    .eq("rule->>date", localDate)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Acepta la actividad del día: queda como un ítem más de hoy ("cuando puedas"),
 * a la próxima hora en punto. Aceptarla dos veces no la duplica.
 */
export async function acceptActivity(
  client: Client,
  userId: string,
  circleId: string,
  tip: Tip,
  now: Date,
  tz = "America/Santiago",
): Promise<
  Result<{ created: boolean }, "validation_failed" | "forbidden" | "internal">
> {
  if (tip.kind !== "actividad" || !tip.activityTitle) {
    return fail("validation_failed", "Ese consejo no es una actividad.");
  }
  const today = localDateOf(now, tz);
  if (await isActivityAccepted(client, circleId, tip, today)) {
    return ok({ created: false });
  }
  const { error } = await client.from("reminders").insert({
    circle_id: circleId,
    created_by: userId,
    kind: "activity",
    importance: "whenever",
    title: tip.activityTitle,
    rule: {
      freq: "once",
      date: today,
      times: [nextFullHour(now, tz)],
      startDate: today,
    },
    source: "tip",
  });
  if (error) {
    return error.code === "42501"
      ? fail("forbidden", "Solo quien administra este círculo puede agregarla.")
      : fail("internal", "No pudimos agregarla. Prueba de nuevo.");
  }
  await track(client, userId, "reminder.created", {
    kind: "activity",
    importance: "whenever",
    source: "tip",
  });
  return ok({ created: true });
}
