import type { SupabaseClient } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAccess, requireAdmin } from "@/server/admin/guard";

/**
 * Primera línea de TODA página y Server Action del panel:
 *
 *   const supabase = await adminPage("/admin/comentarios");
 *
 * Devuelve el cliente con la sesión del administrador, o corta la petición:
 *  - sin rol de administrador (o sin sesión) → 404, sin revelar que el panel existe;
 *  - sin segundo factor en esta sesión → /admin/mfa.
 * Además deja constancia del acceso en la auditoría.
 *
 * `action` es "ver" para una página; una acción que cambia algo pasa su propio
 * verbo ("crear organización", "marcar leído").
 */
export async function adminPage(
  target: string,
  action = "ver",
): Promise<SupabaseClient<Database>> {
  const supabase = await createSupabaseServerClient();
  const check = await requireAdmin(supabase);
  if (!check.ok) {
    if (check.reason === "mfa_required") {
      redirect("/admin/mfa");
    }
    notFound();
  }
  await logAdminAccess(supabase, action, target);
  return supabase;
}
