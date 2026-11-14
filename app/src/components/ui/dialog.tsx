"use client";

import { type ReactNode, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Diálogo modal sobre <dialog> nativo. Al cerrarse, el foco vuelve a quien lo abrió. */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      triggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
      triggerRef.current?.focus();
      triggerRef.current = null;
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: el estado lo maneja quien abre el diálogo.
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(100%-2rem,var(--content-width))] rounded-card border border-border bg-surface p-6 text-fg shadow-dialog backdrop:bg-fg/50"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="text-2xl font-bold">
          {title}
        </h2>
        {children}
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </dialog>
  );
}
