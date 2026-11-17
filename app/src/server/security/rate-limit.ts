import { createHmac } from "node:crypto";
import { requireEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Límites de frecuencia de toda la app: cuántas veces por ventana (en segundos). */
export const RATE_LIMITS = {
  /** Pedidos de ingreso por correo. */
  login: { limit: 5, windowSeconds: 900 },
  /** Pedidos de ingreso por IP: holgado, varias personas comparten una misma red. */
  login_ip: { limit: 300, windowSeconds: 900 },
  feedback: { limit: 10, windowSeconds: 3600 },
  emergency: { limit: 3, windowSeconds: 600 },
  invitation: { limit: 10, windowSeconds: 86400 },
  web_contact: { limit: 5, windowSeconds: 3600 },
  cared_done: { limit: 30, windowSeconds: 600 },
  push_test: { limit: 5, windowSeconds: 3600 },
} as const satisfies Record<string, { limit: number; windowSeconds: number }>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

/**
 * Clave del contador: HMAC-SHA256 de `scope:valor` con IP_HASH_SECRET.
 * Así en la base nunca queda una IP ni un correo en claro.
 */
export function hashKey(scope: string, raw: string): string {
  return createHmac("sha256", requireEnv("IP_HASH_SECRET"))
    .update(`${scope}:${raw}`)
    .digest("hex");
}

/**
 * Cuenta un intento y dice si cabe en el límite. Ventanas fijas en Postgres
 * (RPC `rate_limit_hit`, solo ejecutable con la clave de servicio).
 * Si la base no responde, se niega: es más seguro que dejar pasar sin contar.
 */
export async function checkRateLimit(
  scope: string,
  raw: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean }> {
  const { data, error } = await createSupabaseAdminClient().rpc(
    "rate_limit_hit",
    {
      p_key: `${scope}:${hashKey(scope, raw)}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    },
  );
  if (error) {
    return { allowed: false };
  }
  return { allowed: data === true };
}
