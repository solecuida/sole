import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

export type TestClient = SupabaseClient<Database>;

export const CONSENT_VERSION = "2026-11-14";

export interface TestUser {
  client: TestClient;
  userId: string;
  email: string;
  password: string;
  accessToken: string;
}

/** Cliente con la clave secreta (se salta RLS): solo para sembrar y comprobar. */
export function adminClient(): TestClient {
  return createSupabaseAdminClient();
}

/** Cliente sin sesión, con la clave publicable (rol `anon`). */
export function anonClient(): TestClient {
  return createClient<Database>(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Crea una usuaria con correo aleatorio e inicia sesión con la clave publicable:
 * el cliente que devuelve pasa por RLS como cualquier usuaria real.
 */
export async function createTestUser(
  options: { consents?: boolean } = {},
): Promise<TestUser> {
  const email = `test-${randomUUID()}@example.test`;
  // Cumple config.toml: mínimo 10 caracteres con minúsculas, mayúsculas y dígitos.
  const password = `Aa1${randomUUID()}`;

  const created = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(
      `No se pudo crear la usuaria de prueba: ${created.error?.message}`,
    );
  }
  const userId = created.data.user.id;

  const client = anonClient();
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) {
    throw new Error(
      `No se pudo iniciar sesión de prueba: ${signedIn.error?.message}`,
    );
  }

  if (options.consents) {
    await grantRequiredConsents(client, userId);
  }

  return {
    client,
    userId,
    email,
    password,
    accessToken: signedIn.data.session.access_token,
  };
}

/** Inserta los consentimientos obligatorios (`terms` y `sensitive`). */
export async function grantRequiredConsents(
  client: TestClient,
  userId: string,
): Promise<void> {
  const { error } = await client.from("consents").insert([
    {
      user_id: userId,
      layer: "terms",
      version: CONSENT_VERSION,
      granted: true,
    },
    {
      user_id: userId,
      layer: "sensitive",
      version: CONSENT_VERSION,
      granted: true,
    },
  ]);
  if (error) {
    throw new Error(
      `No se pudieron guardar los consentimientos: ${error.message}`,
    );
  }
}

/** Crea un círculo con la RPC `create_circle` y devuelve su id. */
export async function createCircleFor(
  client: TestClient,
  displayName: string,
): Promise<string> {
  const { data, error } = await client.rpc("create_circle", {
    p_cared_name: "Persona de prueba",
    p_relation: "mi mamá",
    p_care_type: "adulto_mayor",
    p_display_name: displayName,
  });
  if (error || !data) {
    throw new Error(`No se pudo crear el círculo: ${error?.message}`);
  }
  return data;
}
