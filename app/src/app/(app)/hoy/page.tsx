import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InstallGuide } from "@/components/onboarding/install-guide";
import { OccurrenceItem } from "@/components/today/occurrence-item";
import {
  formatLongDate,
  IMPORTANCE_LABELS,
  KIND_LABELS,
} from "@/lib/reminders/labels";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionProfile, getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import { pushStatus } from "@/server/push/subscriptions";
import { getToday } from "@/server/today/today";

export const metadata: Metadata = { title: "Hoy" };

const IMPORTANCE_ORDER = ["important", "normal", "whenever"] as const;

export default async function TodayPage({
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
  const circle = await resolveActiveCircle(
    supabase,
    typeof params.c === "string" ? params.c : null,
  );
  if (!circle) {
    redirect("/bienvenida");
  }
  const [profile, today, push] = await Promise.all([
    getSessionProfile(supabase, userId),
    getToday(supabase, createSupabaseAdminClient(), circle.id, new Date()),
    pushStatus(supabase),
  ]);
  if (!today) {
    redirect("/bienvenida");
  }

  const { day, week } = today.progress;
  const hasItems = day.total > 0;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold leading-tight">
          Hola{profile?.displayName ? `, ${profile.displayName}` : ""}
        </h1>
        <p className="text-xl">
          Hoy acompañas a <strong>{today.caredName}</strong>.
        </p>
        <p className="text-base text-fg-muted">
          {formatLongDate(today.localDate)}
        </p>
      </div>

      {params.bienvenida === "1" ? (
        <>
          <p
            role="status"
            className="rounded-card border border-success bg-success-bg p-4 text-success"
          >
            Listo, ya quedó todo guardado. Bienvenida a Sole.
          </p>
          <InstallGuide />
        </>
      ) : null}

      {!push.active ? (
        <p className="rounded-card border border-info bg-info-bg p-4 text-info">
          Los avisos están desactivados: por ahora lo pendiente solo se ve aquí.{" "}
          <Link href="/avisos" className="font-bold text-info">
            Activar avisos
          </Link>
        </p>
      ) : null}

      {hasItems ? (
        <p className="text-lg">
          <strong>
            Vas {day.done} de {day.total} hoy.
          </strong>{" "}
          {week.total > day.total ? (
            <span className="text-fg-muted">
              Esta semana: {week.done} de {week.total}.
            </span>
          ) : null}
        </p>
      ) : (
        <p className="rounded-card border border-border bg-surface p-4">
          Hoy no hay nada pendiente. Si quieres,{" "}
          <Link href={`/recordatorios/editar?c=${today.circleId}`}>
            agrega un recordatorio
          </Link>
          .
        </p>
      )}

      {IMPORTANCE_ORDER.map((importance) => {
        const items = today.groups[importance];
        if (items.length === 0) {
          return null;
        }
        return (
          <section
            key={importance}
            aria-labelledby={`grupo-${importance}`}
            className="flex flex-col gap-3"
          >
            <h2 id={`grupo-${importance}`} className="text-xl font-bold">
              {IMPORTANCE_LABELS[importance]}
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <OccurrenceItem key={`${item.id}-${item.status}`} item={item} />
              ))}
            </ul>
          </section>
        );
      })}

      {today.upcoming.length > 0 ? (
        <section
          aria-labelledby="proximos-dias"
          className="flex flex-col gap-3"
        >
          <h2 id="proximos-dias" className="text-xl font-bold">
            Próximos días
          </h2>
          <ul className="flex flex-col gap-2">
            {today.upcoming.map((item) => (
              <li
                key={`${item.reminderId}-${item.date}-${item.time}`}
                className="rounded-card border border-border bg-surface p-4"
              >
                <p className="text-base text-fg-muted">
                  {formatLongDate(item.date)} · {item.time} ·{" "}
                  {KIND_LABELS[item.kind]}
                </p>
                <p className="text-lg font-bold">{item.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
