"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export interface CreateLinkState {
  /** Enlace completo. Solo existe justo después de crearlo. */
  url?: string;
  error?: string;
}

export type CreateLinkAction = (
  previous: CreateLinkState,
  formData: FormData,
) => Promise<CreateLinkState>;

/**
 * Formulario para crear el vínculo. El enlace vuelve como valor de la acción:
 * nunca viaja en la dirección de la página ni queda en el historial.
 */
export function LinkCreator({
  action,
  circleId,
}: {
  action: CreateLinkAction;
  circleId: string;
}) {
  const [state, formAction] = useActionState<CreateLinkState, FormData>(
    action,
    {},
  );
  const [copied, setCopied] = useState<"si" | "no" | null>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);

  // Cada enlace nuevo parte sin "Copiado" y lleva el foco al aviso.
  useEffect(() => {
    setCopied(null);
    if (state.url) {
      resultRef.current?.focus();
    }
  }, [state.url]);

  async function copy() {
    if (!state.url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(state.url);
      setCopied("si");
    } catch {
      setCopied("no");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="circleId" value={circleId} />
        <Field
          id="nombre-vinculo"
          name="label"
          label="Nombre del vínculo (opcional)"
          hint="Por ejemplo: Tablet de la mamá. Te sirve para saber cuál es cuál."
          maxLength={60}
          autoComplete="off"
          error={state.error}
        />
        <SubmitButton>Crear vínculo</SubmitButton>
      </form>

      {state.url ? (
        <section
          aria-labelledby="enlace-nuevo"
          className="flex flex-col gap-3 rounded-card border-2 border-primary bg-surface p-4"
        >
          <h3
            id="enlace-nuevo"
            ref={resultRef}
            tabIndex={-1}
            className="text-xl font-bold outline-none"
          >
            Este es el enlace nuevo
          </h3>
          <p className="font-bold">
            Cópialo ahora: no se podrá volver a ver. Si lo pierdes, revoca este
            vínculo y crea otro.
          </p>
          <Field
            id="enlace-completo"
            label="Enlace"
            value={state.url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-primary bg-primary px-5 py-2 text-lg font-bold text-primary-fg hover:border-primary-hover hover:bg-primary-hover"
            >
              Copiar enlace
            </button>
            <p role="status" className="font-bold">
              {copied === "si"
                ? "Listo, copiado."
                : copied === "no"
                  ? "No pudimos copiar. Selecciona el enlace y cópialo a mano."
                  : ""}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
