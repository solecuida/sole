import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PushSettings } from "@/components/push/push-settings";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { readEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import {
  getNotificationPreferences,
  pushStatus,
  updateNotificationPreferences,
} from "@/server/push/subscriptions";

export const metadata: Metadata = { title: "Avisos" };

async function savePreferences(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const time = formData.get("journalReminderTime");
  const result = await updateNotificationPreferences(supabase, userId, {
    followupMinutes: Number(formData.get("followupMinutes")),
    journalReminderTime: typeof time === "string" && time !== "" ? time : null,
  });
  revalidatePath("/avisos");
  redirect(`/avisos?${result.ok ? "guardado=1" : "error=1"}`);
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const params = await searchParams;
  const [status, preferences] = await Promise.all([
    pushStatus(supabase),
    getNotificationPreferences(supabase, userId),
  ]);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Avisos</h1>

      <PushSettings
        vapidPublicKey={readEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY") ?? null}
        initialCount={status.count}
      />

      <section
        aria-labelledby="preferencias-titulo"
        className="flex flex-col gap-4"
      >
        <h2 id="preferencias-titulo" className="text-xl font-bold">
          Cómo te avisamos
        </h2>
        <div aria-live="polite">
          {params.guardado === "1" ? (
            <p className="rounded-card border border-success bg-success-bg p-4 text-success">
              Guardado.
            </p>
          ) : null}
        </div>
        {params.error === "1" ? (
          <p
            role="alert"
            className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
          >
            Los minutos deben estar entre 5 y 120, y la hora entre 00:00 y
            23:59.
          </p>
        ) : null}
        <form action={savePreferences} className="flex flex-col gap-4">
          <Field
            id="followupMinutes"
            name="followupMinutes"
            type="number"
            inputMode="numeric"
            min={5}
            max={120}
            label="Minutos antes de preguntarte «¿Lo hiciste?»"
            hint="Si no marcas un recordatorio, Sole te pregunta después de este tiempo. Entre 5 y 120 minutos."
            defaultValue={preferences.followupMinutes}
          />
          <Field
            id="journalReminderTime"
            name="journalReminderTime"
            type="time"
            label="Hora para sugerirte la bitácora (opcional)"
            hint="Una vez al día. Déjalo en blanco si no quieres que te lo sugiera."
            defaultValue={preferences.journalReminderTime ?? ""}
          />
          <SubmitButton variant="secondary">Guardar</SubmitButton>
        </form>
      </section>
    </>
  );
}
