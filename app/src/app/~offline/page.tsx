"use client";

import { useEffect, useState } from "react";
import { OccurrenceItem } from "@/components/today/occurrence-item";
import { readSnapshot, type TodaySnapshot } from "@/lib/offline/outbox";
import { formatLongDate, IMPORTANCE_LABELS } from "@/lib/reminders/labels";

const ORDER = ["important", "normal", "whenever"] as const;

function clock(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Lo que se ve cuando no hay señal: el último "Hoy" guardado en este teléfono.
// El service worker sirve esta página en lugar del error del navegador.
export default function OfflinePage() {
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; snapshot: TodaySnapshot | null }
  >({ status: "loading" });

  useEffect(() => {
    readSnapshot()
      .then((snapshot) => setState({ status: "ready", snapshot }))
      .catch(() => setState({ status: "ready", snapshot: null }));
  }, []);

  const snapshot = state.status === "ready" ? state.snapshot : null;

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh max-w-content flex-col gap-6 px-4 py-8"
    >
      <p className="text-xl font-bold text-primary">Sole</p>
      <h1 className="text-3xl font-bold leading-tight">Sin conexión</h1>

      {state.status === "loading" ? <p>Buscando lo guardado…</p> : null}

      {state.status === "ready" && !snapshot ? (
        <p className="rounded-card border border-border bg-surface p-4">
          Todavía no hay nada guardado en este teléfono. Abre Sole con conexión
          una vez.
        </p>
      ) : null}

      {snapshot ? (
        <>
          <p className="rounded-card border border-warning bg-warning-bg p-4 text-warning">
            Estás viendo el día de <strong>{snapshot.caredName}</strong> tal
            como quedó guardado. Guardado a las {clock(snapshot.savedAt)} ·{" "}
            {formatLongDate(snapshot.localDate)}.
          </p>
          <p className="text-fg-muted">
            Puedes marcar igual: se guarda en tu teléfono y se envía cuando
            vuelva la señal.
          </p>
          {ORDER.map((importance) => {
            const items = snapshot.groups[importance];
            if (items.length === 0) {
              return null;
            }
            return (
              <section
                key={importance}
                aria-labelledby={`grupo-${importance}`}
                className="flex flex-col gap-3"
              >
                <h2 id={`grupo-${importance}`} className="text-xl font-bold">
                  {IMPORTANCE_LABELS[importance]}
                </h2>
                <ul className="flex flex-col gap-3">
                  {items.map((item) => (
                    <OccurrenceItem
                      key={item.id}
                      item={{ ...item, detail: null }}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
          {ORDER.every((key) => snapshot.groups[key].length === 0) ? (
            <p>Ese día no tenía nada pendiente.</p>
          ) : null}
        </>
      ) : null}

      <a
        href="/hoy"
        className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline"
      >
        Volver a intentar
      </a>
    </main>
  );
}
