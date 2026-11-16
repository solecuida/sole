import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export interface ResourceView {
  id: string;
  name: string;
  description: string;
  phone: string | null;
  url: string | null;
  sourceUrl: string;
  verifiedAt: string | null;
  region: string;
  active: boolean;
}

export interface ResourcesSectionProps {
  resources: ResourceView[];
  save: (formData: FormData) => Promise<void>;
  verify: (formData: FormData) => Promise<void>;
  remove: (formData: FormData) => Promise<void>;
}

const CHECK_LABEL =
  "flex min-h-12 items-center gap-3 text-lg [&>input]:size-6 [&>input]:accent-primary";

function ResourceForm({
  idPrefix,
  resource,
  save,
  submitLabel,
}: {
  idPrefix: string;
  resource: ResourceView | null;
  save: ResourcesSectionProps["save"];
  submitLabel: string;
}) {
  return (
    <form action={save} className="flex flex-col gap-4">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}
      <Field
        id={`${idPrefix}-name`}
        name="name"
        label="Nombre"
        required
        maxLength={120}
        defaultValue={resource?.name ?? ""}
      />
      <Field
        id={`${idPrefix}-description`}
        name="description"
        as="textarea"
        label="Descripción"
        required
        maxLength={400}
        defaultValue={resource?.description ?? ""}
      />
      <Field
        id={`${idPrefix}-phone`}
        name="phone"
        label="Teléfono (opcional)"
        maxLength={30}
        defaultValue={resource?.phone ?? ""}
      />
      <Field
        id={`${idPrefix}-url`}
        name="url"
        type="url"
        label="Sitio web (opcional, con https://)"
        defaultValue={resource?.url ?? ""}
      />
      <Field
        id={`${idPrefix}-source`}
        name="sourceUrl"
        type="url"
        label="Fuente oficial para verificar (con https://)"
        required
        defaultValue={resource?.sourceUrl ?? ""}
      />
      <Field
        id={`${idPrefix}-region`}
        name="region"
        label="Región"
        maxLength={60}
        defaultValue={resource?.region ?? "nacional"}
      />
      <label className={CHECK_LABEL}>
        <input
          type="checkbox"
          name="active"
          defaultChecked={resource?.active ?? true}
        />
        Activo
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

/** Pestaña del directorio de recursos. Un recurso solo se muestra a las personas con fecha de verificación. */
export function ResourcesSection({
  resources,
  save,
  verify,
  remove,
}: ResourcesSectionProps) {
  const pending = resources.filter((item) => !item.verifiedAt).length;
  return (
    <section aria-labelledby="recursos-titulo" className="flex flex-col gap-4">
      <h2 id="recursos-titulo" className="text-2xl font-bold">
        Directorio de recursos
      </h2>
      <p>
        Un recurso solo se muestra a las personas cuando tiene fecha de
        verificación. Abre la fuente oficial, confirma el dato y recién ahí
        márcalo como verificado.{" "}
        <strong>Sin verificar ahora: {pending}.</strong>
      </p>

      <details className="rounded-card border border-border bg-surface p-4">
        <summary className="min-h-12 cursor-pointer py-2 text-lg font-bold">
          Agregar un recurso
        </summary>
        <div className="pt-4">
          <ResourceForm
            idPrefix="res-new"
            resource={null}
            save={save}
            submitLabel="Agregar recurso"
          />
        </div>
      </details>

      {resources.length === 0 ? (
        <p>Todavía no hay recursos. Agrega el primero arriba.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {resources.map((item) => (
            <li
              key={item.id}
              data-resource={item.id}
              className="flex flex-col gap-2 rounded-card border border-border p-4"
            >
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p>{item.description}</p>
              <p className="text-fg-muted">
                {item.active ? "Activo" : "Desactivado"} · {item.region}
                {item.phone ? ` · ${item.phone}` : ""}
              </p>
              <p>
                {item.verifiedAt ? (
                  <strong className="text-success">
                    Verificado el {item.verifiedAt}
                  </strong>
                ) : (
                  <strong className="text-danger">
                    Sin verificar (no se muestra a las personas)
                  </strong>
                )}
              </p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center break-all font-bold text-primary underline"
                aria-label={`Revisar la fuente oficial de ${item.name} (se abre en otra pestaña)`}
              >
                Revisar la fuente oficial
              </a>
              <form action={verify}>
                <input type="hidden" name="id" value={item.id} />
                <input
                  type="hidden"
                  name="verified"
                  value={item.verifiedAt ? "false" : "true"}
                />
                <SubmitButton
                  variant="secondary"
                  aria-label={`${item.verifiedAt ? "Quitar verificación:" : "Marcar como verificado hoy:"} ${item.name}`}
                >
                  {item.verifiedAt
                    ? "Quitar verificación"
                    : "Marcar como verificado hoy"}
                </SubmitButton>
              </form>
              <details>
                <summary className="min-h-12 cursor-pointer py-2 font-bold text-primary underline">
                  Editar
                </summary>
                <div className="flex flex-col gap-4 pt-4">
                  <ResourceForm
                    idPrefix={`res-${item.id}`}
                    resource={item}
                    save={save}
                    submitLabel="Guardar cambios"
                  />
                  <form action={remove}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton variant="danger">
                      Borrar este recurso
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
