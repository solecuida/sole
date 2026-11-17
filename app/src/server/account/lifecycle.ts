import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { track } from "@/server/events/track";

type Client = SupabaseClient<Database>;

const DAY = 86_400_000;
/** Días para arrepentirse antes de que el borrado sea definitivo. */
export const DELETION_GRACE_DAYS = 7;

export const CLOSE_REASONS = ["ya_no_cuido", "fallecimiento", "otro"] as const;
export type CloseReason = (typeof CLOSE_REASONS)[number];

export type AccountState =
  | { status: "active" }
  | { status: "pending_deletion"; requestedAt: string; purgeAfter: string };

export type LifecycleErrorCode =
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "internal";

function purgeDate(requestedAt: string): string {
  return new Date(
    new Date(requestedAt).getTime() + DELETION_GRACE_DAYS * DAY,
  ).toISOString();
}

/**
 * Pide el borrado de la cuenta. Desde este instante la cuenta queda desactivada
 * (no se preparan ni envían más avisos) y se cierran todas sus sesiones. Los
 * datos se eliminan de verdad a los 7 días (trabajo diario → `purge_user`),
 * junto con los círculos que creó y todo lo que ven sus familiares.
 *
 * `admin` es necesario porque la usuaria no puede escribir esas dos columnas:
 * así nadie las cambia saltándose este camino.
 */
export async function requestDeletion(
  client: Client,
  admin: Client,
  userId: string,
  accessToken: string,
  now: Date,
): Promise<Result<{ purgeAfter: string }, LifecycleErrorCode>> {
  const requestedAt = now.toISOString();
  const { data, error } = await admin
    .from("profiles")
    .update({ deletion_requested_at: requestedAt, deactivated_at: requestedAt })
    .eq("id", userId)
    .select("id");
  if (error || !data?.length) {
    return fail(
      "internal",
      "No pudimos pedir el borrado. Prueba de nuevo en un momento.",
    );
  }
  // Se registra antes de cerrar la sesión: después el cliente ya no sirve.
  await track(client, userId, "account.deletion_requested", {});
  // Cierra la sesión en todos los teléfonos: el token de refresco deja de servir.
  await admin.auth.admin.signOut(accessToken, "global");
  return ok({ purgeAfter: purgeDate(requestedAt) });
}

export async function getAccountState(
  client: Client,
  userId: string,
): Promise<AccountState> {
  const { data } = await client
    .from("profiles")
    .select("deletion_requested_at")
    .eq("id", userId)
    .maybeSingle();
  const requestedAt = data?.deletion_requested_at;
  return requestedAt
    ? {
        status: "pending_deletion",
        requestedAt: new Date(requestedAt).toISOString(),
        purgeAfter: purgeDate(requestedAt),
      }
    : { status: "active" };
}

/** Deshace el pedido de borrado. Quien llama ya comprobó que `userId` es la usuaria con sesión. */
export async function restoreAccount(
  admin: Client,
  userId: string,
): Promise<Result<undefined, LifecycleErrorCode>> {
  const { data, error } = await admin
    .from("profiles")
    .update({ deletion_requested_at: null, deactivated_at: null })
    .eq("id", userId)
    .select("id");
  if (error || !data?.length) {
    return fail(
      "internal",
      "No pudimos recuperar tu cuenta. Prueba de nuevo en un momento.",
    );
  }
  return ok();
}

/**
 * Cierra un círculo: desde ese instante se silencian todos sus recordatorios.
 * Lo ya escrito se conserva para leer y descargar. Solo la cuidadora puede.
 */
export async function closeCircle(
  client: Client,
  circleId: string,
  reason: unknown,
): Promise<Result<{ reason: CloseReason }, LifecycleErrorCode>> {
  const parsed = z
    .object({ circleId: z.uuid(), reason: z.enum(CLOSE_REASONS) })
    .safeParse({ circleId, reason });
  if (!parsed.success) {
    return fail("validation_failed", "Elige un motivo para cerrar.");
  }
  const { error } = await client.rpc("close_circle", {
    p_circle: parsed.data.circleId,
    p_reason: parsed.data.reason,
  });
  if (error) {
    return error.code === "42501"
      ? fail("forbidden", "Solo quien administra este círculo puede cerrarlo.")
      : fail("internal", "No pudimos cerrarlo. Prueba de nuevo en un momento.");
  }
  return ok({ reason: parsed.data.reason });
}
