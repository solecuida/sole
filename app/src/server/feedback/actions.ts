"use server";

import { fail, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { type FeedbackErrorCode, sendFeedback } from "./feedback";

function text(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Recibe el formulario de «Contarle algo a Sole». Autoriza dentro de la acción. */
export async function submitFeedback(
  formData: FormData,
): Promise<Result<undefined, FeedbackErrorCode | "unauthorized">> {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return fail(
      "unauthorized",
      "Tu sesión terminó. Vuelve a entrar para seguir.",
    );
  }
  return sendFeedback(supabase, userId, {
    kind: text(formData.get("kind")),
    message: text(formData.get("message")),
    screen: text(formData.get("screen")),
  });
}
