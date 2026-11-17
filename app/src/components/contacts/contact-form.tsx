import Link from "next/link";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { CONTACT_KIND_LABELS, NOTES_MAX } from "@/lib/contacts/labels";

export interface ContactFormValues {
  id?: string;
  name: string;
  kind: string;
  phone: string;
  notes: string;
  isEmergency: boolean;
}

export const EMPTY_CONTACT: ContactFormValues = {
  name: "",
  kind: "familia",
  phone: "",
  notes: "",
  isEmergency: false,
};

/**
 * Formulario de un contacto. Solo nombre, tipo, teléfono, una nota corta y la
 * marca de emergencia: nada de alergias, diagnósticos ni previsión.
 */
export function ContactForm({
  action,
  circleId,
  values,
  cancelHref,
}: {
  action: (formData: FormData) => Promise<void>;
  circleId: string;
  values: ContactFormValues;
  /** Presente al editar: vuelve a la lista sin guardar. */
  cancelHref?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="circleId" value={circleId} />
      {values.id ? (
        <input type="hidden" name="contactId" value={values.id} />
      ) : null}

      <Field
        id="name"
        name="name"
        label="Nombre"
        hint="Por ejemplo: «Dra. Pérez»."
        required
        maxLength={80}
        defaultValue={values.name}
      />

      <Field
        as="select"
        id="kind"
        name="kind"
        label="¿Quién es?"
        defaultValue={values.kind}
      >
        {Object.entries(CONTACT_KIND_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Field>

      <Field
        id="phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        label="Teléfono"
        hint="Con el código si quieres, por ejemplo: +56 2 2345 6789."
        required
        maxLength={20}
        defaultValue={values.phone}
      />

      <Field
        as="textarea"
        id="notes"
        name="notes"
        label="Nota (opcional)"
        hint="Por ejemplo: el horario en que atiende. Solo lo ves dentro de Sole."
        rows={3}
        maxLength={NOTES_MAX}
        defaultValue={values.notes}
      />

      <label
        htmlFor="isEmergency"
        className="flex min-h-12 cursor-pointer items-start gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-3 text-lg has-[:checked]:border-primary"
      >
        <input
          id="isEmergency"
          name="isEmergency"
          type="checkbox"
          defaultChecked={values.isEmergency}
          className="mt-1 size-6 shrink-0 accent-primary"
        />
        <span>
          Contacto de emergencia
          <span className="block text-base text-fg-muted">
            Es el número que Sole ofrece si hay que pedir ayuda. Si marcas más
            de uno, se usa el que cambiaste más recientemente.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3">
        <SubmitButton>Guardar</SubmitButton>
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-transparent px-5 py-2 text-lg font-bold text-primary underline hover:bg-surface"
          >
            Volver sin guardar
          </Link>
        ) : null}
      </div>
    </form>
  );
}
