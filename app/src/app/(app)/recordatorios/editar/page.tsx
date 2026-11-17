import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { defaultFormValues, formValuesFromStored } from "@/lib/reminders/form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { localDate, resolveActiveCircle } from "@/server/circles/circles";
import { track } from "@/server/events/track";
import { getReminder } from "@/server/reminders/reminders";
import { removeReminder, saveReminder } from "../actions";

export const metadata: Metadata = { title: "Recordatorio" };

const single = (value: string | string[] | undefined) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export default async function EditReminderPage({
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
  const id = single(params.id);
  const requestedDate = single(params.fecha);

  const existing = id ? await getReminder(supabase, id) : null;
  if (id && !existing) {
    notFound();
  }
  const circle = await resolveActiveCircle(
    supabase,
    existing?.circleId ?? single(params.c),
  );
  if (!circle) {
    redirect("/bienvenida");
  }

  const startDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : localDate(new Date(), circle.timezone);
  if (!existing) {
    await track(supabase, userId, "flow.started", { flow: "reminder_create" });
  }

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">
        {existing ? "Editar recordatorio" : "Nuevo recordatorio"}
      </h1>
      <p className="text-fg-muted">Para {circle.caredName}.</p>
      <ReminderForm
        circleId={circle.id}
        caredName={circle.caredName}
        reminderId={existing?.id}
        initialValues={
          existing
            ? formValuesFromStored(existing)
            : defaultFormValues(startDate)
        }
        save={saveReminder}
        remove={removeReminder}
      />
    </>
  );
}
