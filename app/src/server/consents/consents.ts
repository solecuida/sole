import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";

/** Versión del texto de consentimientos que se muestra hoy. Cambia cuando cambia el texto. */
export const CONSENT_VERSION = "2026-11-14";

type Client = SupabaseClient<Database>;
type Layer = Database["public"]["Enums"]["consent_layer"];

export interface ConsentState {
  /** Términos y uso básico (obligatorio). */
  terms: boolean;
  /** Datos sensibles de rutina, ánimo y medicamentos (obligatorio). */
  sensitive: boolean;
  /** Investigación (opcional). */
  research: boolean;
}

export type ConsentErrorCode = "validation_failed" | "internal";

const consentInputSchema = z.object({
  terms: z.literal(true),
  sensitive: z.literal(true),
  research: z.boolean(),
  /** "Tengo 18 años o más". */
  ageConfirmed: z.literal(true),
  /** "Cuento con la autorización de la persona que cuido o actúo en su interés…". */
  authorizationDeclared: z.literal(true),
});

export function hasRequiredConsents(state: ConsentState): boolean {
  return state.terms && state.sensitive;
}

/** Estado vigente: la fila más reciente de cada capa manda. */
export async function getConsentState(
  client: Client,
  userId: string,
): Promise<ConsentState> {
  const state: ConsentState = {
    terms: false,
    sensitive: false,
    research: false,
  };
  const { data, error } = await client
    .from("consents")
    .select("layer, granted, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) {
    // Sin lectura confiable, nada se da por consentido.
    return state;
  }
  const seen = new Set<Layer>();
  for (const row of data) {
    if (!seen.has(row.layer)) {
      seen.add(row.layer);
      state[row.layer] = row.granted;
    }
  }
  return state;
}

/**
 * Guarda los consentimientos de la bienvenida: una fila por capa.
 * Sin las dos declaraciones, o sin las dos capas obligatorias, no guarda nada.
 */
export async function recordConsents(
  client: Client,
  userId: string,
  input: unknown,
): Promise<Result<ConsentState, ConsentErrorCode>> {
  const parsed = consentInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "validation_failed",
      "Para seguir necesitamos que marques las dos declaraciones y los dos permisos obligatorios.",
    );
  }
  const { research } = parsed.data;
  const rows: { layer: Layer; granted: boolean }[] = [
    { layer: "terms", granted: true },
    { layer: "sensitive", granted: true },
    { layer: "research", granted: research },
  ];
  const { error } = await client.from("consents").insert(
    rows.map((row) => ({
      user_id: userId,
      version: CONSENT_VERSION,
      ...row,
    })),
  );
  if (error) {
    return fail(
      "internal",
      "No pudimos guardar tus permisos. Prueba de nuevo en un momento.",
    );
  }
  return ok({ terms: true, sensitive: true, research });
}

async function appendResearch(
  client: Client,
  userId: string,
  granted: boolean,
): Promise<Result<undefined, ConsentErrorCode>> {
  const { error } = await client.from("consents").insert({
    user_id: userId,
    layer: "research",
    version: CONSENT_VERSION,
    granted,
  });
  if (error) {
    return fail(
      "internal",
      "No pudimos guardar el cambio. Prueba de nuevo en un momento.",
    );
  }
  return ok();
}

/** Retira el consentimiento de investigación: agrega una fila, no edita las anteriores. */
export function revokeResearch(
  client: Client,
  userId: string,
): Promise<Result<undefined, ConsentErrorCode>> {
  return appendResearch(client, userId, false);
}

/** Vuelve a dar el consentimiento de investigación. */
export function grantResearch(
  client: Client,
  userId: string,
): Promise<Result<undefined, ConsentErrorCode>> {
  return appendResearch(client, userId, true);
}

export interface ConsentRecord {
  granted: boolean;
  version: string;
  /** Cuándo se registró esa decisión (ISO). */
  decidedAt: string;
}

/** Última decisión de cada capa, con su fecha: lo que muestra «Mi cuenta». */
export async function getConsentRecords(
  client: Client,
  userId: string,
): Promise<Partial<Record<Layer, ConsentRecord>>> {
  const { data } = await client
    .from("consents")
    .select("layer, granted, version, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  const records: Partial<Record<Layer, ConsentRecord>> = {};
  for (const row of data ?? []) {
    records[row.layer] ??= {
      granted: row.granted,
      version: row.version,
      decidedAt: row.created_at,
    };
  }
  return records;
}
