import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resendMailer } from "@/server/email/resend";
import { runDaily } from "@/server/jobs/daily";
import { hasCronSecret } from "@/server/security/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Lo llama pg_cron una vez al día. Borra cuentas vencidas, avisa la inactividad
// y limpia contadores. Responde solo conteos.
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
    const data = await runDaily({
      admin: createSupabaseAdminClient(),
      now: new Date(),
      mailer: resendMailer(),
    });
    return Response.json(
      { ok: true, data },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error: { code: "internal", message: "El trabajo diario falló." },
      },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
