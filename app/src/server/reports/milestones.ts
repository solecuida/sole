import { addDays } from "@/server/calendar/calendar";
import { localDateOf } from "@/server/reminders/recurrence";
import type { ReportRows } from "@/server/reports/summary";

export type MilestoneKey = "medicamentos_30_dias" | "un_mes_con_sole";

export interface Milestone {
  key: MilestoneKey;
  text: string;
}

const STREAK_DAYS = 30;

/**
 * Hitos que se cumplen con lo observado, sin premios ni puntajes. `rows` debe
 * cubrir al menos los últimos 30 días. Puro: el día de hoy sale de `now`.
 */
export function milestones(rows: ReportRows, now: Date): Milestone[] {
  const today = localDateOf(now, rows.timezone);
  const found: Milestone[] = [];

  const meds = rows.occurrences.filter(
    (row) => row.kind === "medication" && row.status !== "skipped",
  );
  const onDay = (date: string) => meds.filter((row) => row.localDate === date);

  // Hoy todavía puede estar en curso: si queda algo por marcar, la racha se
  // mide hasta ayer; si ya hay algo "no hecho", la racha se cortó.
  const todays = onDay(today);
  const missedToday = todays.some((row) => row.status === "not_done");
  const todayComplete =
    todays.length > 0 && todays.every((row) => row.status === "done");
  const last = todayComplete ? today : addDays(today, -1);

  if (!missedToday) {
    let streak = true;
    for (let back = 0; back < STREAK_DAYS && streak; back += 1) {
      const items = onDay(addDays(last, -back));
      streak = items.length > 0 && items.every((row) => row.status === "done");
    }
    if (streak) {
      found.push({
        key: "medicamentos_30_dias",
        text: "30 días seguidos sin olvidar un medicamento.",
      });
    }
  }

  if (
    rows.firstActivity &&
    rows.firstActivity <= addDays(today, -STREAK_DAYS)
  ) {
    found.push({ key: "un_mes_con_sole", text: "Un mes cuidando con Sole." });
  }
  return found;
}
