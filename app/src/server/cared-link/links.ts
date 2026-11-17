import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { track } from "@/server/events/track";
import { materializeOccurrences } from "@/server/reminders/materialize";
import { localDateOf } from "@/server/reminders/recurrence";

// Vínculo de la persona cuidada: un enlace secreto que abre una vista simple,
// sin cuenta ni contraseña.
//
// Reglas que este archivo garantiza:
//  - El enlace no se guarda: en la base queda solo su huella (SHA-256). Quien
//    lea la base no puede reconstruirlo.
//  - Todo lo que se hace con un vínculo queda atado a SU círculo. Una ocurrencia
//    de otro círculo, o de un recordatorio que la cuidadora no marcó como
//    visible, responde igual que si no existiera.
//  - Un vínculo revocado, vencido o de un círculo cerrado deja de servir de
//    inmediato y responde igual que uno que nunca existió.
//  - Desde un vínculo solo se ve el título y la hora de cada ítem: nunca el
//    nombre ni la indicación de un medicamento.

type Client = SupabaseClient<Database>;

const DAY = 86_400_000;
/** Un vínculo dura 90 días; después hay que crear otro. */
export const LINK_DAYS = 90;
/** Vínculos vigentes por círculo: un teléfono, una tablet y algún repuesto. */
export const MAX_ACTIVE_LINKS = 5;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const UUID = z.uuid();
const labelSchema = z.string().trim().max(60);

export type LinkErrorCode =
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "internal";

export interface LinkView {
  id: string;
  label: string | null;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  /** `active`, `revoked` o `expired`, calculado al momento de leer. */
  state: "active" | "revoked" | "expired";
}

/** Un vínculo ya comprobado. Lo reciben las funciones que actúan en su nombre. */
export interface ResolvedLink {
  linkId: string;
  circleId: string;
  caredName: string;
  timezone: string;
}

export interface CaredItem {
  id: string;
  title: string;
  /** Hora local `HH:MM`. */
  time: string;
  done: boolean;
}

/** Huella con la que se busca un enlace. Es lo único que se guarda de él. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function isCaregiver(
  client: Client,
  userId: string,
  circleId: string,
): Promise<boolean> {
  const { data } = await client
    .from("circle_members")
    .select("role")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "caregiver";
}

/**
 * Crea un vínculo. El enlace (`token`) se devuelve UNA sola vez: después no hay
 * forma de volver a verlo, solo de revocarlo y crear otro.
 */
export async function createLink(
  client: Client,
  userId: string,
  circleId: string,
  label: string,
  now: Date,
): Promise<
  Result<{ linkId: string; token: string; expiresAt: string }, LinkErrorCode>
> {
  const parsedLabel = labelSchema.safeParse(label);
  if (!UUID.safeParse(circleId).success || !parsedLabel.success) {
    return fail(
      "validation_failed",
      "El nombre del vínculo puede tener hasta 60 letras.",
    );
  }
  if (!(await isCaregiver(client, userId, circleId))) {
    return fail(
      "forbidden",
      "Solo quien cuida puede crear el vínculo de la persona cuidada.",
    );
  }
  const active = await client
    .from("cared_links")
    .select("id", { count: "exact", head: true })
    .eq("circle_id", circleId)
    .is("revoked_at", null)
    .gt("expires_at", now.toISOString());
  if (active.error) {
    return fail("internal", "No pudimos crear el vínculo. Prueba de nuevo.");
  }
  if ((active.count ?? 0) >= MAX_ACTIVE_LINKS) {
    return fail(
      "conflict",
      `Ya hay ${MAX_ACTIVE_LINKS} vínculos vigentes. Revoca uno antes de crear otro.`,
    );
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + LINK_DAYS * DAY).toISOString();
  const { data, error } = await client
    .from("cared_links")
    .insert({
      circle_id: circleId,
      token_hash: hashToken(token),
      label: parsedLabel.data === "" ? null : parsedLabel.data,
      created_by: userId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !data) {
    return fail("internal", "No pudimos crear el vínculo. Prueba de nuevo.");
  }
  await track(client, userId, "cared_link.created", {});
  return ok({ linkId: data.id, token, expiresAt });
}

/** Revoca un vínculo: desde este instante el enlace deja de abrir la vista. */
export async function revokeLink(
  client: Client,
  linkId: string,
  now: Date,
): Promise<Result<{ linkId: string }, LinkErrorCode>> {
  if (!UUID.safeParse(linkId).success) {
    return fail("not_found", "No encontramos ese vínculo.");
  }
  // RLS deja pasar solo a la cuidadora del círculo del vínculo.
  const { data, error } = await client
    .from("cared_links")
    .update({ revoked_at: now.toISOString() })
    .eq("id", linkId)
    .is("revoked_at", null)
    .select("id");
  if (error) {
    return fail("internal", "No pudimos revocar el vínculo. Prueba de nuevo.");
  }
  if (!data?.length) {
    return fail("not_found", "No encontramos ese vínculo.");
  }
  return ok({ linkId });
}

/** Los vínculos de un círculo, del más nuevo al más antiguo. Nunca trae la huella. */
export async function listLinks(
  client: Client,
  circleId: string,
  now: Date,
): Promise<LinkView[]> {
  const { data } = await client
    .from("cared_links")
    .select("id, label, created_at, expires_at, revoked_at, last_used_at")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    state: row.revoked_at
      ? "revoked"
      : new Date(row.expires_at).getTime() <= now.getTime()
        ? "expired"
        : "active",
  }));
}

/**
 * Comprueba un enlace. Devuelve su círculo, o `null` si no existe, fue
 * revocado, venció o el círculo está cerrado: quien llama responde 404 en
 * todos esos casos, sin distinguirlos.
 *
 * `admin` es el cliente de servicio: aquí no hay sesión. El enlace ES la
 * credencial, y por eso todo lo que sigue filtra por el círculo que devuelve.
 */
export async function resolveLink(
  admin: Client,
  token: string,
  now: Date,
): Promise<ResolvedLink | null> {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) {
    return null;
  }
  const { data } = await admin
    .from("cared_links")
    .select(
      "id, circle_id, expires_at, revoked_at, circle:circles!inner(cared_name, timezone, closed_at)",
    )
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (
    !data ||
    data.revoked_at !== null ||
    new Date(data.expires_at).getTime() <= now.getTime() ||
    data.circle.closed_at !== null
  ) {
    return null;
  }
  // Solo para que la cuidadora vea si el vínculo se usa. Un fallo aquí no importa.
  await admin
    .from("cared_links")
    .update({ last_used_at: now.toISOString() })
    .eq("id", data.id);
  return {
    linkId: data.id,
    circleId: data.circle_id,
    caredName: data.circle.cared_name,
    timezone: data.circle.timezone,
  };
}

function clock(instant: string, tz: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(instant));
}

/**
 * Lo que la persona cuidada ve hoy: solo los recordatorios que la cuidadora
 * marcó como visibles para ella, con su título y su hora.
 */
export async function visibleToday(
  admin: Client,
  circleId: string,
  now: Date,
): Promise<CaredItem[]> {
  const circle = await admin
    .from("circles")
    .select("timezone, closed_at")
    .eq("id", circleId)
    .maybeSingle();
  if (!circle.data || circle.data.closed_at) {
    return [];
  }
  const tz = circle.data.timezone;
  // Igual que "Hoy": el día está completo aunque el cron no haya corrido.
  await materializeOccurrences(admin, { now, circleIds: [circleId] });
  const { data } = await admin
    .from("reminder_occurrences")
    .select(
      "id, event_at, status, reminder:reminders!inner(title, visible_to_cared, active)",
    )
    .eq("circle_id", circleId)
    .eq("kind", "main")
    .eq("local_date", localDateOf(now, tz))
    .eq("reminder.visible_to_cared", true)
    .order("event_at", { ascending: true })
    .limit(100);
  return (data ?? [])
    .filter((row) => row.reminder.visible_to_cared === true)
    .map((row) => ({
      id: row.id,
      title: row.reminder.title,
      time: clock(row.event_at, tz),
      done: row.status === "done",
    }));
}

/**
 * Marca "Listo" desde la vista de la persona cuidada. Solo vale para un ítem
 * de hoy, del círculo del vínculo y de un recordatorio visible para ella;
 * cualquier otro caso es `not_found`, sin decir por qué.
 */
export async function markDoneFromLink(
  admin: Client,
  link: ResolvedLink,
  occurrenceId: string,
  now: Date,
): Promise<Result<{ occurrenceId: string }, LinkErrorCode>> {
  const missing = fail<LinkErrorCode>("not_found", "No encontramos ese ítem.");
  if (!UUID.safeParse(occurrenceId).success) {
    return missing;
  }
  const { data: occurrence } = await admin
    .from("reminder_occurrences")
    .select(
      "id, status, local_date, kind, reminder:reminders!inner(visible_to_cared)",
    )
    .eq("id", occurrenceId)
    .eq("circle_id", link.circleId)
    .maybeSingle();
  if (
    occurrence?.kind !== "main" ||
    occurrence.reminder.visible_to_cared !== true ||
    occurrence.local_date !== localDateOf(now, link.timezone)
  ) {
    return missing;
  }
  if (occurrence.status === "done") {
    // Ya estaba hecho (quizá lo marcó la cuidadora): no se pisa quién lo hizo.
    return ok({ occurrenceId });
  }
  const { error } = await admin
    .from("reminder_occurrences")
    .update({
      status: "done",
      done_via: "cared_link",
      done_by: null,
      done_at: now.toISOString(),
      not_done_reason: null,
      snoozed_until: null,
    })
    .eq("id", occurrenceId)
    .eq("circle_id", link.circleId)
    .neq("status", "done");
  if (error) {
    return fail("internal", "No pudimos guardarlo. Prueba de nuevo.");
  }
  // Si no cambió ninguna fila, alguien lo marcó en este instante: queda hecho igual.
  return ok({ occurrenceId });
}
