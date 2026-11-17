"use client";

import { useEffect, useRef, useState } from "react";

type Step = "idle" | "asking" | "sending" | "called" | "failed";

/** Número al que se llama si el aviso no funcionó. [VERIFICAR] 131 = SAMU en Chile. */
const BACKUP_NUMBER = "131";

/** Solo dígitos y `+`: lo único que debe llegar a un enlace `tel:`. */
function dialable(value: unknown): string {
  return typeof value === "string" ? value.replace(/[^\d+]/g, "") : "";
}

const bigButton =
  "inline-flex min-h-16 w-full items-center justify-center rounded-control border-2 px-6 py-4 text-2xl font-bold no-underline";

/**
 * Pedir ayuda. Primero pregunta; solo "Sí, llamar" avisa a la familia y muestra
 * el enlace para llamar. La llamada nunca depende de que el aviso funcione.
 */
export function EmergencyButton({ token }: { token: string }) {
  const [step, setStep] = useState<Step>("idle");
  const [number, setNumber] = useState(BACKUP_NUMBER);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const askRef = useRef<HTMLButtonElement>(null);
  const callRef = useRef<HTMLAnchorElement>(null);
  const wasAsking = useRef(false);

  useEffect(() => {
    if (step === "asking") {
      wasAsking.current = true;
      questionRef.current?.focus();
    } else if (step === "idle" && wasAsking.current) {
      wasAsking.current = false;
      askRef.current?.focus();
    } else if (step === "called" || step === "failed") {
      callRef.current?.focus();
    }
  }, [step]);

  async function send() {
    setStep("sending");
    try {
      const response = await fetch(
        `/api/v/${encodeURIComponent(token)}/emergencia`,
        { method: "POST" },
      );
      if (!response.ok) {
        setNumber(BACKUP_NUMBER);
        setStep("failed");
        return;
      }
      const body: unknown = await response.json();
      const callNumber = dialable(
        (body as { data?: { callNumber?: unknown } } | null)?.data?.callNumber,
      );
      if (callNumber === "") {
        setNumber(BACKUP_NUMBER);
        setStep("failed");
        return;
      }
      setNumber(callNumber);
      setStep("called");
    } catch {
      setNumber(BACKUP_NUMBER);
      setStep("failed");
    }
  }

  if (step === "called" || step === "failed") {
    return (
      <section
        aria-label="Pedir ayuda"
        className="flex flex-col gap-4 rounded-card border-2 border-danger bg-danger-bg p-6"
      >
        {step === "failed" ? (
          <p role="alert" className="text-2xl font-bold text-danger">
            No pudimos enviar el aviso. Llama por teléfono.
          </p>
        ) : (
          <p role="status" className="text-2xl font-bold text-danger">
            Avisamos a quienes te cuidan.
          </p>
        )}
        <a
          ref={callRef}
          href={`tel:${number}`}
          className={`${bigButton} border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover`}
        >
          Llamar al {number}
        </a>
      </section>
    );
  }

  if (step === "asking" || step === "sending") {
    return (
      <section
        aria-labelledby="pregunta-ayuda"
        className="flex flex-col gap-4 rounded-card border-2 border-danger bg-danger-bg p-6"
      >
        <h2
          id="pregunta-ayuda"
          ref={questionRef}
          tabIndex={-1}
          className="text-3xl font-bold text-danger outline-none"
        >
          ¿Quieres pedir ayuda ahora?
        </h2>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={send}
            disabled={step === "sending"}
            aria-busy={step === "sending" ? "true" : undefined}
            className={`${bigButton} border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Sí, llamar
          </button>
          <button
            type="button"
            onClick={() => setStep("idle")}
            disabled={step === "sending"}
            className={`${bigButton} border-border-strong bg-background text-fg hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
          >
            No
          </button>
        </div>
      </section>
    );
  }

  return (
    <button
      ref={askRef}
      type="button"
      onClick={() => setStep("asking")}
      className={`${bigButton} border-danger bg-danger-bg text-danger hover:bg-surface`}
    >
      Pedir ayuda
    </button>
  );
}
