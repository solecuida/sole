import { Turnstile } from "@marsidev/react-turnstile";
import type { Metadata } from "next";
import Link from "next/link";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { readEnv } from "@/lib/env";
import { sendMagicLink, signInWithPassword } from "./actions";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  correo: "Revisa tu correo: parece que le falta algo.",
  limite:
    "Hiciste varios intentos seguidos. Espera unos minutos y prueba de nuevo.",
  credenciales: "Correo o contraseña incorrectos.",
  enlace: "El enlace venció o ya se usó. Pide uno nuevo.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const org = single(params.org);
  const next = single(params.next);
  const sent = single(params.enviado) === "1";
  const passwordMode = single(params.modo) === "clave";
  const error = ERRORS[single(params.error) ?? ""];
  const turnstileKey = readEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY");

  const hidden = (
    <>
      {org ? <input type="hidden" name="org" value={org} /> : null}
      {next ? <input type="hidden" name="next" value={next} /> : null}
    </>
  );

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh max-w-content flex-col gap-6 px-4 py-10"
    >
      <h1 className="text-3xl font-bold leading-tight">Entrar a Sole</h1>

      <div aria-live="polite">
        {sent ? (
          <p className="rounded-card border border-success bg-success-bg p-4 text-success">
            Si el correo es válido, te llegó un enlace. Revisa tu bandeja de
            entrada y ábrelo en este mismo teléfono.
          </p>
        ) : null}
      </div>
      {error && !passwordMode ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}

      <form action={sendMagicLink} className="flex flex-col gap-4">
        {hidden}
        <Field
          id="email"
          name="email"
          type="email"
          label="Tu correo"
          hint="Te mandamos un enlace a tu correo. Ábrelo en este mismo teléfono."
          autoComplete="email"
          inputMode="email"
          required
        />
        {turnstileKey ? (
          <Turnstile siteKey={turnstileKey} options={{ language: "es" }} />
        ) : null}
        <SubmitButton>Enviarme el enlace</SubmitButton>
      </form>

      <p className="text-base text-fg-muted">
        No necesitas contraseña. Si es tu primera vez, con ese mismo enlace se
        crea tu cuenta.
      </p>

      <details
        open={passwordMode}
        className="rounded-card border border-border bg-surface p-4"
      >
        <summary className="flex min-h-12 cursor-pointer items-center text-lg font-bold">
          Entrar con contraseña
        </summary>
        <form action={signInWithPassword} className="mt-4 flex flex-col gap-4">
          {hidden}
          {error && passwordMode ? (
            <p
              role="alert"
              className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
            >
              {error}
            </p>
          ) : null}
          <Field
            id="email-clave"
            name="email"
            type="email"
            label="Tu correo"
            autoComplete="email"
            inputMode="email"
            required
          />
          <Field
            id="password"
            name="password"
            type="password"
            label="Tu contraseña"
            hint="Solo si ya creaste una desde «Mi cuenta»."
            autoComplete="current-password"
            required
          />
          <SubmitButton variant="secondary">Entrar</SubmitButton>
        </form>
      </details>

      <p>
        <Link href="/" className="inline-flex min-h-12 items-center">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}
