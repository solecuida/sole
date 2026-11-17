import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

/**
 * Id de la usuaria con sesión, o null. Usa getUser(), que valida el JWT contra
 * Supabase; getSession() solo lee la cookie y no sirve para autorizar.
 */
export async function getSessionUserId(client: Client): Promise<string | null> {
  const { data, error } = await client.auth.getUser();
  return error || !data.user ? null : data.user.id;
}

export interface SessionProfile {
  displayName: string | null;
  lastActiveAt: string;
  deletionRequestedAt: string | null;
}

export async function getSessionProfile(
  client: Client,
  userId: string,
): Promise<SessionProfile | null> {
  const { data } = await client
    .from("profiles")
    .select("display_name, last_active_at, deletion_requested_at")
    .eq("id", userId)
    .maybeSingle();
  return data
    ? {
        displayName: data.display_name,
        lastActiveAt: data.last_active_at,
        deletionRequestedAt: data.deletion_requested_at,
      }
    : null;
}

/** ¿Pertenece al menos a un círculo? (RLS deja ver solo los propios). */
export async function hasAnyCircle(client: Client): Promise<boolean> {
  const { data } = await client.from("circles").select("id").limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Anota actividad como máximo una vez por día (UTC). Sirve para la regla de
 * inactividad de 12 meses; un fallo aquí nunca interrumpe la navegación.
 */
export async function touchLastActive(
  client: Client,
  userId: string,
  lastActiveAt: string,
  now: Date,
): Promise<boolean> {
  if (lastActiveAt.slice(0, 10) === now.toISOString().slice(0, 10)) {
    return false;
  }
  const { error } = await client
    .from("profiles")
    .update({ last_active_at: now.toISOString() })
    .eq("id", userId);
  return !error;
}
