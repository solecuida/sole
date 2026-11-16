"use client";

import { usePathname } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import type { Result } from "@/lib/result";

export interface FeedbackButtonProps {
  /** Server Action que guarda el comentario. */
  submit: (formData: FormData) => Promise<Result<undefined, string>>;
}

const KINDS = [
  { value: "comentario", label: "Un comentario" },
  { value: "problema", label: "Un problema" },
];

/**
 * «Contarle algo a Sole». Va al final de la zona central, dentro del flujo: no
 * flota sobre el contenido, así que nunca tapa un botón ni el elemento enfocado.
 */
export function FeedbackButton({ submit }: FeedbackButtonProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string[]>([]);
  const [kindError, setKindError] = useState<string | undefined>();
  const [messageError, setMessageError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function close() {
    setOpen(false);
    setKindError(undefined);
    setMessageError(undefined);
    setFormError(undefined);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const message = String(data.get("message") ?? "").trim();
    const missingKind = kind.length === 0;
    const missingMessage = message.length === 0;
    setKindError(
      missingKind ? "Elige si es un comentario o un problema." : undefined,
    );
    setMessageError(missingMessage ? "Escribe tu mensaje." : undefined);
    setFormError(undefined);
    if (missingKind || missingMessage) {
      return;
    }
    data.set("screen", pathname.slice(0, 80));
    setBusy(true);
    setSent(false);
    let result: Result<undefined, string>;
    try {
      result = await submit(data);
    } catch {
      result = {
        ok: false,
        error: {
          code: "internal",
          message: "No pudimos enviar tu mensaje. Prueba de nuevo.",
        },
      };
    }
    setBusy(false);
    if (result.ok) {
      form.reset();
      setKind([]);
      setSent(true);
      close();
    } else {
      setFormError(result.error.message);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Contarle algo a Sole
      </Button>
      <p aria-live="polite" className="text-base text-success">
        {sent ? "Gracias. Recibimos tu mensaje." : null}
      </p>
      <Dialog open={open} onClose={close} title="Contarle algo a Sole">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <ChoiceGroup
            name="kind"
            legend="¿Es un comentario o un problema?"
            options={KINDS}
            value={kind}
            onChange={setKind}
            error={kindError}
          />
          <Field
            as="textarea"
            id="feedback-message"
            name="message"
            label="Cuéntanos"
            hint="Lo lee una persona. No escribas datos de salud."
            maxLength={2000}
            error={messageError}
          />
          {formError ? (
            <p role="alert" className="text-base font-bold text-danger">
              {formError}
            </p>
          ) : null}
          <Button type="submit" pending={busy}>
            Enviar
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
