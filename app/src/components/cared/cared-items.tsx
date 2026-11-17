"use client";

import { useState } from "react";

export interface CaredListItem {
  id: string;
  title: string;
  time: string;
  done: boolean;
}

/** Lista de hoy con un "Listo" por ítem. Marca sin recargar la página. */
export function CaredItems({
  token,
  items,
}: {
  token: string;
  items: CaredListItem[];
}) {
  const [doneIds, setDoneIds] = useState<ReadonlySet<string>>(
    () => new Set(items.filter((item) => item.done).map((item) => item.id)),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  async function markDone(id: string) {
    setBusyId(id);
    setFailedId(null);
    try {
      const response = await fetch(
        `/api/v/${encodeURIComponent(token)}/listo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ occurrenceId: id }),
        },
      );
      if (!response.ok) {
        setFailedId(id);
        return;
      }
      setDoneIds((current) => new Set(current).add(id));
    } catch {
      setFailedId(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => {
        const done = doneIds.has(item.id);
        return (
          <li
            key={item.id}
            className="flex flex-col gap-4 rounded-card border-2 border-border bg-surface p-6"
          >
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-bold leading-snug">{item.title}</p>
              <p className="text-2xl text-fg-muted">{item.time}</p>
            </div>
            {done ? (
              <p className="text-3xl font-bold">Listo ✓</p>
            ) : (
              <button
                type="button"
                onClick={() => markDone(item.id)}
                disabled={busyId === item.id}
                aria-busy={busyId === item.id ? "true" : undefined}
                aria-label={`Listo: ${item.title}`}
                className="inline-flex min-h-16 w-full items-center justify-center rounded-control border-2 border-primary bg-primary px-6 py-4 text-2xl font-bold text-primary-fg hover:border-primary-hover hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                Listo
              </button>
            )}
            {failedId === item.id ? (
              <p role="alert" className="text-2xl font-bold text-danger">
                No se pudo guardar. Prueba de nuevo.
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
