import { formatLongDate, KIND_GROUP_LABELS } from "@/lib/reminders/labels";
import type { Database } from "@/lib/supabase/database.types";

// Piezas de los informes que comparten páginas de servidor y componentes de
// cliente. Viven en lib (y no en un archivo "use client") porque una constante
// importada desde un módulo de cliente llega al servidor como referencia, no
// como valor.

export type Period = "dia" | "semana" | "mes";

export const PERIODS: readonly Period[] = ["dia", "semana", "mes"];

export const PERIOD_LABELS: Record<Period, string> = {
  dia: "Día",
  semana: "Semana",
  mes: "Mes",
};

export const PERIOD_TITLES: Record<Period, string> = {
  dia: "Resumen de hoy",
  semana: "Resumen de la semana",
  mes: "Resumen del mes",
};

/** Lo que dice `?periodo=`; cualquier otra cosa es la semana. */
export function parsePeriod(value: string | string[] | undefined): Period {
  return PERIODS.find((period) => period === value) ?? "semana";
}

/** `0.9` → "90 %" (espacio normal, sin `Intl`). */
export function percent(rate: number): string {
  return `${Math.round(rate * 100)} %`;
}

/** "15 de noviembre de 2026" o "Del 9 al 15 de noviembre de 2026". */
export function periodSubtitle(period: Period, from: string, to: string) {
  return period === "dia"
    ? formatLongDate(to)
    : `Del ${formatLongDate(from)} al ${formatLongDate(to)}`;
}

export interface ChartRow {
  key: string;
  label: string;
  done: number;
  total: number;
  /** 0 a 100, para el largo de la barra. */
  value: number;
  /** "90 %" */
  text: string;
}

/** Cumplimiento por tipo, listo para el gráfico y su tabla. */
export function chartRows(
  compliance: {
    kind: Database["public"]["Enums"]["reminder_kind"];
    done: number;
    total: number;
    rate: number;
  }[],
): ChartRow[] {
  return compliance.map((item) => ({
    key: item.kind,
    label: KIND_GROUP_LABELS[item.kind],
    done: item.done,
    total: item.total,
    value: Math.round(item.rate * 100),
    text: percent(item.rate),
  }));
}
