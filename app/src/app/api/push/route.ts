import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { track } from "@/server/events/track";
import { apiError, apiOk, readJson } from "@/server/http";
import { sendToUser, webPushSender } from "@/server/push/send";
import {
  pushStatus,
  removeSubscription,
  saveSubscription,
  subscriptionSchema,
} from "@/server/push/subscriptions";
import { checkRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("subscribe"),
    subscription: subscriptionSchema,
  }),
  z.object({
    action: z.literal("unsubscribe"),
    subscription: z.object({ endpoint: z.string().min(1).max(2000) }),
  }),
  z.object({ action: z.literal("test") }),
  // Respuesta de la persona al permiso del navegador (solo para la hipótesis H1).
  z.object({
    action: z.literal("permission"),
    result: z.enum(["granted", "denied", "default"]),
  }),
]);

// Alta, baja y prueba de los avisos de este navegador.
export async function POST(request: Request): Promise<Response> {
  const supabase = createSupabaseRouteClient(request);
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return apiError("unauthorized");
  }
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("validation_failed");
  }
  const body = parsed.data;

  if (body.action === "subscribe") {
    const result = await saveSubscription(
      supabase,
      createSupabaseAdminClient(),
      userId,
      body.subscription,
      request.headers.get("user-agent"),
    );
    return result.ok ? apiOk(result.data) : apiError("internal");
  }

  if (body.action === "unsubscribe") {
    const result = await removeSubscription(
      supabase,
      body.subscription.endpoint,
    );
    return result.ok ? apiOk(result.data) : apiError("internal");
  }

  if (body.action === "permission") {
    await track(supabase, userId, "push.permission", { result: body.result });
    return apiOk(await pushStatus(supabase));
  }

  const limit = await checkRateLimit(
    "push_test",
    userId,
    RATE_LIMITS.push_test.limit,
    RATE_LIMITS.push_test.windowSeconds,
  );
  if (!limit.allowed) {
    return apiError(
      "rate_limited",
      "Ya probaste varias veces. Espera una hora para volver a probar.",
    );
  }
  const status = await pushStatus(supabase);
  if (status.active) {
    await sendToUser(
      createSupabaseAdminClient(),
      userId,
      {
        title: "Sole",
        body: "Así se verá un aviso de Sole",
        url: "/avisos",
        tag: "prueba",
      },
      webPushSender(),
    );
  }
  return apiOk(await pushStatus(supabase));
}
