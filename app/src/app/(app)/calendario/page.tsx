import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MonthGrid } from "@/components/calendar/month-grid";
import {
  IMPORTANCE_LABELS,
  KIND_LABELS,
  MONTH_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import {
  addDays,
  buildMonth,
  buildWeek,
  type CalendarDay,
  isoWeekdayOf,
  mondayOf,
} from "@/server/calendar/calendar";
import { localDate, resolveActiveCircle } from "@/server/circles/circles";
import { listReminders } from "@/server/reminders/reminders";
import { dateSchema } from "@/server/reminders/rule-schema";

export const metadata: Metadata = { title: "Calendario" };

const linkButton =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 px-5 py-2 text-lg font-bold no-underline";
const neutral = `${linkButton} border-border-strong bg-background text-fg hover:bg-surface`;
const active = `${linkButton} border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover`;

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** `2027-03-10` → "10 de marzo" */
function shortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} de ${MONTH_LABELS[month - 1]}`;
}

/** Primer día del mes que queda `delta` meses antes o después. */
function shiftMonth(date: string, delta: number): string {
  const [year, month] = date.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

function DayBlock({
  day,
  circleId,
  Heading,
}: {
  day: CalendarDay;
  circleId: string;
  Heading: "h2" | "h3";
}) {
  const weekday = WEEKDAY_LABELS[isoWeekdayOf(day.date) - 1];
  return (
    <li className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <Heading className="text-lg font-bold">
        {weekday.charAt(0).toUpperCase() + weekday.slice(1)}{" "}
        {shortDate(day.date)}
      </Heading>
      {day.items.length === 0 ? (
        <p className="text-fg-muted">Nada programado.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {day.items.map((item) => (
            <li key={`${item.reminderId}-${item.time}`}>
              <span className="font-bold">{item.time}</span> · {item.title}
              <span className="text-base text-fg-muted">
                {" "}
                ({KIND_LABELS[item.kind]}
                {item.importance === "important"
                  ? ` · ${IMPORTANCE_LABELS.important}`
                  : ""}
                )
              </span>
            </li>
          ))}
        </ul>
      )}
      <Link
        href={`/recordatorios/editar?fecha=${day.date}&c=${circleId}`}
        aria-label={`Agregar el ${shortDate(day.date)}`}
        className={`${neutral} self-start`}
      >
        Agregar
      </Link>
    </li>
  );
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const params = await searchParams;
  const circle = await resolveActiveCircle(supabase, single(params.c));
  if (!circle) {
    redirect("/bienvenida");
  }

  const today = localDate(new Date(), circle.timezone);
  const requested = dateSchema.safeParse(single(params.fecha));
  const date = requested.success ? requested.data : today;
  const view = single(params.vista) === "semana" ? "semana" : "mes";
  const reminders = await listReminders(supabase, circle.id);

  const link = (vista: string, fecha: string) =>
    `/calendario?vista=${vista}&fecha=${fecha}&c=${circle.id}`;

  let previous: string;
  let next: string;
  let subtitle: string;
  if (view === "mes") {
    previous = shiftMonth(date, -1);
    next = shiftMonth(date, 1);
    subtitle = `${MONTH_LABELS[Number(date.slice(5, 7)) - 1]} de ${date.slice(0, 4)}`;
  } else {
    previous = addDays(date, -7);
    next = addDays(date, 7);
    const monday = mondayOf(date);
    const sunday = addDays(monday, 6);
    subtitle = `Del ${shortDate(monday)} al ${shortDate(sunday)} de ${sunday.slice(0, 4)}`;
  }

  const weeks =
    view === "mes"
      ? buildMonth(
          reminders,
          circle.timezone,
          Number(date.slice(0, 4)),
          Number(date.slice(5, 7)),
        )
      : [];
  const weekDays =
    view === "semana" ? buildWeek(reminders, circle.timezone, date) : [];
  const monthDaysWithItems = weeks
    .flat()
    .filter((day) => day.inMonth && day.items.length > 0);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Calendario</h1>
      <p className="text-fg-muted">{subtitle}</p>

      <nav aria-label="Vista del calendario" className="flex gap-3">
        <Link
          href={link("mes", date)}
          aria-current={view === "mes" ? "page" : undefined}
          className={view === "mes" ? active : neutral}
        >
          Mes
        </Link>
        <Link
          href={link("semana", date)}
          aria-current={view === "semana" ? "page" : undefined}
          className={view === "semana" ? active : neutral}
        >
          Semana
        </Link>
      </nav>

      <nav
        aria-label="Moverse en el calendario"
        className="flex flex-wrap gap-3"
      >
        <Link href={link(view, previous)} className={neutral}>
          Anterior
        </Link>
        <Link href={link(view, today)} className={neutral}>
          Hoy
        </Link>
        <Link href={link(view, next)} className={neutral}>
          Siguiente
        </Link>
      </nav>

      {view === "mes" ? (
        <>
          <MonthGrid
            weeks={weeks}
            caption={subtitle}
            circleId={circle.id}
            today={today}
          />
          <section aria-labelledby="lista-mes" className="flex flex-col gap-3">
            <h2 id="lista-mes" className="text-xl font-bold">
              Lo programado este mes
            </h2>
            {monthDaysWithItems.length === 0 ? (
              <p className="rounded-card border border-border bg-surface p-4">
                Este mes no hay nada programado. Toca + en un día para agregar
                un recordatorio.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {monthDaysWithItems.map((day) => (
                  <DayBlock
                    key={day.date}
                    day={day}
                    circleId={circle.id}
                    Heading="h3"
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <section aria-label="Los siete días de la semana">
          <ul className="flex flex-col gap-3">
            {weekDays.map((day) => (
              <DayBlock
                key={day.date}
                day={day}
                circleId={circle.id}
                Heading="h2"
              />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
