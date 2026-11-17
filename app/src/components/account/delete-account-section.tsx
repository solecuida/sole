import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export interface DeleteAccountSectionProps {
  remove: (formData: FormData) => Promise<void>;
  /** Mensaje si la palabra de confirmación no calzó. */
  error?: string;
}

/** Borrar la cuenta: tan a la vista y tan simple como crearla. */
export function DeleteAccountSection({
  remove,
  error,
}: DeleteAccountSectionProps) {
  return (
    <section
      id="borrar"
      aria-labelledby="borrar-titulo"
      className="flex flex-col gap-4 rounded-card border border-danger p-4"
    >
      <h2 id="borrar-titulo" className="text-xl font-bold">
        Borrar mi cuenta
      </h2>
      <p>Si borras tu cuenta, esto es lo que pasa:</p>
      <ul className="list-disc pl-6">
        <li>
          Tu cuenta se desactiva de inmediato y dejan de llegar los avisos.
        </li>
        <li>
          A los 7 días se borra todo de verdad: tus datos y los espacios de
          cuidado que creaste.
        </li>
        <li>
          Si alguien de tu familia usa estos círculos, también dejará de verlos.
        </li>
        <li>
          Durante esos 7 días puedes volver a entrar y recuperar tu cuenta.
        </li>
      </ul>
      <p className="text-fg-muted">
        Si quieres guardar algo, descárgalo antes en «Descargar mis datos».
      </p>
      <form action={remove} className="flex flex-col gap-4">
        <Field
          id="confirm"
          name="confirm"
          label="Para confirmar, escribe BORRAR"
          autoComplete="off"
          autoCapitalize="characters"
          error={error}
        />
        <SubmitButton variant="danger">Borrar mi cuenta</SubmitButton>
      </form>
    </section>
  );
}
