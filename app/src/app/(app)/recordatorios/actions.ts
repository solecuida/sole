"use server";

import { revalidatePath } from "next/cache";
import { fail, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { track } from "@/server/events/track";
import {
  createReminder,
  deleteReminder,
  type ReminderErrorCode,
  updateReminder,
} from "@/server/reminders/reminders";

type ActionResult = Result<{ id: string }, ReminderErrorCode | "unauthorized">;

const NO_SESSION = fail(
  "unauthorized",
  "Tu sesión terminó. Vuelve a entrar para seguir.",
);

export interface SaveReminderRequest {
  circleId: string;
  /** Sin id se crea; con id se edita. */
  reminderId?: string;
  /** Datos del recordatorio; se validan de nuevo en el servidor. */
  data: unknown;
  /** Cuánto demoró el formulario (solo al crear), para la hipótesis H2. */
  durationMs?: number;
}

export async function saveReminder(
  request: SaveReminderRequest,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return NO_SESSION;
  }
  const result = request.reminderId
    ? await updateReminder(supabase, request.reminderId, request.data)
    : await createReminder(supabase, userId, request.circleId, request.data);

  if (result.ok) {
    const duration = request.durationMs;
    if (
      !request.reminderId &&
      typeof duration === "number" &&
      Number.isInteger(duration) &&
      duration >= 0 &&
      duration <= 86_400_000
    ) {
      await track(supabase, userId, "flow.completed", {
        flow: "reminder_create",
        duration_ms: duration,
      });
    }
    revalidatePath("/recordatorios");
    revalidatePath("/hoy");
  }
  return result;
}

export async function removeReminder(
  reminderId: string,
): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return NO_SESSION;
  }
  const result = await deleteReminder(supabase, reminderId);
  if (result.ok) {
    revalidatePath("/recordatorios");
    revalidatePath("/hoy");
  }
  return result;
}
