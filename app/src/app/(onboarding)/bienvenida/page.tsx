import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CareTypePicker } from "@/components/onboarding/care-type-picker";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionProfile, getSessionUserId } from "@/server/auth/session";
import {
  createCircleWithTemplate,
  listCareTemplates,
} from "@/server/circles/circles";
import {
  getConsentState,
  hasRequiredConsents,
} from "@/server/consents/consents";
import { track } from "@/server/events/track";

export const metadata: Metadata = { title: "A quién cuidas" };

const RELATIONS = ["mi mamá", "mi papá", "mi hijo", "mi hija", "mi pareja"];
const OTHER = "otra";

const ERRORS: Record<string, string> = {
  datos:
    "Nos falta algo: revisa tu nombre, el nombre de la persona, la relación y el tipo de cuidado.",
  guardar: "No pudimos guardar. Prueba de nuevo en un momento.",
};

async function createCircle(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const relation = text("relation");
  const startedAt = Number(text("startedAt"));
  const elapsed = Date.now() - startedAt;

  const result = await createCircleWithTemplate(supabase, userId, {
    displayName: text("displayName"),
    caredName: text("caredName"),
    relation: relation === OTHER ? text("relationOther") : relation,
    careType: text("careType"),
    durationMs:
      Number.isFinite(elapsed) && elapsed >= 0 && elapsed <= 86_400_000
        ? Math.round(elapsed)
        : undefined,
  });
  if (!result.ok) {
    if (result.error.code === "forbidden") {
      redirect("/bienvenida/consentimientos");
    }
    redirect(
      `/bienvenida?error=${result.error.code === "validation_failed" ? "datos" : "guardar"}`,
    );
  }
  redirect(`/hoy?c=${result.data.circleId}&bienvenida=1`);
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  if (!hasRequiredConsents(await getConsentState(supabase, userId))) {
    redirect("/bienvenida/consentimientos");
  }

  const params = await searchParams;
  const error =
    typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const [templates, profile] = await Promise.all([
    listCareTemplates(supabase),
    getSessionProfile(supabase, userId),
  ]);
  if (!error) {
    await track(supabase, userId, "flow.started", { flow: "onboarding" });
  }

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">
        Cuéntanos a quién cuidas
      </h1>
      <p className="text-fg-muted">
        Con esto dejamos tu día listo. Son un par de minutos y todo se puede
        cambiar después.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}

      <form action={createCircle} className="flex flex-col gap-6">
        <input type="hidden" name="startedAt" value={Date.now()} />
        <Field
          id="displayName"
          name="displayName"
          label="¿Cómo te llamas?"
          hint="Así te va a saludar Sole."
          defaultValue={profile?.displayName ?? ""}
          autoComplete="given-name"
          maxLength={60}
        />
        <Field
          id="caredName"
          name="caredName"
          label="¿Cómo se llama la persona que cuidas?"
          hint="Su nombre o como le dices tú."
          maxLength={60}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-lg font-bold">¿Quién es para ti?</legend>
          {[...RELATIONS, OTHER].map((relation) => (
            <label
              key={relation}
              htmlFor={`relation-${relation}`}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-2 text-lg has-[:checked]:border-primary has-[:checked]:bg-surface"
            >
              <input
                id={`relation-${relation}`}
                type="radio"
                name="relation"
                value={relation}
                className="size-6 shrink-0 accent-primary"
              />
              <span>
                {relation === OTHER
                  ? "Otra persona"
                  : relation.charAt(0).toUpperCase() + relation.slice(1)}
              </span>
            </label>
          ))}
          <Field
            id="relationOther"
            name="relationOther"
            label="Si es otra persona, ¿quién es?"
            hint="Por ejemplo: mi tía, mi abuelo, una amiga."
            maxLength={40}
          />
        </fieldset>

        <CareTypePicker
          options={templates.map((template) => ({
            value: template.careType,
            label: template.name,
            description: template.description,
            items: template.items.map((item) => item.title),
          }))}
        />

        <SubmitButton>Guardar y ver mi día</SubmitButton>
      </form>
    </>
  );
}
