import type { SupabaseClient } from "@supabase/supabase-js";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import type { ResolvedLink } from "@/server/cared-link/links";
import { emergencyContactFor } from "@/server/contacts/contacts";
import {
  type PushPayload,
  type PushSender,
  sendToUser,
} from "@/server/push/send";
import { checkRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";

type Admin = SupabaseClient<Database>;

/**
 * Número al que se llama si el círculo no tiene contacto de emergencia.
 * 131 es el SAMU en Chile. [VERIFICAR en fuente oficial] antes de lanzar
 * (docs/lanzamiento.md).
 */
export const FALLBACK_EMERGENCY_NUMBER = "131";

export type EmergencyErrorCode = "rate_limited" | "internal";

export function emergencyNotice(
  caredName: string,
  circleId: string,
): PushPayload {
  return {
    title: `Emergencia: ${caredName} pidió ayuda`,
    body: "Llámala o anda a verla ahora.",
    url: "/hoy",
    tag: `emergencia-${circleId}`,
    urgent: true,
    requireInteraction: true,
  };
}

/**
 * La persona cuidada pidió ayuda desde su vista.
 *
 * Deja constancia, avisa a quienes cuidan y devuelve el número al que llamar.
 * El aviso es un apoyo, no una garantía: puede no llegar. Por eso la respuesta
 * SIEMPRE trae un número, y la vista ofrece la llamada antes que nada.
 *
 * `link` es un vínculo ya comprobado con `resolveLink`; todo queda atado a su círculo.
 */
export async function triggerEmergency({
  admin,
  link,
  sender,
  now = new Date(),
}: {
  admin: Admin;
  link: ResolvedLink;
  sender: PushSender;
  now?: Date;
}): Promise<Result<{ callNumber: string }, EmergencyErrorCode>> {
  // Tope por vínculo: un botón apretado muchas veces (o un enlace filtrado) no
  // puede inundar de avisos a la familia.
  const { limit, windowSeconds } = RATE_LIMITS.emergency;
  const rate = await checkRateLimit(
    "emergency",
    link.linkId,
    limit,
    windowSeconds,
  );
  if (!rate.allowed) {
    return fail(
      "rate_limited",
      "Ya pediste ayuda hace poco. Si es urgente, llama por teléfono.",
    );
  }

  const event = await admin
    .from("emergency_events")
    .insert({ circle_id: link.circleId, link_id: link.linkId })
    .select("id")
    .single();
  if (event.error || !event.data) {
    return fail("internal", "No pudimos registrar el pedido de ayuda.");
  }

  const caregivers = await admin
    .from("circle_members")
    .select("user_id")
    .eq("circle_id", link.circleId)
    .eq("role", "caregiver")
    .limit(20);
  const payload = emergencyNotice(link.caredName, link.circleId);
  let recipients = 0;
  for (const member of caregivers.data ?? []) {
    const outcome = await sendToUser(
      admin,
      member.user_id,
      payload,
      sender,
      now,
    );
    recipients += outcome.sent;
  }
  await admin
    .from("emergency_events")
    .update({ recipients: Math.min(recipients, 32000) })
    .eq("id", event.data.id);

  const contact = await emergencyContactFor(admin, link.circleId);
  return ok({ callNumber: contact?.phone ?? FALLBACK_EMERGENCY_NUMBER });
}
