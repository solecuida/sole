import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Cliente con la clave secreta: se salta RLS. Solo lo importan `src/server/**`,
 * las rutas de cron/admin/tokens y las pruebas, y siempre después de validar
 * quién pide (sesión, secreto de cron o token).
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error("El cliente admin de Supabase solo existe en el servidor.");
  }
  return createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
