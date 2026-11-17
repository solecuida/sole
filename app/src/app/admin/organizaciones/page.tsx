import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { appUrl } from "@/lib/env";
import {
  createOrganization,
  listOrganizations,
  ORG_KINDS,
  toggleOrganization,
} from "@/server/admin/content";
import { adminPage } from "../access";

export const metadata: Metadata = { title: "Organizaciones" };

const PATH = "/admin/organizaciones";

const ERRORS: Record<string, string> = {
  conflict: "Ya existe una organización con ese código. Elige otro.",
  validation_failed:
    "Revisa los datos: el nombre necesita al menos 2 letras y el código de 3 a 32 letras, números o guiones.",
  other: "No pudimos guardar el cambio. Prueba de nuevo.",
};

function kindLabel(kind: string): string {
  return ORG_KINDS.find((item) => item.value === kind)?.label ?? kind;
}

async function create(formData: FormData): Promise<void> {
  "use server";
  const supabase = await adminPage(PATH, "crear organización");
  const result = await createOrganization(supabase, {
    name: formData.get("name"),
    kind: formData.get("kind"),
    code: formData.get("code"),
  });
  revalidatePath(PATH);
  if (result.ok) {
    redirect(`${PATH}?guardado=1`);
  }
  redirect(`${PATH}?error=${result.error.code}`);
}

async function toggle(formData: FormData): Promise<void> {
  "use server";
  const supabase = await adminPage(PATH, "cambiar estado de organización");
  const result = await toggleOrganization(
    supabase,
    formData.get("id"),
    formData.get("active") === "true",
  );
  revalidatePath(PATH);
  redirect(result.ok ? `${PATH}?guardado=1` : `${PATH}?error=other`);
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await adminPage(PATH);
  const params = await searchParams;
  const organizations = await listOrganizations(supabase);
  const base = appUrl().replace(/\/$/, "");
  const error =
    typeof params.error === "string"
      ? (ERRORS[params.error] ?? ERRORS.other)
      : null;

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Organizaciones</h1>

      <div aria-live="polite">
        {params.guardado === "1" ? (
          <p className="rounded-card border border-success bg-success-bg p-4 text-success">
            Guardado.
          </p>
        ) : null}
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}

      <section
        aria-labelledby="alta-titulo"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4"
      >
        <h2 id="alta-titulo" className="text-xl font-bold">
          Crear una organización
        </h2>
        <form action={create} className="flex flex-col gap-4">
          <Field id="org-name" name="name" label="Nombre" required />
          <Field id="org-kind" name="kind" as="select" label="Tipo">
            {ORG_KINDS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Field>
          <Field
            id="org-code"
            name="code"
            label="Código"
            hint="De 3 a 32 letras, números o guiones. Se guarda en mayúsculas."
            autoCapitalize="characters"
            required
          />
          <SubmitButton>Crear organización</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="lista-titulo" className="flex flex-col gap-4">
        <h2 id="lista-titulo" className="text-xl font-bold">
          Organizaciones creadas
        </h2>
        {organizations.length === 0 ? (
          <p>Todavía no hay organizaciones. Crea la primera arriba.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {organizations.map((org) => (
              <li
                key={org.id}
                data-org={org.code}
                className="flex flex-col gap-2 rounded-card border border-border p-4"
              >
                <h3 className="text-lg font-bold">{org.name}</h3>
                <p className="text-fg-muted">
                  {kindLabel(org.kind)} · Código{" "}
                  <code className="font-mono font-bold">{org.code}</code> ·{" "}
                  <strong>{org.active ? "Activa" : "Desactivada"}</strong>
                </p>
                <p>
                  Enlace para compartir:{" "}
                  <code className="break-all font-mono text-base font-bold">
                    {`${base}/?org=${org.code}`}
                  </code>
                </p>
                <form action={toggle}>
                  <input type="hidden" name="id" value={org.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={org.active ? "false" : "true"}
                  />
                  <SubmitButton
                    variant="secondary"
                    aria-label={`${org.active ? "Desactivar" : "Activar"} ${org.name}`}
                  >
                    {org.active ? "Desactivar" : "Activar"}
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
