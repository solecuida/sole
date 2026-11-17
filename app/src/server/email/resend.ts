import { readEnv } from "@/lib/env";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/** Envía un correo. `sent: false` significa que NO salió (sin clave, o el servicio falló). */
export type Mailer = (message: MailMessage) => Promise<{ sent: boolean }>;

const DEFAULT_FROM = "Sole <avisos@notificaciones.solecuida.com>";
const TIMEOUT_MS = 10_000;

/**
 * Correos de la app por Resend (nunca por el buzón `hola@`, que es de Zoho y
 * solo lo usa el fundador). Sin `RESEND_API_KEY` no envía nada y lo dice: quien
 * llama decide qué hacer. Nunca lanza ni registra la dirección de la persona.
 */
export function resendMailer(): Mailer {
  return async ({ to, subject, text }) => {
    const apiKey = readEnv("RESEND_API_KEY");
    if (!apiKey) {
      return { sent: false };
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: readEnv("EMAIL_FROM") ?? DEFAULT_FROM,
          to: [to],
          subject,
          text,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return { sent: response.ok };
    } catch {
      return { sent: false };
    }
  };
}
