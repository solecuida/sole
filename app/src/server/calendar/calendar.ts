import { tzOffset } from "@date-fns/tz";
import { expandRule, zonedInstant } from "@/server/reminders/recurrence";
import type { Importance, ReminderKind } from "@/server/reminders/reminders";
import type { ReminderRule } from "@/server/reminders/rule-schema";

// Calendario de mes y de semana. Módulo puro: calcula desde las reglas de
// repetición, así muestra meses futuros sin guardar cada día. Semanas de lunes a
// domingo; todo día es un día local `YYYY-MM-DD` en la zona del círculo.

const MINUTE = 60_000;
const DAY = 86_400_000;

/** Los campos de un recordatorio que el calendario necesita. */
export interface CalendarReminder {
  id: string;
  title: string;
  kind: ReminderKind;
  importance: Importance;
  rule: ReminderRule;
}

export interface CalendarItem {
  reminderId: string;
  title: string;
  /** Hora local `HH:MM`. */
  time: string;
  importance: Importance;
  kind: ReminderKind;
}

export interface CalendarDay {
  date: string;
  inMonth: boolean;
  items: CalendarItem[];
}

function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY);
}

function dateOfDayNumber(value: number): string {
  return new Date(value * DAY).toISOString().slice(0, 10);
}

/** Suma días a un día local. */
export function addDays(date: string, days: number): string {
  return dateOfDayNumber(dayNumber(date) + days);
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export function isoWeekdayOf(date: string): number {
  // 1970-01-01 fue jueves.
  return ((((dayNumber(date) + 3) % 7) + 7) % 7) + 1;
}

/** Lunes de la semana que contiene el día. */
export function mondayOf(date: string): string {
  return addDays(date, 1 - isoWeekdayOf(date));
}

function localTime(instant: Date, tz: string): string {
  return new Date(instant.getTime() + tzOffset(tz, instant) * MINUTE)
    .toISOString()
    .slice(11, 16);
}

/** Días consecutivos desde `first` hasta `last` (incluidos), con sus ítems. */
function buildDays(
  reminders: readonly CalendarReminder[],
  tz: string,
  first: string,
  last: string,
  inMonth: (date: string) => boolean,
): CalendarDay[] {
  const days: CalendarDay[] = [];
  for (let n = dayNumber(first); n <= dayNumber(last); n += 1) {
    const date = dateOfDayNumber(n);
    const from = zonedInstant(date, "00:00", tz);
    const to = zonedInstant(date, "23:59", tz);
    const items: CalendarItem[] = [];
    for (const reminder of reminders) {
      for (const instant of expandRule(reminder.rule, tz, from, to)) {
        items.push({
          reminderId: reminder.id,
          title: reminder.title,
          time: localTime(instant, tz),
          importance: reminder.importance,
          kind: reminder.kind,
        });
      }
    }
    items.sort(
      (a, b) =>
        a.time.localeCompare(b.time) || a.title.localeCompare(b.title, "es"),
    );
    days.push({ date, inMonth: inMonth(date), items });
  }
  return days;
}

/**
 * Semanas completas (lunes a domingo) del mes `month` (1–12) de `year`; los días
 * del mes anterior y siguiente que completan la grilla llevan `inMonth: false`.
 */
export function buildMonth(
  reminders: readonly CalendarReminder[],
  tz: string,
  year: number,
  month: number,
): CalendarDay[][] {
  const pad = (value: number) => String(value).padStart(2, "0");
  const firstOfMonth = `${year}-${pad(month)}-01`;
  const lastOfMonth = dateOfDayNumber(
    Math.floor(Date.UTC(year, month, 0) / DAY),
  );
  const start = mondayOf(firstOfMonth);
  const end = addDays(mondayOf(lastOfMonth), 6);
  const days = buildDays(
    reminders,
    tz,
    start,
    end,
    (date) => date >= firstOfMonth && date <= lastOfMonth,
  );
  const weeks: CalendarDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

/** Los siete días (lunes a domingo) de la semana que contiene `isoDate`. */
export function buildWeek(
  reminders: readonly CalendarReminder[],
  tz: string,
  isoDate: string,
): CalendarDay[] {
  const monday = mondayOf(isoDate);
  return buildDays(reminders, tz, monday, addDays(monday, 6), () => true);
}
