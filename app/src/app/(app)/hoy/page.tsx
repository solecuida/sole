import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InstallGuide } from "@/components/onboarding/install-guide";
import { OccurrenceItem } from "@/components/today/occurrence-item";
import { OfflineSync } from "@/components/today/offline-sync";
import { TipCard } from "@/components/today/tip-card";
import {
  formatLongDate,
  IMPORTANCE_LABELS,
  KIND_LABELS,
} from "@/lib/reminders/labels";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionProfile, getSessionUserId } from "@/server/auth/session";
import { listMyCircles } from "@/server/circles/circles";
import { pushStatus } from "@/server/push/subscriptions";
import {
  acceptActivity,
  getActiveTip,
  isActivityAccepted,
  listActiveTips,
  tipOfDay,
} from "@/server/today/tips";
import { getToday } from "@/server/today/today";

export const metadata: Metadata = { title: "Hoy" };

const IMPORTANCE_ORDER = ["important", "normal", "whenever"] as const;

/** Suma la actividad del día a "Hoy". Vuelve a comprobar sesión y pertenencia. */
async function acceptTip(
  circleId: string,
  tipId: string,
): Promise<{ ok: boolean; message?: string }> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return { ok: false, message: "Tu sesión terminó. Vuelve a entrar." };
  }
  const circle = (await listMyCircles(supabase)).find(
    (item) => item.id === circleId,
  );
  const tip = await getActiveTip(supabase, tipId);
  if (!circle || !tip) {
    return { ok: false, message: "No pudimos agregarla. Prueba de nuevo." };
  }
  const result = await acceptActivity(
    supabase,
    userId,
    circle.id,
    tip,
    new Date(),
    circle.timezone,
  );
  revalidatePath("/hoy");
  return result.ok
    ? { ok: true }
    : { ok: false, message: result.error.message };
}

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
  const circles = await listMyCircles(supabase);
  const requested = typeof params.c === "string" ? params.c : null;
  const circle =
    circles.find((item) => item.id === requested) ??
    circles.find((item) => item.closedAt === null) ??
    circles[0];
  if (!circle) {
    redirect("/bienvenida");
  }
  const [profile, today, push, tips] = await Promise.all([
    getSessionProfile(supabase, userId),
    getToday(supabase, createSupabaseAdminClient(), circle.id, new Date()),
    pushStatus(supabase),
    listActiveTips(supabase),
  ]);
  if (!today) {
    redirect("/bienvenida");
  }
  const tip = tipOfDay(tips, today.localDate, circle.careType);
  const tipAccepted = tip
    ? await isActivityAccepted(supabase, circle.id, tip, today.localDate)
    : false;

  const { day, week } = today.progress;
  // Lo que se guarda en el teléfono para ver "Hoy" sin señal: sin el nombre ni
  // la indicación de los medicamentos.
  const strip = (items: (typeof today.groups)["normal"]) =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      time: item.time,
      status: item.status,
      overdue: item.overdue,
      notDoneReason: item.notDoneReason,
      snoozedUntil: item.snoozedUntil,
    }));
  const snapshot = {
    circleId: today.circleId,
    caredName: today.caredName,
    localDate: today.localDate,
    groups: {
      important: strip(today.groups.important),
      normal: strip(today.groups.normal),
      whenever: strip(today.groups.whenever),
    },
  };

  return (
    <>
      {circles.length > 1 ? (
        <nav
          aria-label="Persona que estás viendo"
          className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
        >
          <p className="text-base text-fg-muted">
            Estás viendo:{" "}
            <strong className="text-fg">{circle.caredName}</strong>
          </p>
          <ul className="flex flex-wrap gap-2">
            {circles
              .filter((item) => item.id !== circle.id)
              .map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/hoy?c=${item.id}`}
                    className="inline-flex min-h-12 items-center rounded-control border-2 border-border-strong bg-background px-4 text-lg font-bold text-fg no-underline"
                  >
                    Ver a {item.caredName}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      ) : null}

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

      <OfflineSync snapshot={snapshot} />

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

      {day.total > 0 ? (
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

      {tip ? (
        <TipCard
          key={tip.id}
          text={tip.text}
          activityTitle={tip.kind === "actividad" ? tip.activityTitle : null}
          alreadyAccepted={tipAccepted}
          accept={acceptTip.bind(null, circle.id, tip.id)}
        />
      ) : null}

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
