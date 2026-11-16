import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResourcesSection } from "@/components/admin/resources-section";
import { TemplatesSection } from "@/components/admin/templates-section";
import { TipsSection } from "@/components/admin/tips-section";
import {
  createResource,
  createTip,
  deleteResource,
  deleteTip,
  listResources,
  listTemplates,
  listTips,
  setResourceVerified,
  updateResource,
  updateTemplate,
  updateTip,
} from "@/server/admin/content";
import { adminPage } from "../access";

export const metadata: Metadata = { title: "Contenido" };

const PATH = "/admin/contenido";
const TABS = [
  { key: "consejos", label: "Consejos" },
  { key: "recursos", label: "Recursos" },
  { key: "plantillas", label: "Plantillas" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const ERRORS: Record<string, string> = {
  validation_failed:
    "Revisa los datos: algún campo no es válido (largo del texto, enlaces con https:// o ítems de la plantilla).",
  other: "No pudimos guardar el cambio. Prueba de nuevo.",
};

function done(tab: Tab, ok: boolean, code?: string): never {
  revalidatePath(PATH);
  redirect(
    ok
      ? `${PATH}?tab=${tab}&guardado=1`
      : `${PATH}?tab=${tab}&error=${code === "validation_failed" ? code : "other"}`,
  );
}

const text = (formData: FormData, name: string) => formData.get(name);

async function saveTip(formData: FormData): Promise<void> {
  "use server";
  const id = text(formData, "id");
  const supabase = await adminPage(
    PATH,
    id ? "editar consejo" : "crear consejo",
  );
  const input = {
    kind: text(formData, "kind"),
    text: text(formData, "text"),
    activityTitle: text(formData, "activityTitle") ?? undefined,
    careTypes: formData.getAll("careTypes"),
    active: formData.get("active") === "on",
  };
  const result = id
    ? await updateTip(supabase, id, input)
    : await createTip(supabase, input);
  done("consejos", result.ok, result.ok ? undefined : result.error.code);
}

async function removeTip(formData: FormData): Promise<void> {
  "use server";
  const supabase = await adminPage(PATH, "borrar consejo");
  const result = await deleteTip(supabase, text(formData, "id"));
  done("consejos", result.ok, result.ok ? undefined : result.error.code);
}

async function saveResource(formData: FormData): Promise<void> {
  "use server";
  const id = text(formData, "id");
  const supabase = await adminPage(
    PATH,
    id ? "editar recurso" : "crear recurso",
  );
  const input = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    phone: text(formData, "phone") ?? undefined,
    url: text(formData, "url") ?? "",
    sourceUrl: text(formData, "sourceUrl"),
    region: text(formData, "region") ?? "",
    active: formData.get("active") === "on",
  };
  const result = id
    ? await updateResource(supabase, id, input)
    : await createResource(supabase, input);
  done("recursos", result.ok, result.ok ? undefined : result.error.code);
}

async function verifyResource(formData: FormData): Promise<void> {
  "use server";
  const verified = formData.get("verified") === "true";
  const supabase = await adminPage(
    PATH,
    verified ? "verificar recurso" : "quitar verificación de recurso",
  );
  const result = await setResourceVerified(
    supabase,
    text(formData, "id"),
    verified,
    new Date(),
  );
  done("recursos", result.ok, result.ok ? undefined : result.error.code);
}

async function removeResource(formData: FormData): Promise<void> {
  "use server";
  const supabase = await adminPage(PATH, "borrar recurso");
  const result = await deleteResource(supabase, text(formData, "id"));
  done("recursos", result.ok, result.ok ? undefined : result.error.code);
}

async function saveTemplate(formData: FormData): Promise<void> {
  "use server";
  const supabase = await adminPage(PATH, "editar plantilla");
  const result = await updateTemplate(supabase, {
    careType: text(formData, "careType"),
    name: text(formData, "name"),
    description: text(formData, "description"),
    itemsJson: text(formData, "itemsJson"),
  });
  done("plantillas", result.ok, result.ok ? undefined : result.error.code);
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await adminPage(PATH);
  const params = await searchParams;
  const tab: Tab =
    TABS.find((item) => item.key === params.tab)?.key ?? "consejos";
  const error =
    typeof params.error === "string"
      ? (ERRORS[params.error] ?? ERRORS.other)
      : null;

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Contenido</h1>
      <p className="rounded-card border border-warning bg-warning-bg p-4 text-warning">
        Ningún texto de Sole puede incluir consejo médico: nada de dosis,
        tratamientos, diagnósticos ni qué comer o beber. Solo organización,
        compañía y recursos oficiales.
      </p>

      <nav aria-label="Tipos de contenido">
        <ul className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <li key={item.key}>
              <Link
                href={`${PATH}?tab=${item.key}`}
                aria-current={item.key === tab ? "page" : undefined}
                className={`inline-flex min-h-12 items-center rounded-control border-2 px-4 text-lg font-bold no-underline ${
                  item.key === tab
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border-strong bg-background text-fg hover:bg-surface"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

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

      {tab === "consejos" ? (
        <TipsSection
          tips={await listTips(supabase)}
          save={saveTip}
          remove={removeTip}
        />
      ) : null}
      {tab === "recursos" ? (
        <ResourcesSection
          resources={await listResources(supabase)}
          save={saveResource}
          verify={verifyResource}
          remove={removeResource}
        />
      ) : null}
      {tab === "plantillas" ? (
        <TemplatesSection
          templates={await listTemplates(supabase)}
          save={saveTemplate}
        />
      ) : null}
    </>
  );
}
