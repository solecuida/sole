import { z } from "zod";
import { Constants } from "@/lib/supabase/database.types";

// Catálogo de eventos de investigación. Reglas (brief §4):
//  - Ningún evento existe sin una hipótesis (H1 a H6) que lo justifique.
//  - Las propiedades son solo listas cerradas, números y sí/no: nunca texto libre.
//  - Este archivo y docs/eventos.md cambian juntos (una prueba lo exige).

export type Hypothesis = "H1" | "H2" | "H3" | "H4" | "H5" | "H6";

const enums = Constants.public.Enums;

/** Pantallas de la app que se miden (nombre de su ruta). */
export const SCREENS = [
  "hoy",
  "calendario",
  "recordatorios",
  "tareas",
  "bitacora",
  "para-ti",
  "informes",
  "contactos",
  "persona-cuidada",
  "circulo",
  "avisos",
  "cuenta",
  "pronto",
] as const;

/** Puertas falsas de F11 (mismos valores que `fake_door_interest.door_key`). */
export const DOORS = [
  "ia",
  "recetas",
  "plan_familiar",
  "comunidad",
  "fotos",
  "invitar_familiar",
] as const;

/** Códigos de error que puede ver una persona. */
export const ERROR_CODES = [
  "unauthorized",
  "forbidden",
  "not_found",
  "validation_failed",
  "rate_limited",
  "captcha_failed",
  "conflict",
  "invitation_invalid",
  "unavailable",
  "internal",
] as const;

const screen = z.enum(SCREENS);
const flow = z.enum(["onboarding", "reminder_create", "journal"]);
const door = z.enum(DOORS);
const count = z.number().int().min(0);
const none = z.strictObject({});

interface EventDefinition {
  /** Cuándo se dispara. */
  when: string;
  props: z.ZodType<Record<string, string | number | boolean>>;
  hypotheses: readonly Hypothesis[];
  /** Técnico = mínimo para que la app funcione; se guarda aunque no haya consentimiento de investigación. */
  technical: boolean;
}

export const EVENT_CATALOG = {
  "app.opened": {
    when: "al cargar una página de la app, una vez por sesión de navegador",
    props: z.strictObject({ screen }),
    hypotheses: ["H1"],
    technical: false,
  },
  "screen.viewed": {
    when: "al ver una pantalla de la app",
    props: z.strictObject({ screen }),
    hypotheses: ["H1", "H2"],
    technical: false,
  },
  "flow.started": {
    when: "al empezar un flujo medido",
    props: z.strictObject({ flow }),
    hypotheses: ["H2"],
    technical: false,
  },
  "flow.completed": {
    when: "al terminar un flujo medido",
    props: z.strictObject({ flow, duration_ms: count }),
    hypotheses: ["H2"],
    technical: false,
  },
  "flow.abandoned": {
    when: "al salir de un flujo medido sin terminarlo",
    props: z.strictObject({ flow, step: count }),
    hypotheses: ["H2"],
    technical: false,
  },
  "app.error": {
    when: "al mostrarle un error a la usuaria",
    props: z.strictObject({ code: z.enum(ERROR_CODES), screen }),
    hypotheses: ["H2"],
    technical: true,
  },
  "onboarding.completed": {
    when: "al crear el círculo en la bienvenida",
    props: z.strictObject({
      care_type: z.enum(enums.care_type),
      template_items: count,
    }),
    hypotheses: ["H1", "H6"],
    technical: false,
  },
  "reminder.created": {
    when: "al crear un recordatorio",
    props: z.strictObject({
      kind: z.enum(enums.reminder_kind),
      importance: z.enum(enums.importance),
      source: z.enum(["manual", "template", "tip"]),
    }),
    hypotheses: ["H1"],
    technical: false,
  },
  "occurrence.marked": {
    when: "al marcar un ítem como hecho, no hecho o pospuesto",
    props: z.strictObject({
      status: z.enum(["done", "not_done", "snoozed"]),
      via: z.enum(["app", "push", "offline_sync", "cared_link"]),
      kind: z.enum(enums.reminder_kind),
    }),
    hypotheses: ["H1"],
    technical: false,
  },
  "journal.saved": {
    when: "al guardar la bitácora del día",
    props: z.strictObject({ duration_ms: count, has_note: z.boolean() }),
    hypotheses: ["H1", "H2"],
    technical: false,
  },
  "selfcare.checked_in": {
    when: "al responder la pregunta diaria de bienestar (sin el puntaje)",
    props: none,
    hypotheses: ["H1"],
    technical: false,
  },
  "report.viewed": {
    when: "al abrir un informe",
    props: z.strictObject({ period: z.enum(["dia", "semana", "mes"]) }),
    hypotheses: ["H3"],
    technical: false,
  },
  "report.shared": {
    when: "al compartir un informe",
    props: z.strictObject({ format: z.enum(["png", "pdf"]) }),
    hypotheses: ["H3"],
    technical: false,
  },
  "survey.answered": {
    when: "al responder o descartar una microencuesta",
    props: z.strictObject({
      survey: z.enum(["d3", "d14", "d28", "d56"]),
      dismissed: z.boolean(),
    }),
    hypotheses: ["H3"],
    technical: false,
  },
  "fake_door.viewed": {
    when: "al abrir una puerta falsa",
    props: z.strictObject({ door }),
    hypotheses: ["H4"],
    technical: false,
  },
  "fake_door.interest": {
    when: "al tocar «Sí, avísame» o elegir un precio en una puerta falsa",
    props: z.strictObject({
      door,
      choice: z.enum(["2990", "4990", "7990", "none"]),
    }),
    hypotheses: ["H4"],
    technical: false,
  },
  "premium.used": {
    when: "al usar una función Premium en piloto",
    props: z.strictObject({ feature: z.enum(["informe_medico"]) }),
    hypotheses: ["H4"],
    technical: false,
  },
  "push.permission": {
    when: "al responder el permiso de avisos",
    props: z.strictObject({
      result: z.enum(["granted", "denied", "default"]),
    }),
    hypotheses: ["H1"],
    technical: false,
  },
  "invitation.created": {
    when: "al crear una invitación a un familiar",
    props: none,
    hypotheses: ["H5"],
    technical: false,
  },
  "cared_link.created": {
    when: "al crear un vínculo de la persona cuidada",
    props: none,
    hypotheses: ["H5"],
    technical: false,
  },
  "account.deletion_requested": {
    when: "al pedir el borrado de la cuenta",
    props: none,
    hypotheses: ["H1"],
    technical: true,
  },
} as const satisfies Record<string, EventDefinition>;

export type EventName = keyof typeof EVENT_CATALOG;

export type EventProps<N extends EventName> = z.input<
  (typeof EVENT_CATALOG)[N]["props"]
>;

export function isEventName(name: string): name is EventName {
  return Object.hasOwn(EVENT_CATALOG, name);
}
