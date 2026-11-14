"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/route-rules";
import { appUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type LoginDeps,
  type LoginErrorCode,
  passwordSignIn,
  requestMagicLink,
} from "@/server/auth/login";
import { checkRateLimit } from "@/server/security/rate-limit";

const ERROR_PARAM: Record<LoginErrorCode, string> = {
  validation_failed: "correo",
  rate_limited: "limite",
  invalid_credentials: "credenciales",
};

function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

async function realDeps(): Promise<LoginDeps> {
  const supabase = await createSupabaseServerClient();
  const forwarded = (await headers()).get("x-forwarded-for");
  return {
    auth: supabase.auth,
    rateLimit: checkRateLimit,
    appUrl: appUrl(),
    ip: forwarded?.split(",")[0]?.trim() || null,
  };
}

/** Vuelve a /entrar conservando el código de organización y el destino. */
function backToLogin(formData: FormData, extra: Record<string, string>): never {
  const params = new URLSearchParams(extra);
  const org = field(formData, "org");
  const next = field(formData, "next");
  if (org) {
    params.set("org", org);
  }
  if (next) {
    params.set("next", next);
  }
  redirect(`/entrar?${params.toString()}`);
}

export async function sendMagicLink(formData: FormData): Promise<void> {
  const result = await requestMagicLink(await realDeps(), {
    email: field(formData, "email") ?? "",
    captchaToken: field(formData, "cf-turnstile-response"),
    org: field(formData, "org"),
  });
  backToLogin(
    formData,
    result.ok ? { enviado: "1" } : { error: ERROR_PARAM[result.error.code] },
  );
}

export async function signInWithPassword(formData: FormData): Promise<void> {
  const result = await passwordSignIn(await realDeps(), {
    email: field(formData, "email") ?? "",
    password: field(formData, "password") ?? "",
    captchaToken: field(formData, "cf-turnstile-response"),
  });
  if (!result.ok) {
    backToLogin(formData, {
      error: ERROR_PARAM[result.error.code],
      modo: "clave",
    });
  }
  redirect(safeNextPath(field(formData, "next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
