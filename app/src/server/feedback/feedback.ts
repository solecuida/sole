import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { checkRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";

type Client = SupabaseClient<Database>;

export type FeedbackErrorCode =
  | "validation_failed"
  | "rate_limited"
  | "forbidden"
  | "internal";

export const feedbackInputSchema = z.object({
  kind: z.enum(["comentario", "problema"]),
  message: z.string().trim().min(1).max(2000),
  screen: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => (value ? value : null)),
});

const MESSAGES = {
  validation:
    "Escribe tu mensaje (hasta 2.000 letras) y elige si es un comentario o un problema.",
  rateLimited: "Ya nos mandaste varios mensajes. Prueba de nuevo más tarde.",
  forbidden: "Tu sesión terminó. Vuelve a entrar para escribirnos.",
  internal: "No pudimos enviar tu mensaje. Prueba de nuevo en un momento.",
} as const;

/**
 * Guarda un comentario o problema. La usuaria puede insertar en `feedback` pero no
 * leerla (a propósito): por eso el insert nunca pide la fila de vuelta.
 * El texto del mensaje no va a eventos, logs ni errores.
 */
export async function sendFeedback(
  client: Client,
  userId: string,
  input: unknown,
): Promise<Result<undefined, FeedbackErrorCode>> {
  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  const { limit, windowSeconds } = RATE_LIMITS.feedback;
  const { allowed } = await checkRateLimit(
    "feedback",
    userId,
    limit,
    windowSeconds,
  );
  if (!allowed) {
    return fail("rate_limited", MESSAGES.rateLimited);
  }
  const { error } = await client.from("feedback").insert({
    user_id: userId,
    kind: parsed.data.kind,
    message: parsed.data.message,
    screen: parsed.data.screen,
  });
  if (error) {
    return error.code === "42501"
      ? fail("forbidden", MESSAGES.forbidden)
      : fail("internal", MESSAGES.internal);
  }
  return ok();
}

/**
 * ¿Se le piden comentarios y encuestas? No, si todos sus círculos se cerraron
 * por un fallecimiento: en ese momento Sole no pregunta nada.
 */
export async function feedbackAllowed(client: Client): Promise<boolean> {
  const { data } = await client.from("circles").select("closed_reason");
  if (!data || data.length === 0) {
    return true;
  }
  return !data.every((row) => row.closed_reason === "fallecimiento");
}
