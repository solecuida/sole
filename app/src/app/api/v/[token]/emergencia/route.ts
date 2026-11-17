import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { triggerEmergency } from "@/server/cared-link/emergency";
import { resolveLink } from "@/server/cared-link/links";
import { apiError, apiOk } from "@/server/http";
import { webPushSender } from "@/server/push/send";

export const dynamic = "force-dynamic";

// Botón "Pedir ayuda" de la vista de la persona cuidada. Avisa a quien cuida y
// devuelve el número al que llamar: la llamada es el camino confiable, el aviso
// puede no llegar.
export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const link = await resolveLink(admin, token, now);
  if (!link) {
    return apiError("not_found");
  }
  const result = await triggerEmergency({
    admin,
    link,
    sender: webPushSender(),
    now,
  });
  if (!result.ok) {
    return apiError(
      result.error.code === "rate_limited" ? "rate_limited" : "internal",
    );
  }
  return apiOk({ callNumber: result.data.callNumber });
}
