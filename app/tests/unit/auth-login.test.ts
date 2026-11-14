import { describe, expect, it, vi } from "vitest";
import {
  type LoginDeps,
  passwordSignIn,
  requestMagicLink,
} from "@/server/auth/login";

function makeDeps(overrides: Partial<LoginDeps> = {}) {
  const signInWithOtp = vi.fn(async () => ({ error: null as unknown }));
  const signInWithPassword = vi.fn(async () => ({ error: null as unknown }));
  const rateLimit = vi.fn(async () => ({ allowed: true }));
  const deps: LoginDeps = {
    auth: { signInWithOtp, signInWithPassword },
    rateLimit,
    appUrl: "https://app.solecuida.com",
    ip: "203.0.113.7",
    ...overrides,
  };
  return { deps, signInWithOtp, signInWithPassword, rateLimit };
}

describe("requestMagicLink", () => {
  it("con un correo válido llama una vez a signInWithOtp con el destino y el código de organización", async () => {
    const { deps, signInWithOtp } = makeDeps();
    const result = await requestMagicLink(deps, {
      email: "  Persona@Example.TEST ",
      org: "demo-local",
    });
    expect(result).toEqual({ ok: true, data: undefined });
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "persona@example.test",
      options: {
        emailRedirectTo: "https://app.solecuida.com/auth/confirm",
        shouldCreateUser: true,
        data: { org_code: "DEMO-LOCAL" },
      },
    });
  });

  it("pasa el token de captcha cuando llega y no inventa org_code", async () => {
    const { deps, signInWithOtp } = makeDeps();
    await requestMagicLink(deps, {
      email: "persona@example.test",
      captchaToken: "token-turnstile",
    });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "persona@example.test",
      options: {
        emailRedirectTo: "https://app.solecuida.com/auth/confirm",
        shouldCreateUser: true,
        captchaToken: "token-turnstile",
      },
    });
  });

  it("cuenta el intento por IP y por correo", async () => {
    const { deps, rateLimit } = makeDeps();
    await requestMagicLink(deps, { email: "persona@example.test" });
    expect(rateLimit).toHaveBeenCalledWith("login_ip", "203.0.113.7", 300, 900);
    expect(rateLimit).toHaveBeenCalledWith(
      "login",
      "persona@example.test",
      5,
      900,
    );
  });

  it("con un correo mal escrito responde validation_failed sin llamar a Supabase", async () => {
    for (const email of ["no-es-correo", "", "a@", `${"x".repeat(250)}@a.cl`]) {
      const { deps, signInWithOtp, rateLimit } = makeDeps();
      const result = await requestMagicLink(deps, { email });
      expect(result).toMatchObject({
        ok: false,
        error: { code: "validation_failed" },
      });
      expect(signInWithOtp).not.toHaveBeenCalled();
      expect(rateLimit).not.toHaveBeenCalled();
    }
  });

  it("con un código de organización inválido responde validation_failed", async () => {
    const { deps, signInWithOtp } = makeDeps();
    const result = await requestMagicLink(deps, {
      email: "persona@example.test",
      org: "x y",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "validation_failed" },
    });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("si el límite se niega responde rate_limited sin llamar a Supabase", async () => {
    const { deps, signInWithOtp } = makeDeps({
      rateLimit: vi.fn(async () => ({ allowed: false })),
    });
    const result = await requestMagicLink(deps, {
      email: "persona@example.test",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "rate_limited" },
    });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("si Supabase devuelve o lanza un error, igual responde ok (no revela si la cuenta existe)", async () => {
    const withError = makeDeps();
    withError.signInWithOtp.mockResolvedValueOnce({
      error: { message: "Signups not allowed for otp" },
    });
    expect(
      await requestMagicLink(withError.deps, { email: "persona@example.test" }),
    ).toEqual({ ok: true, data: undefined });

    const throwing = makeDeps();
    throwing.signInWithOtp.mockRejectedValueOnce(new Error("sin red"));
    expect(
      await requestMagicLink(throwing.deps, { email: "persona@example.test" }),
    ).toEqual({ ok: true, data: undefined });
  });
});

describe("passwordSignIn", () => {
  const expected = {
    ok: false,
    error: {
      code: "invalid_credentials",
      message: "Correo o contraseña incorrectos.",
    },
  };

  it("entra con correo y contraseña correctos", async () => {
    const { deps, signInWithPassword } = makeDeps();
    const result = await passwordSignIn(deps, {
      email: "Persona@example.test",
      password: "Aa1-una-clave-larga",
    });
    expect(result).toEqual({ ok: true, data: undefined });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "persona@example.test",
      password: "Aa1-una-clave-larga",
    });
  });

  it("responde lo mismo con contraseña mala y con correo desconocido", async () => {
    const wrongPassword = makeDeps();
    wrongPassword.signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });
    const unknownEmail = makeDeps();
    unknownEmail.signInWithPassword.mockResolvedValueOnce({
      error: { message: "User not found" },
    });

    const first = await passwordSignIn(wrongPassword.deps, {
      email: "persona@example.test",
      password: "mala",
    });
    const second = await passwordSignIn(unknownEmail.deps, {
      email: "nadie@example.test",
      password: "cualquiera",
    });
    expect(first).toEqual(expected);
    expect(second).toEqual(expected);
  });

  it("con datos mal formados responde lo mismo, sin llamar a Supabase", async () => {
    const { deps, signInWithPassword } = makeDeps();
    expect(
      await passwordSignIn(deps, { email: "no-es-correo", password: "" }),
    ).toEqual(expected);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("si el límite se niega responde rate_limited sin llamar a Supabase", async () => {
    const { deps, signInWithPassword } = makeDeps({
      rateLimit: vi.fn(async () => ({ allowed: false })),
    });
    const result = await passwordSignIn(deps, {
      email: "persona@example.test",
      password: "Aa1-una-clave-larga",
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "rate_limited" },
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});
