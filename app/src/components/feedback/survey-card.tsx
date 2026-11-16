"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SurveyDefinition } from "@/lib/feedback/surveys";
import type { Result } from "@/lib/result";

export interface SurveyCardProps {
  survey: SurveyDefinition;
  /** Server Action: guarda la respuesta. */
  answer: (key: string, value: string) => Promise<Result<undefined, string>>;
  /** Server Action: cierra la encuesta sin responder. */
  dismiss: (key: string) => Promise<Result<undefined, string>>;
}

type Phase = "asking" | "answered" | "dismissed";

/** Una pregunta con opciones grandes y «Ahora no». Una vez cerrada no vuelve. */
export function SurveyCard({ survey, answer, dismiss }: SurveyCardProps) {
  const [phase, setPhase] = useState<Phase>("asking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(
    action: () => Promise<Result<undefined, string>>,
    next: Phase,
  ) {
    setBusy(true);
    setError(null);
    let result: Result<undefined, string>;
    try {
      result = await action();
    } catch {
      result = {
        ok: false,
        error: {
          code: "internal",
          message: "No pudimos guardarlo. Prueba de nuevo.",
        },
      };
    }
    setBusy(false);
    if (result.ok) {
      setPhase(next);
    } else {
      setError(result.error.message);
    }
  }

  if (phase === "dismissed") {
    return null;
  }

  return (
    <section
      aria-labelledby="encuesta-titulo"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      <h2 id="encuesta-titulo" className="text-base font-bold text-fg-muted">
        Una pregunta rápida
      </h2>
      {phase === "asking" ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xl">{survey.question}</legend>
            {survey.options.map((option) => (
              <Button
                key={option.value}
                variant="secondary"
                disabled={busy}
                className="w-full justify-start"
                onClick={() =>
                  run(() => answer(survey.key, option.value), "answered")
                }
              >
                {option.label}
              </Button>
            ))}
          </fieldset>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => run(() => dismiss(survey.key), "dismissed")}
          >
            Ahora no
          </Button>
        </>
      ) : null}
      <p aria-live="polite" className="text-base">
        {phase === "answered" ? "Gracias por contarnos." : null}
        {error ? <span className="font-bold text-danger">{error}</span> : null}
      </p>
    </section>
  );
}
