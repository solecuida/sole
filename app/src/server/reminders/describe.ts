import {
  formatLongDate,
  joinList,
  MONTH_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/reminders/labels";
import type { ReminderRule } from "@/server/reminders/rule-schema";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "a las 08:00" · "a las 08:00 y 20:00" */
export function describeTimes(times: readonly string[]): string {
  return `a las ${joinList([...times].sort())}`;
}

/** La repetición en palabras: "Todos los días a las 08:00". */
export function describeRule(rule: ReminderRule): string {
  const at = describeTimes(rule.times);
  switch (rule.freq) {
    case "once":
      return `El ${formatLongDate(rule.date)} ${at}`;
    case "daily":
      return `Todos los días ${at}`;
    case "weekly": {
      const days = [...rule.weekdays]
        .sort((a, b) => a - b)
        .map((day) => WEEKDAY_LABELS[day - 1]);
      return days.length === 7
        ? `Todos los días ${at}`
        : `${capitalize(joinList(days))} ${at}`;
    }
    case "interval":
      return `Cada ${rule.everyDays} días ${at}`;
    case "monthly":
      return `El día ${rule.dayOfMonth} de cada mes ${at}`;
    case "yearly":
      return `Cada año, el ${rule.day} de ${MONTH_LABELS[rule.month - 1]} ${at}`;
  }
}
