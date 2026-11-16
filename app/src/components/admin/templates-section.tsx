import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export interface TemplateView {
  careType: string;
  name: string;
  description: string;
  items: unknown;
}

export interface TemplatesSectionProps {
  templates: TemplateView[];
  save: (formData: FormData) => Promise<void>;
}

/** Pestaña de plantillas por tipo de cuidado: se edita nombre, descripción y los ítems (lista en JSON). */
export function TemplatesSection({ templates, save }: TemplatesSectionProps) {
  return (
    <section
      aria-labelledby="plantillas-titulo"
      className="flex flex-col gap-4"
    >
      <h2 id="plantillas-titulo" className="text-2xl font-bold">
        Plantillas por tipo de cuidado
      </h2>
      <p>
        Cada ítem se convierte en un recordatorio que la persona puede editar.
        Los ítems se escriben como una lista; cada uno lleva{" "}
        <code className="font-mono text-base">title</code>,{" "}
        <code className="font-mono text-base">kind</code>,{" "}
        <code className="font-mono text-base">importance</code>,{" "}
        <code className="font-mono text-base">rule</code>,{" "}
        <code className="font-mono text-base">advanceDays</code> y{" "}
        <code className="font-mono text-base">visibleToCared</code>. Si algo no
        calza, no se guarda.
      </p>
      <ul className="flex flex-col gap-4">
        {templates.map((template) => (
          <li
            key={template.careType}
            className="flex flex-col gap-2 rounded-card border border-border p-4"
          >
            <h3 className="text-lg font-bold">{template.name}</h3>
            <p className="text-fg-muted">
              {Array.isArray(template.items) ? template.items.length : 0} ítems
            </p>
            <details>
              <summary className="min-h-12 cursor-pointer py-2 font-bold text-primary underline">
                Editar
              </summary>
              <form action={save} className="flex flex-col gap-4 pt-4">
                <input
                  type="hidden"
                  name="careType"
                  value={template.careType}
                />
                <Field
                  id={`tpl-${template.careType}-name`}
                  name="name"
                  label="Nombre"
                  required
                  maxLength={80}
                  defaultValue={template.name}
                />
                <Field
                  id={`tpl-${template.careType}-description`}
                  name="description"
                  as="textarea"
                  label="Descripción"
                  required
                  maxLength={300}
                  defaultValue={template.description}
                />
                <Field
                  id={`tpl-${template.careType}-items`}
                  name="itemsJson"
                  as="textarea"
                  label="Ítems"
                  rows={12}
                  spellCheck={false}
                  className="font-mono text-base"
                  defaultValue={JSON.stringify(template.items, null, 2)}
                />
                <SubmitButton>Guardar plantilla</SubmitButton>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
