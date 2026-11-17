import { z } from "zod";
import { readEnv } from "@/lib/env";
import { apiError } from "@/server/http";
import { checkRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

// Formulario «Conversemos» del sitio web (solecuida.com).
//
// Es la ÚNICA ruta de la app pensada para otro origen: responde CORS solo a los
// orígenes de WEB_ALLOWED_ORIGINS (lista explícita, sin comodín). Comprueba que
// quien escribe es una persona (Turnstile), cuenta los envíos por IP y guarda el
// contacto en la tabla `contactos` del proyecto `sole-web`, con su clave secreta,
// que nunca llega al navegador. Los datos de este formulario no tocan la base de
// la app.

const DEFAULT_ORIGINS = "https://solecuida.com,https://www.solecuida.com";
const TURNSTILE_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 8000;
/** Un envío más rápido que esto lo hace un programa, no una persona. */
const MIN_FILL_MS = 3000;

const RELACIONES = [
  "cuidador-conviviente",
  "cuidador-distancia",
  "circulo",
  "cuidadora-contratada",
  "profesional",
  "organizacion",
  "cuide-antes",
  "otro",
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const bodySchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  contacto: z.string().trim().min(3).max(160),
  relacion: z.enum(RELACIONES),
  comuna: optionalText(120),
  mensaje: optionalText(2000),
  consentimiento: z.literal(true),
  origen: optionalText(300),
  /** Campo trampa: una persona no lo ve ni lo llena. */
  trampa: z.string().max(500).optional(),
  /** Milisegundos desde que se abrió la página hasta el envío. */
  llenadoMs: z.number().int().nonnegative().optional(),
  turnstileToken: z.string().max(2048).optional(),
});

function allowedOrigins(): string[] {
  return (readEnv("WEB_ALLOWED_ORIGINS") ?? DEFAULT_ORIGINS)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/** Cabeceras CORS para un origen permitido, o null si no lo está. */
function corsFor(request: Request): Headers | null {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) {
    return null;
  }
  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  });
}

function withCors(response: Response, cors: Headers): Response {
  for (const [key, value] of cors) {
    response.headers.set(key, value);
  }
  return response;
}

function forbidden(): Response {
  return Response.json(
    {
      ok: false,
      error: { code: "forbidden", message: "Origen no permitido." },
    },
    { status: 403, headers: { "cache-control": "no-store" } },
  );
}

async function verifyTurnstile(
  secret: string,
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!token) {
    return false;
  }
  const form = new URLSearchParams({ secret, response: token });
  if (ip) {
    form.set("remoteip", ip);
  }
  try {
    const response = await fetch(TURNSTILE_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = (await response.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function OPTIONS(request: Request): Promise<Response> {
  const cors = corsFor(request);
  if (!cors) {
    return forbidden();
  }
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request: Request): Promise<Response> {
  const cors = corsFor(request);
  if (!cors) {
    return forbidden();
  }
  const reply = (response: Response) => withCors(response, cors);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return reply(apiError("validation_failed"));
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return reply(apiError("validation_failed"));
  }
  const body = parsed.data;

  // Un robot: se le responde como si todo saliera bien y no se guarda nada.
  if (
    (body.trampa ?? "") !== "" ||
    (body.llenadoMs !== undefined && body.llenadoMs < MIN_FILL_MS)
  ) {
    return reply(
      Response.json({ ok: true }, { headers: { "cache-control": "no-store" } }),
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const { limit, windowSeconds } = RATE_LIMITS.web_contact;
  const rate = await checkRateLimit(
    "web_contact",
    ip ?? "sin-ip",
    limit,
    windowSeconds,
  );
  if (!rate.allowed) {
    return reply(apiError("rate_limited"));
  }

  const turnstileSecret = readEnv("TURNSTILE_SECRET_KEY");
  if (
    turnstileSecret &&
    !(await verifyTurnstile(turnstileSecret, body.turnstileToken, ip))
  ) {
    return reply(apiError("captcha_failed"));
  }

  const url = readEnv("WEB_CONTACT_SUPABASE_URL");
  const key = readEnv("WEB_CONTACT_SUPABASE_SECRET_KEY");
  if (!url || !key) {
    return reply(apiError("unavailable"));
  }
  try {
    const inserted = await fetch(
      `${url.replace(/\/+$/, "")}/rest/v1/contactos`,
      {
        method: "POST",
        headers: {
          apikey: key,
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
          prefer: "return=minimal",
        },
        body: JSON.stringify({
          nombre: body.nombre,
          contacto: body.contacto,
          relacion: body.relacion,
          comuna: body.comuna,
          mensaje: body.mensaje,
          consentimiento: true,
          origen: body.origen ?? "directo",
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!inserted.ok) {
      return reply(apiError("internal"));
    }
  } catch {
    return reply(apiError("internal"));
  }
  return reply(
    Response.json({ ok: true }, { headers: { "cache-control": "no-store" } }),
  );
}
