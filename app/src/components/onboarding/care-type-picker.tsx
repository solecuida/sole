"use client";

import { useState } from "react";
import { ChoiceGroup } from "@/components/ui/choice-group";

export interface CareTypeOption {
  value: string;
  label: string;
  description: string;
  /** Títulos de lo que carga la plantilla. */
  items: string[];
}

/** Elige el tipo de cuidado y muestra lo que su plantilla va a cargar. */
export function CareTypePicker({
  options,
  error,
}: {
  options: CareTypeOption[];
  error?: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const current = options.find((option) => option.value === selected[0]);

  return (
    <div className="flex flex-col gap-4">
      <ChoiceGroup
        name="careType"
        legend="¿Qué tipo de cuidado es?"
        hint="Sole te propone algunos recordatorios para partir. Elige el que más se parezca."
        options={options.map(({ value, label, description }) => ({
          value,
          label,
          description,
        }))}
        value={selected}
        onChange={setSelected}
        error={error}
      />
      <div aria-live="polite">
        {current ? (
          <section className="rounded-card border border-border bg-surface p-4">
            <h2 className="text-lg font-bold">Lo que vamos a dejar listo</h2>
            {current.items.length > 0 ? (
              <>
                <ul className="mt-2 list-disc pl-6">
                  {current.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-2 text-base text-fg-muted">
                  Todo se puede editar o quitar después.
                </p>
              </>
            ) : (
              <p className="mt-2">
                Nada por ahora. Tú agregas lo que necesites.
              </p>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
