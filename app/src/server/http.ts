// Sobre único de las respuestas de la API:
//   éxito  { ok: true, data }
//   error  { ok: false, error: { code, message } }   (message en español, sin detalles internos)

const STATUS = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation_failed: 422,
  rate_limited: 429,
  captcha_failed: 400,
  invitation_invalid: 400,
  unavailable: 503,
  db_unavailable: 503,
  internal: 500,
} as const;

export type ApiErrorCode = keyof typeof STATUS;

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  unauthorized: "Tu sesión terminó. Vuelve a entrar para seguir.",
  forbidden: "No tienes permiso para hacer esto.",
  not_found: "No encontramos lo que buscas.",
  conflict: "Esto ya cambió. Actualiza la página y prueba de nuevo.",
  validation_failed: "Hay un dato que no calza. Revísalo y prueba de nuevo.",
  rate_limited:
    "Hiciste varios intentos seguidos. Espera unos minutos y prueba de nuevo.",
  captcha_failed: "No pudimos comprobar que eres una persona. Prueba de nuevo.",
  invitation_invalid: "Esta invitación ya no sirve.",
  unavailable: "Esto no está disponible por ahora.",
  db_unavailable: "No pudimos conectarnos. Prueba de nuevo en un momento.",
  internal: "Algo salió mal. Prueba de nuevo en un momento.",
};

const NO_STORE = { "cache-control": "no-store" };

export function apiOk<T>(data: T): Response {
  return Response.json({ ok: true, data }, { headers: NO_STORE });
}

export function apiError(code: ApiErrorCode, message?: string): Response {
  return Response.json(
    { ok: false, error: { code, message: message ?? DEFAULT_MESSAGES[code] } },
    { status: STATUS[code], headers: NO_STORE },
  );
}

/** Cuerpo JSON de la petición, o null si no es JSON válido. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
