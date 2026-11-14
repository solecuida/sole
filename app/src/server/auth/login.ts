import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import { RATE_LIMITS } from "@/server/security/rate-limit";

// Lógica de ingreso sin red ni cookies: todo lo externo llega por `deps`,
// así se prueba con dobles y la Server Action solo arma las dependencias reales.

export interface LoginAuth {
  signInWithOtp(credentials: {
    email: string;
    options: {
      emailRedirectTo: string;
      shouldCreateUser: boolean;
      captchaToken?: string;
      data?: { org_code: string };
    };
  }): Promise<{ error: unknown }>;
  signInWithPassword(credentials: {
    email: string;
    password: string;
    options?: { captchaToken?: string };
  }): Promise<{ error: unknown }>;
}

export interface LoginDeps {
  auth: LoginAuth;
  rateLimit: (
    scope: string,
    raw: string,
    limit: number,
    windowSeconds: number,
  ) => Promise<{ allowed: boolean }>;
  /** URL base de la app, sin barra final. */
  appUrl: string;
  /** IP de quien pide, si se conoce. */
  ip?: string | null;
}

export type LoginErrorCode =
  | "validation_failed"
  | "rate_limited"
  | "invalid_credentials";

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

const captchaSchema = z.string().min(1).max(4096).optional();

const magicLinkSchema = z.object({
  email: emailSchema,
  captchaToken: captchaSchema,
  org: z
    .string()
    .regex(/^[A-Za-z0-9-]{3,32}$/)
    .optional(),
});

const passwordSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
  captchaToken: captchaSchema,
});

const MESSAGES = {
  email: "Revisa tu correo: parece que le falta algo.",
  rate: "Hiciste varios intentos seguidos. Espera unos minutos y prueba de nuevo.",
  credentials: "Correo o contraseña incorrectos.",
} as const;

/** Cuenta el intento por IP y por correo. `false` si alguno pasó su límite. */
async function withinLimits(deps: LoginDeps, email: string): Promise<boolean> {
  if (deps.ip) {
    const byIp = await deps.rateLimit(
      "login_ip",
      deps.ip,
      RATE_LIMITS.login_ip.limit,
      RATE_LIMITS.login_ip.windowSeconds,
    );
    if (!byIp.allowed) {
      return false;
    }
  }
  const byEmail = await deps.rateLimit(
    "login",
    email,
    RATE_LIMITS.login.limit,
    RATE_LIMITS.login.windowSeconds,
  );
  return byEmail.allowed;
}

/**
 * Envía el enlace para entrar. Si la cuenta no existe, se crea.
 * La respuesta es la misma pase lo que pase con Supabase: nunca revela
 * si un correo tiene cuenta.
 */
export async function requestMagicLink(
  deps: LoginDeps,
  input: unknown,
): Promise<Result<undefined, LoginErrorCode>> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation_failed", MESSAGES.email);
  }
  const { email, captchaToken, org } = parsed.data;

  if (!(await withinLimits(deps, email))) {
    return fail("rate_limited", MESSAGES.rate);
  }

  try {
    await deps.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${deps.appUrl}/auth/confirm`,
        shouldCreateUser: true,
        ...(captchaToken ? { captchaToken } : {}),
        ...(org ? { data: { org_code: org.toUpperCase() } } : {}),
      },
    });
  } catch {
    // Mismo resultado que un envío correcto, a propósito.
  }
  return ok();
}

/** Ingreso con contraseña (opcional). El error es idéntico para clave mala y correo desconocido. */
export async function passwordSignIn(
  deps: LoginDeps,
  input: unknown,
): Promise<Result<undefined, LoginErrorCode>> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("invalid_credentials", MESSAGES.credentials);
  }
  const { email, password, captchaToken } = parsed.data;

  if (!(await withinLimits(deps, email))) {
    return fail("rate_limited", MESSAGES.rate);
  }

  try {
    const { error } = await deps.auth.signInWithPassword({
      email,
      password,
      ...(captchaToken ? { options: { captchaToken } } : {}),
    });
    if (error) {
      return fail("invalid_credentials", MESSAGES.credentials);
    }
  } catch {
    return fail("invalid_credentials", MESSAGES.credentials);
  }
  return ok();
}
