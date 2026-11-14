import { createHash, timingSafeEqual } from "node:crypto";
import { readEnv } from "@/lib/env";

/**
 * ¿La petición trae el secreto de cron correcto en `x-cron-secret`?
 * Comparación en tiempo constante (sobre el hash, para igualar largos): el
 * tiempo de respuesta no revela cuántos caracteres acertó quien prueba.
 * Sin CRON_SECRET configurado, nadie pasa.
 */
export function hasCronSecret(request: Request): boolean {
  const expected = readEnv("CRON_SECRET");
  const received = request.headers.get("x-cron-secret");
  if (!expected || !received) {
    return false;
  }
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(received), digest(expected));
}
