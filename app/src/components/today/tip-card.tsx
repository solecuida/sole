"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface TipCardProps {
  text: string;
  /** Presente si el consejo es una actividad que se puede sumar al día. */
  activityTitle: string | null;
  alreadyAccepted: boolean;
  /** Server Action que agrega la actividad al día. */
  accept: () => Promise<{ ok: boolean; message?: string }>;
}

/** Consejo o actividad del día: breve, cálido y sin consejo médico. */
export function TipCard({
  text,
  activityTitle,
  alreadyAccepted,
  accept,
}: TipCardProps) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(alreadyAccepted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    setBusy(true);
    setError(null);
    const result = await accept();
    setBusy(false);
    if (result.ok) {
      setAccepted(true);
      router.refresh();
    } else {
      setError(result.message ?? "No pudimos agregarla. Prueba de nuevo.");
    }
  }

  return (
    <section
      aria-labelledby="consejo-titulo"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      <h2 id="consejo-titulo" className="text-base font-bold text-fg-muted">
        {activityTitle ? "Una idea para hoy" : "Para hoy"}
      </h2>
      <p className="text-xl">{text}</p>
      {activityTitle && !accepted ? (
        <Button
          variant="secondary"
          pending={busy}
          aria-label={`Aceptar: ${activityTitle}`}
          onClick={onAccept}
        >
          Aceptar
        </Button>
      ) : null}
      <p aria-live="polite" className="text-base">
        {accepted && activityTitle ? "Listo, quedó en tu día." : null}
        {error ? <span className="font-bold text-danger">{error}</span> : null}
      </p>
    </section>
  );
}
