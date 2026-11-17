"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface TaskItemData {
  id: string;
  title: string;
  /** Ya tiene fecha (hoy o un día anterior). */
  scheduled: boolean;
  done: boolean;
}

export type TaskAction = (
  taskId: string,
) => Promise<{ ok: boolean; message?: string }>;

interface TaskItemProps {
  task: TaskItemData;
  /** Dónde lleva "Pedir ayuda con esto"; lo calcula el servidor. */
  helpHref: string;
  /** Solo quien cuida puede cambiar las tareas. */
  canEdit: boolean;
  onMoveToToday: TaskAction;
  onComplete: TaskAction;
  onRemove: TaskAction;
}

/** Una tarea de la lista: pasarla a hoy, marcarla hecha o pedir ayuda. */
export function TaskItem({
  task,
  helpHref,
  canEdit,
  onMoveToToday,
  onComplete,
  onRemove,
}: TaskItemProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(name: string, action: TaskAction) {
    setBusy(name);
    setNotice(null);
    const outcome = await action(task.id);
    setBusy(null);
    if (outcome.ok) {
      router.refresh();
      return;
    }
    setNotice(outcome.message ?? "No pudimos guardar. Prueba de nuevo.");
  }

  return (
    <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h3
        className={`text-xl font-bold ${task.done ? "text-fg-muted line-through" : ""}`}
      >
        {task.title}
      </h3>
      {task.done ? (
        <p className="text-lg font-bold text-success">Hecha ✓</p>
      ) : canEdit ? (
        <div className="flex flex-wrap gap-2">
          {task.scheduled ? null : (
            <Button
              variant="secondary"
              pending={busy === "move"}
              aria-label={`Pasar a hoy: ${task.title}`}
              onClick={() => run("move", onMoveToToday)}
            >
              Pasar a hoy
            </Button>
          )}
          <Button
            pending={busy === "done"}
            aria-label={`Hecha: ${task.title}`}
            onClick={() => run("done", onComplete)}
          >
            Hecha
          </Button>
          <Link
            href={helpHref}
            aria-label={`Pedir ayuda con esto: ${task.title}`}
            className="inline-flex min-h-12 items-center px-3 text-lg font-bold text-primary underline"
          >
            Pedir ayuda con esto
          </Link>
          <Button
            variant="ghost"
            pending={busy === "remove"}
            aria-label={`Quitar: ${task.title}`}
            onClick={() => run("remove", onRemove)}
          >
            Quitar
          </Button>
        </div>
      ) : null}
      <div aria-live="polite">
        {notice ? (
          <p className="text-base font-bold text-danger">{notice}</p>
        ) : null}
      </div>
    </li>
  );
}
