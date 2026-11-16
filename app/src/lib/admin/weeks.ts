import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

// Días y semanas del panel. Siempre en la zona de Chile, nunca la del servidor.
// Una semana va de lunes a domingo y se numera desde 1970.

const TZ = "America/Santiago";
const DAY_MS = 86_400_000;

/** Día local ("2026-11-15") de un instante ISO. */
export function localDay(iso: string): string {
  return format(new TZDate(new Date(iso), TZ), "yyyy-MM-dd");
}

function dayNumber(day: string): number {
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / DAY_MS);
}

/** Número de la semana (lunes a domingo) a la que pertenece un día local. */
export function weekIndexOfDay(day: string): number {
  return Math.floor((dayNumber(day) + 3) / 7);
}

export function weekIndexOf(iso: string): number {
  return weekIndexOfDay(localDay(iso));
}

/** Lunes de una semana, "2026-11-09". */
export function weekStart(index: number): string {
  return new Date((index * 7 - 3) * DAY_MS).toISOString().slice(0, 10);
}

const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** "Semana del 9 nov 2026". */
export function weekLabel(index: number): string {
  const [year, month, day] = weekStart(index).split("-").map(Number);
  return `Semana del ${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export interface MetricFilters {
  /** Código de organización, o null para todas. */
  org: string | null;
  /** Número de semana de registro, o null para todas. */
  cohort: number | null;
}

type RawParam = string | string[] | undefined;

/** Lee `?org=` y `?cohorte=`; lo que no tenga forma válida se ignora. */
export function parseMetricFilters(params: {
  org?: RawParam;
  cohorte?: RawParam;
}): MetricFilters {
  const org =
    typeof params.org === "string" && /^[A-Z0-9-]{3,32}$/.test(params.org)
      ? params.org
      : null;
  const cohort =
    typeof params.cohorte === "string" && /^\d{1,6}$/.test(params.cohorte)
      ? Number(params.cohorte)
      : null;
  return { org, cohort };
}
