import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

/** Lo que entrega el navegador al suscribirse (PushSubscription.toJSON()). */
export const subscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

export type BrowserSubscription = z.infer<typeof subscriptionSchema>;

export interface PushStatus {
  /** ¿Tiene al menos un teléfono o navegador con avisos activos? */
  active: boolean;
  count: number;
}

export type PushErrorCode = "validation_failed" | "internal";

/**
 * Guarda la suscripción del navegador para esta usuaria. Un mismo navegador
 * pertenece a una sola cuenta: si otra persona lo usó antes (teléfono compartido),
 * su fila se borra, y eso requiere el cliente admin porque RLS no deja verla.
 */
export async function saveSubscription(
  client: Client,
  admin: Client,
  userId: string,
  subscription: BrowserSubscription,
  userAgent: string | null,
): Promise<Result<PushStatus, PushErrorCode>> {
  await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", subscription.endpoint)
    .neq("user_id", userId);

  const { error } = await client.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent?.slice(0, 300) ?? null,
      failed_count: 0,
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    return fail(
      "internal",
      "No pudimos activar los avisos. Prueba de nuevo en un momento.",
    );
  }
  return ok(await pushStatus(client));
}

/** Borra la suscripción de ese navegador. RLS solo deja borrar las propias. */
export async function removeSubscription(
  client: Client,
  endpoint: string,
): Promise<Result<PushStatus, PushErrorCode>> {
  const { error } = await client
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) {
    return fail(
      "internal",
      "No pudimos desactivar los avisos. Prueba de nuevo en un momento.",
    );
  }
  return ok(await pushStatus(client));
}

export async function pushStatus(client: Client): Promise<PushStatus> {
  const { count } = await client
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true });
  return { active: (count ?? 0) > 0, count: count ?? 0 };
}

export const notificationPreferencesSchema = z.object({
  /** Minutos de espera antes del "¿Lo hiciste?". */
  followupMinutes: z.number().int().min(5).max(120),
  /** Hora sugerida para la bitácora (`HH:MM`), o null para no sugerir. */
  journalReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
});

export interface NotificationPreferences {
  followupMinutes: number;
  journalReminderTime: string | null;
}

export async function getNotificationPreferences(
  client: Client,
  userId: string,
): Promise<NotificationPreferences> {
  const { data } = await client
    .from("profiles")
    .select("followup_minutes, journal_reminder_time")
    .eq("id", userId)
    .maybeSingle();
  return {
    followupMinutes: data?.followup_minutes ?? 15,
    journalReminderTime: data?.journal_reminder_time?.slice(0, 5) ?? null,
  };
}

export async function updateNotificationPreferences(
  client: Client,
  userId: string,
  input: unknown,
): Promise<Result<NotificationPreferences, PushErrorCode>> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "validation_failed",
      "Los minutos deben estar entre 5 y 120, y la hora entre 00:00 y 23:59.",
    );
  }
  const { error } = await client
    .from("profiles")
    .update({
      followup_minutes: parsed.data.followupMinutes,
      journal_reminder_time: parsed.data.journalReminderTime,
    })
    .eq("id", userId);
  if (error) {
    return fail(
      "internal",
      "No pudimos guardar. Prueba de nuevo en un momento.",
    );
  }
  return ok(parsed.data);
}
