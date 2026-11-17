import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export interface TipView {
  id: string;
  kind: string;
  text: string;
  activityTitle: string | null;
  careTypes: string[];
  active: boolean;
}

export interface TipsSectionProps {
  tips: TipView[];
  save: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}

const CARE_TYPES: { value: string; label: string }[] = [
  { value: "adulto_mayor", label: "Adulto mayor" },
  { value: "demencias", label: "Alzheimer y otras demencias" },
  { value: "dialisis", label: "Diálisis" },
  { value: "discapacidad_fisica", label: "Discapacidad física" },
  { value: "discapacidad_intelectual", label: "Discapacidad intelectual" },
  { value: "cronica_general", label: "Enfermedad crónica" },
  { value: "recuperacion_cirugia", label: "Recuperación de una cirugía" },
  {
    value: "ninez_necesidades_especiales",
    label: "Niñez con necesidades especiales",
  },
  { value: "desde_cero", label: "Desde cero" },
];

const CHECK_LABEL =
  "flex min-h-12 items-center gap-3 text-lg [&>input]:size-6 [&>input]:accent-primary";

function TipForm({
  idPrefix,
  tip,
  save,
  submitLabel,
}: {
  idPrefix: string;
  tip: TipView | null;
  save: TipsSectionProps["save"];
  submitLabel: string;
}) {
  return (
    <form action={save} className="flex flex-col gap-4">
      {tip ? <input type="hidden" name="id" value={tip.id} /> : null}
      <Field
        id={`${idPrefix}-kind`}
        name="kind"
        as="select"
        label="Tipo"
        defaultValue={tip?.kind ?? "consejo"}
      >
        <option value="consejo">Consejo</option>
        <option value="actividad">Actividad</option>
      </Field>
      <Field
        id={`${idPrefix}-text`}
        name="text"
        as="textarea"
        label="Texto (de 5 a 200 letras)"
        maxLength={200}
        required
        defaultValue={tip?.text ?? ""}
      />
      <Field
        id={`${idPrefix}-title`}
        name="activityTitle"
        label="Título de la actividad (solo si es una actividad)"
        maxLength={80}
        defaultValue={tip?.activityTitle ?? ""}
      />
      <fieldset className="flex flex-col gap-1">
        <legend className="text-lg font-bold">
          Tipos de cuidado (sin marcar: sirve para todos)
        </legend>
        {CARE_TYPES.map((type) => (
          <label key={type.value} className={CHECK_LABEL}>
            <input
              type="checkbox"
              name="careTypes"
              value={type.value}
              defaultChecked={tip?.careTypes.includes(type.value) ?? false}
            />
            {type.label}
          </label>
        ))}
      </fieldset>
      <label className={CHECK_LABEL}>
        <input
          type="checkbox"
          name="active"
          defaultChecked={tip?.active ?? true}
        />
        Activo (se muestra a las personas)
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

/** Pestaña de consejos y actividades: lista editable y alta. Recibe datos y acciones por props. */
export function TipsSection({ tips, save, remove }: TipsSectionProps) {
  return (
    <section aria-labelledby="consejos-titulo" className="flex flex-col gap-4">
      <h2 id="consejos-titulo" className="text-2xl font-bold">
        Consejos y actividades
      </h2>

      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="min-h-12 cursor-pointer py-2 text-lg font-bold">
          Crear un consejo o una actividad
        </summary>
        <div className="pt-4">
          <TipForm
            idPrefix="tip-new"
            tip={null}
            save={save}
            submitLabel="Crear consejo"
          />
        </div>
      </details>

      {tips.length === 0 ? (
        <p>Todavía no hay consejos. Crea el primero arriba.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {tips.map((tip) => (
            <li
              key={tip.id}
              data-tip={tip.id}
              className="flex flex-col gap-2 rounded-card border border-border p-4"
            >
              <p className="text-fg-muted">
                <strong>
                  {tip.kind === "actividad" ? "Actividad" : "Consejo"}
                </strong>{" "}
                · <strong>{tip.active ? "Activo" : "Desactivado"}</strong>
              </p>
              <p>{tip.text}</p>
              <details>
                <summary className="min-h-12 cursor-pointer py-2 font-bold text-primary underline">
                  Editar
                </summary>
                <div className="flex flex-col gap-4 pt-4">
                  <TipForm
                    idPrefix={`tip-${tip.id}`}
                    tip={tip}
                    save={save}
                    submitLabel="Guardar cambios"
                  />
                  <form action={remove}>
                    <input type="hidden" name="id" value={tip.id} />
                    <SubmitButton variant="danger">
                      Borrar este consejo
                    </SubmitButton>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
