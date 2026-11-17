import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { markDoneFromLink, resolveLink } from "@/server/cared-link/links";
import { apiError, apiOk, readJson } from "@/server/http";
import { checkRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ occurrenceId: z.uuid() });

// "Listo" desde la vista de la persona cuidada. No hay sesión: el enlace es la
// credencial. Un enlace que no sirve y un ítem que no es suyo responden lo
// mismo (404), para no revelar qué existe.
export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const link = await resolveLink(admin, token, now);
  if (!link) {
    return apiError("not_found");
  }
  const { limit, windowSeconds } = RATE_LIMITS.cared_done;
  const rate = await checkRateLimit(
    "cared_done",
    link.linkId,
    limit,
    windowSeconds,
  );
  if (!rate.allowed) {
    return apiError("rate_limited");
  }
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("not_found");
  }
  const result = await markDoneFromLink(
    admin,
    link,
    parsed.data.occurrenceId,
    now,
  );
  if (!result.ok) {
    return apiError(
      result.error.code === "internal" ? "internal" : "not_found",
    );
  }
  return apiOk({ occurrenceId: result.data.occurrenceId, status: "done" });
}
