import type { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

type Admin = SupabaseClient<Database>;

/** Lo que recibe el service worker. Nunca lleva el nombre de un medicamento. */
export interface PushPayload {
  title: string;
  body: string;
  /** Pantalla que se abre al tocar el aviso. */
  url: string;
  /** Avisos con la misma etiqueta se reemplazan en vez de acumularse. */
  tag: string;
  occurrenceId?: string;
  actions?: { action: string; title: string }[];
  /** Importantes y emergencias: se entregan aunque el teléfono esté ahorrando batería. */
  urgent?: boolean;
  /** El aviso se queda en pantalla hasta que alguien lo atienda (emergencias). */
  requireInteraction?: boolean;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Envía un aviso a un navegador. Se inyecta para que las pruebas usen un
 * emisor falso: nunca se prueba contra los servidores de Google o Apple.
 */
export type PushSender = (
  target: PushTarget,
  payload: PushPayload,
) => Promise<{ statusCode: number }>;

/** Emisor real: Web Push con las claves VAPID del servidor. */
export function webPushSender(): PushSender {
  const vapidDetails = {
    subject: requireEnv("VAPID_SUBJECT"),
    publicKey: requireEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    privateKey: requireEnv("VAPID_PRIVATE_KEY"),
  };
  return async (target, payload) => {
    try {
      const response = await webpush.sendNotification(
        {
          endpoint: target.endpoint,
          keys: { p256dh: target.p256dh, auth: target.auth },
        },
        JSON.stringify(payload),
        {
          vapidDetails,
          TTL: 3600,
          urgency: payload.urgent ? "high" : "normal",
        },
      );
      return { statusCode: response.statusCode };
    } catch (error) {
      const statusCode =
        error instanceof webpush.WebPushError ? error.statusCode : 0;
      return { statusCode: statusCode || 500 };
    }
  };
}

/**
 * Envía un aviso a todos los teléfonos y navegadores de una usuaria y mantiene
 * al día sus suscripciones:
 *   404 o 410 → el navegador ya no existe: se borra la suscripción.
 *   otro error → se cuenta el fallo.
 *   éxito     → se anota la fecha y se reinicia el contador.
 */
export async function sendToUser(
  admin: Admin,
  userId: string,
  payload: PushPayload,
  sender: PushSender,
  now: Date = new Date(),
): Promise<{ sent: number; removed: number; failed: number }> {
  const { data } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, failed_count")
    .eq("user_id", userId)
    .limit(20);

  const outcome = { sent: 0, removed: 0, failed: 0 };
  for (const subscription of data ?? []) {
    let statusCode: number;
    try {
      ({ statusCode } = await sender(subscription, payload));
    } catch {
      statusCode = 500;
    }
    if (statusCode === 404 || statusCode === 410) {
      await admin.from("push_subscriptions").delete().eq("id", subscription.id);
      outcome.removed += 1;
    } else if (statusCode >= 200 && statusCode < 300) {
      await admin
        .from("push_subscriptions")
        .update({ last_success_at: now.toISOString(), failed_count: 0 })
        .eq("id", subscription.id);
      outcome.sent += 1;
    } else {
      await admin
        .from("push_subscriptions")
        .update({
          failed_count: Math.min(subscription.failed_count + 1, 32000),
        })
        .eq("id", subscription.id);
      outcome.failed += 1;
    }
  }
  return outcome;
}
