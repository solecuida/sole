import { tzOffset } from "@date-fns/tz";
import type { ReminderRule } from "@/server/reminders/rule-schema";

// Cálculo de fechas de los recordatorios. Módulo puro: sin base de datos, sin
// `new Date()` y sin la zona horaria del equipo. Todo instante es UTC; todo "día"
// es un día local `YYYY-MM-DD` en la zona del círculo.
//
// Regla de la casa para el cambio de hora:
//  - Una hora local que NO existe (el reloj salta hacia adelante) se corre hacia
//    adelante lo que dura el salto: 00:30 pasa a ser 01:30 de ese mismo día.
//  - Una hora local que ocurre DOS veces (el reloj se atrasa) usa la PRIMERA.
// Chile cambia la hora a medianoche, así que el caso real es 00:00–00:59 el día
// del adelanto y 23:00–23:59 el día del atraso.

const MINUTE = 60_000;
const DAY = 86_400_000;

/** Un día local como número de días desde 1970 (aritmética sin zonas). */
function dayNumber(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY);
}

function dateOfDayNumber(dayNumberValue: number): string {
  return new Date(dayNumberValue * DAY).toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Día local (`YYYY-MM-DD`) de un instante en una zona. */
export function localDateOf(instant: Date, tz: string): string {
  const offset = tzOffset(tz, instant);
  return new Date(instant.getTime() + offset * MINUTE)
    .toISOString()
    .slice(0, 10);
}

/**
 * Instante UTC de una fecha y hora locales (`YYYY-MM-DD`, `HH:MM`) en una zona,
 * aplicando la regla de la casa para el cambio de hora.
 */
export function zonedInstant(date: string, time: string, tz: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const wall = dayNumber(date) * DAY + (hours * 60 + minutes) * MINUTE;

  // Desfase vigente un día antes y un día después: si difieren, hay un cambio cerca.
  const before = tzOffset(tz, new Date(wall - DAY));
  const after = tzOffset(tz, new Date(wall + DAY));
  const candidates = [before, after]
    .map((offset) => ({ offset, at: wall - offset * MINUTE }))
    .filter(({ offset, at }) => tzOffset(tz, new Date(at)) === offset)
    .map(({ at }) => at);

  if (candidates.length > 0) {
    // Hora normal (una candidata, o dos iguales) u hora repetida: la primera.
    return new Date(Math.min(...candidates));
  }
  // Hora inexistente: con el desfase anterior al salto queda corrida hacia adelante.
  return new Date(wall - before * MINUTE);
}

function matchesDay(rule: ReminderRule, date: string): boolean {
  const [year, month, day] = date.split("-").map(Number);
  switch (rule.freq) {
    case "once":
      return date === rule.date;
    case "daily":
      return true;
    case "weekly": {
      // 1970-01-01 fue jueves (ISO 4).
      const isoWeekday = ((((dayNumber(date) + 3) % 7) + 7) % 7) + 1;
      return rule.weekdays.includes(isoWeekday);
    }
    case "interval":
      return (
        (dayNumber(date) - dayNumber(rule.startDate)) % rule.everyDays === 0
      );
    case "monthly":
      return day === Math.min(rule.dayOfMonth, lastDayOfMonth(year, month));
    case "yearly":
      return (
        month === rule.month &&
        day === Math.min(rule.day, lastDayOfMonth(year, month))
      );
  }
}

/**
 * Instantes en que ocurre un recordatorio entre `fromUtc` y `toUtc` (ambos
 * incluidos), ordenados y sin duplicados. Nada antes de `startDate` ni después
 * del final del día local de `endDate`.
 */
export function expandRule(
  rule: ReminderRule,
  tz: string,
  fromUtc: Date,
  toUtc: Date,
): Date[] {
  const from = fromUtc.getTime();
  const to = toUtc.getTime();
  if (to < from) {
    return [];
  }
  // Un día de margen a cada lado: el día local no calza con el día UTC.
  const firstDay = Math.max(
    dayNumber(localDateOf(fromUtc, tz)) - 1,
    dayNumber(rule.startDate),
  );
  const lastDay = Math.min(
    dayNumber(localDateOf(toUtc, tz)) + 1,
    rule.endDate ? dayNumber(rule.endDate) : Number.POSITIVE_INFINITY,
  );

  const instants = new Set<number>();
  for (let current = firstDay; current <= lastDay; current += 1) {
    const date = dateOfDayNumber(current);
    if (!matchesDay(rule, date)) {
      continue;
    }
    for (const time of rule.times) {
      const at = zonedInstant(date, time, tz).getTime();
      if (at >= from && at <= to) {
        instants.add(at);
      }
    }
  }
  return [...instants].sort((a, b) => a - b).map((at) => new Date(at));
}

export interface AdvanceNotice {
  daysBefore: number;
  fireAt: Date;
}

/**
 * Avisos previos de un control, trámite o fecha: a las 09:00 locales, tantos días
 * antes como se pidió. El de 0 días (el mismo día) solo existe si el evento es
 * después de las 09:00; si no, el aviso llegaría después del evento.
 */
export function advanceNotices(
  eventInstant: Date,
  tz: string,
  advanceDays: readonly number[],
): AdvanceNotice[] {
  const eventDay = dayNumber(localDateOf(eventInstant, tz));
  return [...new Set(advanceDays)]
    .sort((a, b) => b - a)
    .map((daysBefore) => ({
      daysBefore,
      fireAt: zonedInstant(dateOfDayNumber(eventDay - daysBefore), "09:00", tz),
    }))
    .filter(
      ({ daysBefore, fireAt }) =>
        daysBefore > 0 || fireAt.getTime() < eventInstant.getTime(),
    );
}
