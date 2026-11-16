import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "not_admin" | "mfa_required" };

/**
 * ¿Quien tiene la sesión puede usar el panel del fundador?
 *
 * Exige las dos cosas: `profiles.is_admin` (que solo se asigna con SQL manual
 * del fundador; ninguna vía de la app lo concede) y una sesión con segundo
 * factor verificado (`aal2`).
 *
 * Esta comprobación decide qué se MUESTRA. Lo que protege los datos es RLS
 * (`private.is_admin_mfa()`), que vuelve a exigir lo mismo en cada consulta.
 */
export async function requireAdmin(client: Client): Promise<AdminCheck> {
  const { data: auth, error } = await client.auth.getUser();
  if (error || !auth.user) {
    return { ok: false, reason: "not_admin" };
  }
  const { data: profile } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (profile?.is_admin !== true) {
    return { ok: false, reason: "not_admin" };
  }
  // Se le pregunta a la base, con la misma función que usan las políticas RLS:
  // así vale igual si la sesión llegó por cookie o por token, y la pantalla
  // nunca opina distinto de los datos.
  const { data: withMfa } = await client.rpc("is_admin_with_mfa");
  if (withMfa !== true) {
    return { ok: false, reason: "mfa_required" };
  }
  return { ok: true, userId: auth.user.id };
}

/**
 * Deja constancia de un acceso o acción del administrador (brief 6.2 #30).
 * `action` y `target` son etiquetas cortas ("ver", "/admin/comentarios"):
 * nunca datos de una usuaria.
 */
export async function logAdminAccess(
  client: Client,
  action: string,
  target: string | null,
): Promise<boolean> {
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) {
    return false;
  }
  const { error } = await client.from("admin_audit_log").insert({
    admin_id: auth.user.id,
    action: action.slice(0, 80),
    target: target?.slice(0, 200) ?? null,
  });
  return !error;
}
