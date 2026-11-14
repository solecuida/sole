import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { webPushSender } from "@/server/push/send";
import { runDispatch } from "@/server/reminders/dispatch";
import { hasCronSecret } from "@/server/security/cron-auth";

export const dynamic = "force-dynamic";
/** El turno dura menos que el minuto entre llamadas. */
export const maxDuration = 55;

// Lo llama pg_cron cada minuto (en local: `pnpm -C app cron:dispatch`).
export async function POST(request: Request): Promise<Response> {
  if (!hasCronSecret(request)) {
    return Response.json(
      {
        ok: false,
        error: { code: "unauthorized", message: "No autorizado." },
      },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }
  try {
    const data = await runDispatch({
      admin: createSupabaseAdminClient(),
      now: new Date(),
      sender: webPushSender(),
    });
    return Response.json(
      { ok: true, data },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error: { code: "internal", message: "El despachador falló." },
      },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
