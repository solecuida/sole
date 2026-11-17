import { SubmitButton } from "@/components/ui/submit-button";

export interface CloseCircleSectionProps {
  /** Círculos abiertos que la persona administra. */
  circles: { id: string; caredName: string }[];
  close: (formData: FormData) => Promise<void>;
}

const REASONS = [
  { value: "ya_no_cuido", label: "Ya no cuido a esta persona" },
  { value: "fallecimiento", label: "Falleció" },
  { value: "otro", label: "Otro motivo" },
];

/** Cerrar el cuidado de una persona: silencia los avisos y conserva lo escrito. */
export function CloseCircleSection({
  circles,
  close,
}: CloseCircleSectionProps) {
  return (
    <section
      id="cerrar"
      aria-labelledby="cerrar-titulo"
      className="flex flex-col gap-4"
    >
      <h2 id="cerrar-titulo" className="text-xl font-bold">
        Cerrar el cuidado de una persona
      </h2>
      <p>
        Si ya no cuidas a alguien, puedes cerrar su espacio. Desde ese momento
        no llega ningún aviso más. Lo que escribiste se conserva y lo puedes
        seguir leyendo y descargando.
      </p>
      <p className="text-fg-muted">
        Antes, si quieres, descarga la bitácora y lo demás en «Descargar mis
        datos», más arriba.
      </p>
      {circles.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-4">
          No tienes espacios abiertos para cerrar.
        </p>
      ) : null}
      {circles.map((circle) => (
        <form
          key={circle.id}
          action={close}
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
        >
          <input type="hidden" name="circleId" value={circle.id} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-lg font-bold">
              Cerrar el espacio de {circle.caredName}
            </legend>
            {REASONS.map((reason) => (
              <label
                key={reason.value}
                htmlFor={`motivo-${circle.id}-${reason.value}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-2 text-lg has-[:checked]:border-primary"
              >
                <input
                  id={`motivo-${circle.id}-${reason.value}`}
                  type="radio"
                  name="reason"
                  value={reason.value}
                  className="size-6 shrink-0 accent-primary"
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </fieldset>
          <SubmitButton variant="secondary">
            Cerrar el espacio de {circle.caredName}
          </SubmitButton>
        </form>
      ))}
    </section>
  );
}
