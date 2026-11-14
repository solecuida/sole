import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IMPORTANCE_LABELS, KIND_GROUP_LABELS } from "@/lib/reminders/labels";
import { Constants } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import { describeRule } from "@/server/reminders/describe";
import { listReminders } from "@/server/reminders/reminders";

export const metadata: Metadata = { title: "Recordatorios" };

const linkButton =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 px-5 py-2 text-lg font-bold no-underline";

export default async function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const params = await searchParams;
  const circle = await resolveActiveCircle(
    supabase,
    typeof params.c === "string" ? params.c : null,
  );
  if (!circle) {
    redirect("/bienvenida");
  }
  const reminders = await listReminders(supabase, circle.id);
  const groups = Constants.public.Enums.reminder_kind
    .map((kind) => ({
      kind,
      items: reminders.filter((reminder) => reminder.kind === kind),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Recordatorios</h1>
      <p className="text-fg-muted">
        Lo que Sole te recuerda de {circle.caredName}.
      </p>

      <Link
        href={`/recordatorios/editar?c=${circle.id}`}
        className={`${linkButton} border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover`}
      >
        Nuevo recordatorio
      </Link>

      {groups.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-4">
          Todavía no hay recordatorios. Crea el primero.
        </p>
      ) : null}

      {groups.map((group) => (
        <section
          key={group.kind}
          aria-labelledby={`grupo-${group.kind}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`grupo-${group.kind}`} className="text-xl font-bold">
            {KIND_GROUP_LABELS[group.kind]}
          </h2>
          <ul className="flex flex-col gap-3">
            {group.items.map((reminder) => (
              <li
                key={reminder.id}
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
              >
                <h3 className="text-lg font-bold">{reminder.title}</h3>
                <p>{describeRule(reminder.rule)}</p>
                {reminder.medName ? (
                  <p className="text-base text-fg-muted">
                    {reminder.medName}
                    {reminder.medInstructions
                      ? ` · ${reminder.medInstructions}`
                      : ""}
                  </p>
                ) : null}
                <p className="text-base text-fg-muted">
                  {IMPORTANCE_LABELS[reminder.importance]}
                  {reminder.visibleToCared
                    ? ` · Visible para ${circle.caredName}`
                    : ""}
                </p>
                <Link
                  href={`/recordatorios/editar?id=${reminder.id}`}
                  aria-label={`Editar ${reminder.title}`}
                  className={`${linkButton} self-start border-border-strong bg-background text-fg hover:bg-surface`}
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
