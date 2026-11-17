import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

// Filtro de datos personales para Sentry. Solo `import type`: este módulo no
// carga el SDK, así que se puede usar (y probar) en cualquier entorno.

export const REDACTED = "[filtrado]";

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 8 o más dígitos, con espacios, guiones o un "+" al inicio.
const PHONE = /\+?\d(?:[\s-]?\d){7,}/g;
const SENSITIVE_PARAM =
  /((?:[?&#]|^)(?:token_hash|token|code|email|next)=)[^&#\s"']*/g;

// Enlaces secretos que van en la ruta: el vínculo de la persona cuidada
// (/v/<enlace>, /api/v/<enlace>/…) y las invitaciones (/invitar/<enlace>).
const SECRET_PATH = /(\/(?:v|invitar)\/)[A-Za-z0-9_-]{16,}/g;

export function scrubText(text: string): string {
  return text
    .replace(SECRET_PATH, `$1${REDACTED}`)
    .replace(SENSITIVE_PARAM, `$1${REDACTED}`)
    .replace(EMAIL, REDACTED)
    .replace(PHONE, REDACTED);
}

function scrubData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = typeof value === "string" ? scrubText(value) : value;
  }
  return result;
}

export function scrubBreadcrumb<T extends Breadcrumb>(breadcrumb: T): T {
  const next: T = { ...breadcrumb };
  if (typeof next.message === "string") {
    next.message = scrubText(next.message);
  }
  if (next.data) {
    next.data = scrubData(next.data);
  }
  return next;
}

export function scrubEvent<T extends ErrorEvent>(event: T): T {
  const next: T = { ...event };

  if (next.user) {
    next.user = next.user.id === undefined ? {} : { id: next.user.id };
  }

  if (next.request) {
    const request = { ...next.request };
    delete request.cookies;
    delete request.data;
    const userAgent = request.headers?.["user-agent"];
    if (userAgent === undefined) {
      delete request.headers;
    } else {
      request.headers = { "user-agent": userAgent };
    }
    if (typeof request.url === "string") {
      request.url = scrubText(request.url);
    }
    if (typeof request.query_string === "string") {
      request.query_string = scrubText(request.query_string);
    }
    next.request = request;
  }

  if (typeof next.message === "string") {
    next.message = scrubText(next.message);
  }

  // El nombre de la operación puede traer la ruta real, con un enlace secreto.
  if (typeof next.transaction === "string") {
    next.transaction = scrubText(next.transaction);
  }

  if (next.exception?.values) {
    next.exception = {
      ...next.exception,
      values: next.exception.values.map((item) =>
        typeof item.value === "string"
          ? { ...item, value: scrubText(item.value) }
          : item,
      ),
    };
  }

  if (next.breadcrumbs) {
    next.breadcrumbs = next.breadcrumbs.map(scrubBreadcrumb);
  }

  return next;
}

export function buildSentryOptions(dsn: string | undefined) {
  return {
    enabled: Boolean(dsn),
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  };
}
