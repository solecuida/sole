import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;
const NO_STORE = { "cache-control": "no-store" };

/** Pide una fila de `organizations` (también mantiene vivo el proyecto gratuito). */
async function dbIsUp(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
  try {
    const query = createSupabaseAdminClient()
      .from("organizations")
      .select("id", { head: true })
      .limit(1)
      .abortSignal(controller.signal)
      .then(({ error }) => error === null);
    const timeout = new Promise<boolean>((resolve) => {
      controller.signal.addEventListener("abort", () => resolve(false));
    });
    return await Promise.race([query, timeout]);
  } catch {
    // Nunca se devuelve el mensaje interno: solo si la base responde o no.
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(): Promise<Response> {
  if (!(await dbIsUp())) {
    return Response.json(
      { ok: false, error: { code: "db_unavailable" } },
      { status: 503, headers: NO_STORE },
    );
  }
  return Response.json(
    {
      ok: true,
      data: { status: "ok", db: "ok", time: new Date().toISOString() },
    },
    { headers: NO_STORE },
  );
}
