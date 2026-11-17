import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { type MfaEnrollment, MfaForm } from "@/components/admin/mfa-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAccess, requireAdmin } from "@/server/admin/guard";

export const metadata: Metadata = { title: "Segundo paso" };

const GENERIC = "No pudimos completar el segundo paso. Prueba de nuevo.";

/** Cliente de quien es administrador (con o sin segundo factor); si no, 404. */
async function adminWithoutMfa() {
  const supabase = await createSupabaseServerClient();
  const check = await requireAdmin(supabase);
  if (!check.ok && check.reason === "not_admin") {
    notFound();
  }
  return { supabase, check };
}

/** Inscribe una app autenticadora. Descarta antes las inscripciones a medio terminar. */
async function enroll(): Promise<MfaEnrollment | { error: string }> {
  "use server";
  const { supabase } = await adminWithoutMfa();
  const factors = await supabase.auth.mfa.listFactors();
  for (const factor of factors.data?.all ?? []) {
    if (factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  if ((factors.data?.totp ?? []).length > 0) {
    // Ya hay un factor verificado: no se inscribe otro sin pasar por él.
    return {
      error: "Ya tienes un segundo paso configurado. Escribe su código.",
    };
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Sole ${Date.now()}`,
  });
  if (error || !data) {
    return { error: GENERIC };
  }
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/** Verifica el código. Si es correcto, la sesión sube a aal2 y entra al panel. */
async function verify(
  factorId: string,
  code: string,
): Promise<{ error: string } | undefined> {
  "use server";
  const { supabase } = await adminWithoutMfa();
  if (!/^[0-9a-f-]{36}$/.test(factorId) || !/^\d{6}$/.test(code)) {
    return { error: "El código tiene 6 dígitos. Revísalo y prueba de nuevo." };
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    return { error: "Ese código no calza o ya venció. Prueba con el actual." };
  }
  await logAdminAccess(supabase, "segundo paso verificado", "/admin/mfa");
  redirect("/admin");
}

export default async function AdminMfaPage() {
  const { supabase, check } = await adminWithoutMfa();
  if (check.ok) {
    redirect("/admin");
  }
  const factors = await supabase.auth.mfa.listFactors();
  const verified = factors.data?.totp?.[0]?.id ?? null;

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Segundo paso</h1>
      <MfaForm verifiedFactorId={verified} enroll={enroll} verify={verify} />
    </>
  );
}
