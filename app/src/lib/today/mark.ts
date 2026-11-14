// Forma de una marca ("Hecho", "No se hizo", "Posponer") tal como viaja a
// POST /api/occurrences/mark. La comparten "Hoy" y la cola sin conexión.

export type MarkStatus = "done" | "not_done" | "snoozed";
export type NotDoneReason = "rechazo" | "no_habia" | "otro";

export interface MarkRequest {
  occurrenceId: string;
  status: MarkStatus;
  reason?: NotDoneReason;
  snoozeMinutes?: number;
  idempotencyKey: string;
  via: "app" | "push" | "offline_sync";
}

export const REASON_LABELS: Record<NotDoneReason, string> = {
  rechazo: "Lo rechazó",
  no_habia: "No había",
  otro: "Otro",
};

export const SNOOZE_OPTIONS = [
  { minutes: 30, label: "30 minutos" },
  { minutes: 60, label: "1 hora" },
  { minutes: 120, label: "2 horas" },
] as const;

export type MarkOutcome =
  | { kind: "saved" }
  /** Sin red: quien llama decide si la guarda para después. */
  | { kind: "offline" }
  | { kind: "error"; status: number; message: string };

/** Envía una marca. Nunca lanza. */
export async function sendMark(
  mark: MarkRequest,
  fetchFn: typeof fetch = fetch,
): Promise<MarkOutcome> {
  let response: Response;
  try {
    response = await fetchFn("/api/occurrences/mark", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mark),
    });
  } catch {
    return { kind: "offline" };
  }
  if (response.ok) {
    return { kind: "saved" };
  }
  let message = "No pudimos guardar. Prueba de nuevo.";
  try {
    const json = await response.json();
    if (typeof json?.error?.message === "string") {
      message = json.error.message;
    }
  } catch {
    // Respuesta sin cuerpo JSON: se usa el mensaje por defecto.
  }
  return { kind: "error", status: response.status, message };
}
