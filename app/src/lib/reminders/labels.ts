import type { Database } from "@/lib/supabase/database.types";

// Nombres para personas de los valores que guarda la base.

type ReminderKind = Database["public"]["Enums"]["reminder_kind"];
type Importance = Database["public"]["Enums"]["importance"];

export const KIND_LABELS: Record<ReminderKind, string> = {
  medication: "Medicamento",
  food: "Comida o hidratación",
  activity: "Actividad",
  appointment: "Control o cita",
  errand: "Trámite",
  important_date: "Fecha importante",
  custom: "Otro",
};

/** Título de cada grupo en las listas. */
export const KIND_GROUP_LABELS: Record<ReminderKind, string> = {
  medication: "Medicamentos",
  food: "Comida e hidratación",
  activity: "Actividades",
  appointment: "Controles y citas",
  errand: "Trámites",
  important_date: "Fechas importantes",
  custom: "Otros",
};

export const IMPORTANCE_LABELS: Record<Importance, string> = {
  important: "Importante",
  normal: "Normal",
  whenever: "Cuando puedas",
};

/** Días de la semana ISO: 1 = lunes … 7 = domingo. */
export const WEEKDAY_LABELS = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
  "domingo",
] as const;

export const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** Tipos que avisan con días de anticipación. */
export const KINDS_WITH_ADVANCE: readonly ReminderKind[] = [
  "appointment",
  "errand",
  "important_date",
];

/** "a, b y c" */
export function joinList(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** `2026-12-01` → "1 de diciembre de 2026" */
export function formatLongDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} de ${MONTH_LABELS[month - 1]} de ${year}`;
}
