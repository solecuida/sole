"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export interface MfaEnrollment {
  factorId: string;
  /** Código QR como imagen (data URL que entrega Supabase). */
  qrCode: string;
  /** El mismo secreto, en texto, para escribirlo a mano. */
  secret: string;
}

export interface MfaFormProps {
  /** Id del factor ya inscrito y verificado, si existe. */
  verifiedFactorId: string | null;
  enroll: () => Promise<MfaEnrollment | { error: string }>;
  verify: (
    factorId: string,
    code: string,
  ) => Promise<{ error: string } | undefined>;
}

/** Segundo factor del panel: inscribir una app autenticadora y verificar su código. */
export function MfaForm({ verifiedFactorId, enroll, verify }: MfaFormProps) {
  const [enrollment, setEnrollment] = useState<MfaEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const factorId = enrollment?.factorId ?? verifiedFactorId;

  async function onEnroll() {
    setBusy(true);
    setError(null);
    const result = await enroll();
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setEnrollment(result);
    }
  }

  async function onVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId) {
      return;
    }
    setBusy(true);
    setError(null);
    // Si sale bien, la acción redirige al panel y esto no vuelve.
    const result = await verify(factorId, code.replace(/\s/g, ""));
    setBusy(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="flex max-w-content flex-col gap-6">
      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}

      {!factorId ? (
        <>
          <p>
            Para entrar al panel necesitas un segundo paso: un código de 6
            dígitos que cambia cada 30 segundos. Lo genera una app autenticadora
            en tu teléfono (por ejemplo Google Authenticator o Microsoft
            Authenticator).
          </p>
          <Button pending={busy} onClick={onEnroll}>
            Configurar el segundo paso
          </Button>
        </>
      ) : null}

      {enrollment ? (
        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
          <h2 className="text-xl font-bold">1. Agrega Sole a tu app</h2>
          <p>Escanea este código con la app autenticadora:</p>
          {/* biome-ignore lint/performance/noImgElement: es una imagen generada al momento (data URL), no un archivo del sitio */}
          <img
            src={enrollment.qrCode}
            alt="Código QR para agregar Sole a tu app autenticadora"
            width={200}
            height={200}
            className="rounded-control border border-border bg-primary-fg p-2"
          />
          <p>
            O escribe este código en la app:{" "}
            <code className="break-all font-mono text-base font-bold">
              {enrollment.secret}
            </code>
          </p>
        </section>
      ) : null}

      {factorId ? (
        <form onSubmit={onVerify} noValidate className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">
            {enrollment ? "2. Escribe el código" : "Escribe tu código"}
          </h2>
          <Field
            id="code"
            label="Código de 6 dígitos"
            hint="El que muestra tu app autenticadora ahora."
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button type="submit" pending={busy}>
            Entrar al panel
          </Button>
        </form>
      ) : null}
    </div>
  );
}
