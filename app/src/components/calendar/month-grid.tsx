import Link from "next/link";
import { MONTH_LABELS, WEEKDAY_LABELS } from "@/lib/reminders/labels";

// Tipo de lo que dibuja la grilla (lo arma `src/server/calendar/calendar.ts`).
export interface MonthGridDay {
  date: string;
  inMonth: boolean;
  items: { importance: string }[];
}

/** `2027-03-10` → "10 de marzo" */
function shortDate(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${day} de ${MONTH_LABELS[month - 1]}`;
}

function countText(count: number): string {
  if (count === 0) {
    return "Sin recordatorios";
  }
  return count === 1 ? "1 recordatorio" : `${count} recordatorios`;
}

export function MonthGrid({
  weeks,
  caption,
  circleId,
  today,
}: {
  weeks: MonthGridDay[][];
  caption: string;
  circleId: string;
  today: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <table className="w-full table-fixed border-collapse">
        <caption className="pb-2 text-left text-lg font-bold">
          {caption}
        </caption>
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((name) => (
              <th
                key={name}
                scope="col"
                className="border border-border px-0 py-1 text-center text-base font-bold"
              >
                <abbr title={name} className="no-underline">
                  {name.slice(0, 3)}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0].date}>
              {week.map((day) => {
                const important = day.items.some(
                  (item) => item.importance === "important",
                );
                const isToday = day.date === today;
                return (
                  <td
                    key={day.date}
                    className={`border p-0 align-top ${
                      day.inMonth
                        ? "bg-surface text-fg"
                        : "bg-background text-fg-muted"
                    } ${isToday ? "border-2 border-border-strong" : "border-border"}`}
                  >
                    <div className="flex flex-col items-center gap-0.5 px-0.5 pt-1">
                      <span className="text-base font-bold">
                        {Number(day.date.slice(8))}
                        {isToday ? (
                          <span className="sr-only"> (hoy)</span>
                        ) : null}
                      </span>
                      <span className="text-sm">
                        {day.items.length > 0 ? day.items.length : "·"}
                        <span className="sr-only">
                          {" "}
                          {countText(day.items.length)}
                        </span>
                      </span>
                      {important ? (
                        <span className="text-sm font-bold">
                          !<span className="sr-only"> Hay algo importante</span>
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/recordatorios/editar?fecha=${day.date}&c=${circleId}`}
                      aria-label={`Agregar el ${shortDate(day.date)}`}
                      className="flex min-h-12 w-full items-center justify-center text-lg font-bold text-primary no-underline"
                    >
                      +
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-base text-fg-muted">
        El número chico es la cantidad de recordatorios del día. El signo !
        marca que hay algo importante. Toca + para agregar uno ese día.
      </p>
    </div>
  );
}
