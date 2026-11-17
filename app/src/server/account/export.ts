import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptField } from "@/lib/crypto/field";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
type Row = Record<string, unknown>;

// Descarga de "todos mis datos" (derecho de acceso y portabilidad).
// Todo se lee con el cliente de la usuaria: RLS garantiza que solo salgan sus
// datos y los de los círculos donde es miembro. Los campos cifrados se entregan
// legibles, porque son suyos.

export const CSV_TABLES = [
  "recordatorios",
  "cumplimiento",
  "bitacora",
  "tareas",
  "contactos",
  "bienestar",
] as const;
export type CsvTable = (typeof CSV_TABLES)[number];

const PAGE = 1000;
/** Tope de filas por tabla: muy por encima de lo que una persona genera en el piloto. */
const MAX_ROWS = 50_000;

function decrypt(value: unknown, context: string): string | null {
  if (typeof value !== "string" || value === "") {
    return null;
  }
  try {
    return decryptField(value, context);
  } catch {
    return null;
  }
}

/** Lee una consulta completa, de a 1.000 filas (el tope de la API). */
async function readAll<T>(
  page: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error || !data) {
      break;
    }
    rows.push(...data);
    if (data.length < PAGE) {
      break;
    }
  }
  return rows;
}

export interface AccountExport {
  exportado_el: string;
  aviso: string;
  perfil: Row | null;
  consentimientos: Row[];
  circulos: Row[];
  recordatorios: Row[];
  cumplimiento: Row[];
  bitacora: Row[];
  tareas: Row[];
  contactos: Row[];
  bienestar: Row[];
  encuestas: Row[];
  intereses: Row[];
}

export async function exportAll(
  client: Client,
  userId: string,
  now: Date = new Date(),
): Promise<AccountExport> {
  const [user, profile, consents, circles, members] = await Promise.all([
    client.auth.getUser(),
    client
      .from("profiles")
      .select(
        "display_name, timezone, org_code, followup_minutes, journal_reminder_time, onboarding_completed_at, created_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    client
      .from("consents")
      .select("layer, version, granted, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    client
      .from("circles")
      .select(
        "id, cared_name, relation, care_type, timezone, closed_at, closed_reason, created_at",
      )
      .order("created_at", { ascending: true }),
    client
      .from("circle_members")
      .select("circle_id, role, display_name")
      .eq("user_id", userId),
  ]);

  const roles = new Map(
    (members.data ?? []).map((member) => [member.circle_id, member]),
  );
  const names = new Map(
    (circles.data ?? []).map((circle) => [circle.id, circle.cared_name]),
  );
  const personOf = (circleId: string) => names.get(circleId) ?? null;

  const [
    reminders,
    occurrences,
    journal,
    tasks,
    contacts,
    selfcare,
    surveys,
    doors,
  ] = await Promise.all([
    readAll((from, to) =>
      client
        .from("reminders")
        .select("*")
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("reminder_occurrences")
        .select(
          "circle_id, kind, advance_days, event_at, local_date, status, not_done_reason, done_at, done_via, reminder:reminders(title, kind)",
        )
        .order("event_at", { ascending: true })
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: true })
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("tasks")
        .select("circle_id, title, scheduled_for, done_at, created_at")
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("contacts")
        .select("*")
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("selfcare_checkins")
        .select("checkin_date, score")
        .eq("user_id", userId)
        .order("checkin_date", { ascending: true })
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("survey_responses")
        .select("survey_key, answers, dismissed, created_at")
        .eq("user_id", userId)
        .range(from, to),
    ),
    readAll((from, to) =>
      client
        .from("fake_door_interest")
        .select("door_key, choice, notify_me, created_at")
        .eq("user_id", userId)
        .range(from, to),
    ),
  ]);

  return {
    exportado_el: now.toISOString(),
    aviso:
      "Estos son tus datos en Sole. Al descargarlos salen de Sole: guárdalos en un lugar seguro.",
    perfil: profile.data
      ? {
          correo: user.data.user?.email ?? null,
          nombre: profile.data.display_name,
          zona_horaria: profile.data.timezone,
          organizacion_de_origen: profile.data.org_code,
          minutos_antes_de_preguntar: profile.data.followup_minutes,
          hora_sugerida_bitacora: profile.data.journal_reminder_time,
          bienvenida_completada_el: profile.data.onboarding_completed_at,
          cuenta_creada_el: profile.data.created_at,
        }
      : null,
    consentimientos: (consents.data ?? []).map((row) => ({
      capa: row.layer,
      version: row.version,
      aceptado: row.granted,
      fecha: row.created_at,
    })),
    circulos: (circles.data ?? []).map((circle) => ({
      persona_cuidada: circle.cared_name,
      relacion: circle.relation,
      tipo_de_cuidado: circle.care_type,
      zona_horaria: circle.timezone,
      mi_rol: roles.get(circle.id)?.role ?? null,
      mi_nombre_en_el_circulo: roles.get(circle.id)?.display_name ?? null,
      creado_el: circle.created_at,
      cerrado_el: circle.closed_at,
      motivo_de_cierre: circle.closed_reason,
    })),
    recordatorios: reminders.map((row) => ({
      persona_cuidada: personOf(row.circle_id),
      titulo: row.title,
      tipo: row.kind,
      importancia: row.importance,
      medicamento: decrypt(row.med_name_enc, "reminders.med_name"),
      indicacion: decrypt(
        row.med_instructions_enc,
        "reminders.med_instructions",
      ),
      regla: row.rule,
      dias_de_aviso_previo: row.advance_days,
      visible_para_la_persona_cuidada: row.visible_to_cared,
      activo: row.active,
      origen: row.source,
      creado_el: row.created_at,
    })),
    cumplimiento: occurrences.map((row) => ({
      persona_cuidada: personOf(row.circle_id),
      recordatorio: row.reminder?.title ?? null,
      tipo: row.reminder?.kind ?? null,
      clase: row.kind === "advance" ? "aviso previo" : "principal",
      dias_antes: row.advance_days,
      fecha: row.local_date,
      momento: row.event_at,
      estado: row.status,
      motivo: row.not_done_reason,
      hecho_el: row.done_at,
      hecho_desde: row.done_via,
    })),
    bitacora: journal.map((row) => ({
      persona_cuidada: personOf(row.circle_id),
      fecha: row.entry_date,
      como_fue_el_dia: row.day_rating,
      animo: row.moods,
      sueno: row.sleep,
      comida: row.food,
      nota: decrypt(row.note_enc, "journal_entries.note"),
    })),
    tareas: tasks.map((row) => ({
      persona_cuidada: personOf(row.circle_id),
      titulo: row.title,
      para_el_dia: row.scheduled_for,
      hecha_el: row.done_at,
      creada_el: row.created_at,
    })),
    contactos: contacts.map((row) => ({
      persona_cuidada: personOf(row.circle_id),
      nombre: row.name,
      tipo: row.kind,
      telefono: row.phone,
      de_emergencia: row.is_emergency,
      nota: decrypt(row.notes_enc, "contacts.notes"),
    })),
    bienestar: selfcare.map((row) => ({
      fecha: row.checkin_date,
      puntaje: row.score,
    })),
    encuestas: surveys.map((row) => ({
      encuesta: row.survey_key,
      respuestas: row.answers,
      cerrada_sin_responder: row.dismissed,
      fecha: row.created_at,
    })),
    intereses: doors.map((row) => ({
      idea: row.door_key,
      opcion: row.choice,
      avisarme: row.notify_me,
      fecha: row.created_at,
    })),
  };
}

function cell(value: unknown): string {
  let text: string;
  if (value === null || value === undefined) {
    text = "";
  } else if (Array.isArray(value)) {
    text = value.join("; ");
  } else if (typeof value === "object") {
    text = JSON.stringify(value);
  } else if (typeof value === "boolean") {
    text = value ? "sí" : "no";
  } else {
    text = String(value);
  }
  // Una celda que empieza con = + - @ podría ejecutarse como fórmula al abrir el
  // archivo en una planilla: se neutraliza con un apóstrofo.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

/**
 * CSV que Excel abre bien: BOM UTF-8, separador coma, todo entre comillas
 * dobles y fin de línea CRLF. `columns` fija el encabezado aunque no haya filas.
 */
export function toCsv(
  rows: readonly Row[],
  columns?: readonly string[],
): string {
  const header = columns ?? Object.keys(rows[0] ?? {});
  const lines = [
    header.map(cell).join(","),
    ...rows.map((row) => header.map((key) => cell(row[key])).join(",")),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Encabezados de cada tabla CSV (los mismos nombres que usa `exportAll`). */
export const CSV_COLUMNS: Record<CsvTable, readonly string[]> = {
  recordatorios: [
    "persona_cuidada",
    "titulo",
    "tipo",
    "importancia",
    "medicamento",
    "indicacion",
    "regla",
    "dias_de_aviso_previo",
    "visible_para_la_persona_cuidada",
    "activo",
    "origen",
    "creado_el",
  ],
  cumplimiento: [
    "persona_cuidada",
    "recordatorio",
    "tipo",
    "clase",
    "dias_antes",
    "fecha",
    "momento",
    "estado",
    "motivo",
    "hecho_el",
    "hecho_desde",
  ],
  bitacora: [
    "persona_cuidada",
    "fecha",
    "como_fue_el_dia",
    "animo",
    "sueno",
    "comida",
    "nota",
  ],
  tareas: ["persona_cuidada", "titulo", "para_el_dia", "hecha_el", "creada_el"],
  contactos: [
    "persona_cuidada",
    "nombre",
    "tipo",
    "telefono",
    "de_emergencia",
    "nota",
  ],
  bienestar: ["fecha", "puntaje"],
};
