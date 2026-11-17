import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import {
  getConsentState,
  hasRequiredConsents,
  recordConsents,
} from "@/server/consents/consents";

export const metadata: Metadata = { title: "Tus permisos" };

const WEB = "https://solecuida.com";

async function saveConsents(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const checked = (name: string) => formData.get(name) === "on";
  const result = await recordConsents(supabase, userId, {
    terms: checked("terms"),
    sensitive: checked("sensitive"),
    research: checked("research"),
    ageConfirmed: checked("ageConfirmed"),
    authorizationDeclared: checked("authorizationDeclared"),
  });
  if (!result.ok) {
    redirect(
      `/bienvenida/consentimientos?error=${result.error.code === "validation_failed" ? "faltan" : "guardar"}`,
    );
  }
  redirect("/bienvenida");
}

function Check({ name, children }: { name: string; children: ReactNode }) {
  return (
    <label
      htmlFor={name}
      className="flex min-h-12 cursor-pointer items-start gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-3 text-lg has-[:checked]:border-primary"
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        className="mt-1 size-6 shrink-0 accent-primary"
      />
      <span>{children}</span>
    </label>
  );
}

function Layer({
  title,
  tag,
  children,
}: {
  title: string;
  tag: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-xl font-bold">
        {title} <span className="text-base text-fg-muted">· {tag}</span>
      </h2>
      {children}
    </section>
  );
}

const ERRORS: Record<string, string> = {
  faltan:
    "Para seguir necesitamos que marques las dos declaraciones y los dos permisos obligatorios.",
  guardar: "No pudimos guardar tus permisos. Prueba de nuevo en un momento.",
};

export default async function ConsentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  if (hasRequiredConsents(await getConsentState(supabase, userId))) {
    redirect("/bienvenida");
  }
  const params = await searchParams;
  const error =
    typeof params.error === "string" ? ERRORS[params.error] : undefined;

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">
        Antes de empezar, tus permisos
      </h1>
      <p className="text-fg-muted">
        Sole guarda cosas personales del cuidado. Aquí te contamos qué y te
        pedimos permiso, por partes. Nada viene marcado: tú decides.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}

      <form action={saveConsents} className="flex flex-col gap-6">
        <Layer title="1. Usar Sole" tag="necesario">
          <p>
            Guardamos tu correo para que puedas entrar y lo básico de tu cuenta.
            Sole es gratis, sin publicidad, y no vendemos datos.
          </p>
          <Check name="terms">
            Acepto los <a href={`${WEB}/terminos.html`}>términos de uso</a> y la{" "}
            <a href={`${WEB}/privacidad.html`}>política de privacidad</a>.
          </Check>
          <Check name="ageConfirmed">Tengo 18 años o más.</Check>
        </Layer>

        <Layer title="2. Datos del cuidado" tag="necesario">
          <p>
            Para ayudarte, Sole guarda la rutina de la persona que cuidas:
            recordatorios, medicamentos que tú anotes, cómo estuvo el día y su
            ánimo. Son datos delicados. Solo los ves tú y quienes tú invites.
          </p>
          <Check name="sensitive">
            Autorizo a Sole a guardar estos datos del cuidado.
          </Check>
          <Check name="authorizationDeclared">
            Cuento con la autorización de la persona que cuido o actúo en su
            interés; si es menor de edad, soy su madre, padre o tutor.
          </Check>
        </Layer>

        <Layer title="3. Ayudar a mejorar Sole" tag="opcional">
          <p>
            Sole es un piloto. Si quieres, registramos cómo se usa la app (qué
            pantallas se abren y cuánto demora una tarea), sin tu nombre, sin tu
            correo y sin lo que escribes. Puedes usar Sole igual si dices que
            no, y puedes cambiarlo cuando quieras en «Mi cuenta».
          </p>
          <Check name="research">
            Sí, pueden usar mis datos de uso para mejorar Sole.
          </Check>
        </Layer>

        <p className="text-base text-fg-muted">
          Sole solo usa las cookies necesarias para mantener tu sesión. Más
          detalle en la <a href={`${WEB}/cookies.html`}>política de cookies</a>.
        </p>

        <SubmitButton>Guardar y seguir</SubmitButton>
      </form>
    </>
  );
}
