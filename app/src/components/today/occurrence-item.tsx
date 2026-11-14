"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type MarkRequest,
  type MarkStatus,
  type NotDoneReason,
  REASON_LABELS,
  SNOOZE_OPTIONS,
  sendMark,
} from "@/lib/today/mark";

export interface OccurrenceItemData {
  id: string;
  title: string;
  time: string;
  status: "pending" | "done" | "not_done" | "snoozed" | "skipped";
  overdue: boolean;
  notDoneReason: string | null;
  snoozedUntil: string | null;
  detail: string | null;
}

type Panel = "actions" | "reasons" | "snooze";

function statusText(
  status: OccurrenceItemData["status"],
  item: OccurrenceItemData,
  reason: string | null,
): string | null {
  switch (status) {
    case "done":
      return "Hecho ✓";
    case "not_done": {
      const label = REASON_LABELS[reason as NotDoneReason];
      return label ? `No se hizo · ${label}` : "No se hizo";
    }
    case "snoozed":
      return item.snoozedUntil
        ? `Pospuesto hasta las ${item.snoozedUntil}`
        : "Pospuesto";
    case "skipped":
      return "No aplica";
    default:
      return null;
  }
}

/** Un ítem de "Hoy": se resuelve con un toque y se puede corregir. */
export function OccurrenceItem({ item }: { item: OccurrenceItemData }) {
  const router = useRouter();
  const [status, setStatus] = useState(item.status);
  const [reason, setReason] = useState(item.notDoneReason);
  const [panel, setPanel] = useState<Panel>("actions");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const resolved = status !== "pending" && !editing;
  const overdue = item.overdue && status === "pending";

  async function mark(
    next: MarkStatus,
    extra: { reason?: NotDoneReason; snoozeMinutes?: number } = {},
  ) {
    const previous = { status, reason };
    const request: MarkRequest = {
      occurrenceId: item.id,
      status: next,
      ...extra,
      // Clave nueva por cada marca: un reintento no la duplica.
      idempotencyKey: crypto.randomUUID(),
      via: "app",
    };
    // Optimista: el cambio se ve de inmediato y se revierte si falla.
    setStatus(next);
    setReason(extra.reason ?? null);
    setPanel("actions");
    setEditing(false);
    setNotice(null);
    setBusy(true);
    const outcome = await sendMark(request);
    setBusy(false);
    if (outcome.kind === "saved") {
      router.refresh();
      return;
    }
    setStatus(previous.status);
    setReason(previous.reason);
    setNotice(
      outcome.kind === "offline"
        ? "No hay conexión. Prueba de nuevo cuando vuelva la señal."
        : outcome.message,
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <p className="text-base text-fg-muted">
          <span className="font-bold text-fg">{item.time}</span>
          {overdue ? (
            <span className="ml-2 rounded-full border border-warning bg-warning-bg px-2 py-0.5 text-sm font-bold text-warning">
              Atrasado
            </span>
          ) : null}
        </p>
        <h3 className="text-xl font-bold">{item.title}</h3>
        {item.detail ? (
          <p className="text-base text-fg-muted">{item.detail}</p>
        ) : null}
      </div>

      {resolved ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p
            className={`text-lg font-bold ${status === "done" ? "text-success" : "text-fg-muted"}`}
          >
            {statusText(status, item, reason)}
          </p>
          {status !== "skipped" ? (
            <Button
              variant="ghost"
              aria-label={`Cambiar ${item.title}`}
              onClick={() => setEditing(true)}
            >
              Cambiar
            </Button>
          ) : null}
        </div>
      ) : null}

      {!resolved && panel === "actions" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            pending={busy}
            aria-label={`Hecho: ${item.title}`}
            onClick={() => mark("done")}
          >
            Hecho
          </Button>
          <Button
            variant="secondary"
            aria-label={`No se hizo: ${item.title}`}
            onClick={() => setPanel("reasons")}
          >
            No se hizo
          </Button>
          <Button
            variant="secondary"
            aria-label={`Posponer: ${item.title}`}
            onClick={() => setPanel("snooze")}
          >
            Posponer
          </Button>
        </div>
      ) : null}

      {!resolved && panel === "reasons" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-bold">¿Qué pasó?</legend>
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <Button
              key={value}
              variant="secondary"
              onClick={() =>
                mark("not_done", { reason: value as NotDoneReason })
              }
            >
              {label}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => setPanel("actions")}>
            Volver
          </Button>
        </fieldset>
      ) : null}

      {!resolved && panel === "snooze" ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-bold">
            ¿Cuánto lo posponemos?
          </legend>
          {SNOOZE_OPTIONS.map(({ minutes, label }) => (
            <Button
              key={minutes}
              variant="secondary"
              onClick={() => mark("snoozed", { snoozeMinutes: minutes })}
            >
              {label}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => setPanel("actions")}>
            Volver
          </Button>
        </fieldset>
      ) : null}

      <p aria-live="polite" className="text-base font-bold text-danger">
        {notice}
      </p>
    </li>
  );
}
