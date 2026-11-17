import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { track } from "@/server/events/track";
import { type ApiErrorCode, apiError, apiOk, readJson } from "@/server/http";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    occurrenceId: z.uuid(),
    status: z.enum(["done", "not_done", "snoozed"]),
    reason: z.enum(["rechazo", "no_habia", "otro"]).optional(),
    snoozeMinutes: z.number().int().min(5).max(240).optional(),
    /** Clave nueva por cada marca: un reintento con la misma clave no cambia nada. */
    idempotencyKey: z.uuid(),
    via: z.enum(["app", "push", "offline_sync"]).default("app"),
  })
  .refine((body) => body.reason === undefined || body.status === "not_done")
  .refine(
    (body) => body.snoozeMinutes === undefined || body.status === "snoozed",
  );

/** Códigos de Postgres que lanza la RPC `mark_occurrence` → código de la API. */
const RPC_ERRORS: Record<string, ApiErrorCode> = {
  "28000": "unauthorized",
  "42501": "forbidden",
  P0002: "not_found",
  P0001: "conflict",
  "22023": "validation_failed",
};

// Marca un ítem como hecho, no hecho o pospuesto. La usan "Hoy", la cola sin
// conexión y los botones del aviso "¿Lo hiciste?".
export async function POST(request: Request): Promise<Response> {
  const supabase = createSupabaseRouteClient(request);
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return apiError("unauthorized");
  }
  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("validation_failed");
  }
  const body = parsed.data;

  const { data, error } = await supabase.rpc("mark_occurrence", {
    p_occurrence: body.occurrenceId,
    p_status: body.status,
    p_idempotency_key: body.idempotencyKey,
    p_reason: body.reason,
    p_snooze_minutes: body.snoozeMinutes,
    p_via: body.via,
  });
  if (error || !data) {
    const code = RPC_ERRORS[error?.code ?? ""] ?? "internal";
    return apiError(
      code,
      code === "forbidden"
        ? "No puedes marcar ítems de este círculo."
        : code === "not_found"
          ? "No encontramos ese ítem. Puede que ya no exista."
          : undefined,
    );
  }

  const reminder = await supabase
    .from("reminders")
    .select("kind")
    .eq("id", data.reminder_id)
    .maybeSingle();
  if (reminder.data) {
    await track(supabase, userId, "occurrence.marked", {
      status: body.status,
      via: body.via,
      kind: reminder.data.kind,
    });
  }

  return apiOk({
    id: data.id,
    status: data.status,
    done_at: data.done_at,
    snoozed_until: data.snoozed_until,
  });
}
