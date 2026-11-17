import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { RespiroDialog } from "@/components/selfcare/respiro-dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatLongDate } from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import {
  checkIn,
  emergencyContacts,
  lowStreak,
  todayScore,
  verifiedResources,
} from "@/server/selfcare/selfcare";

export const metadata: Metadata = { title: "Para ti" };

const SCORES = [
  { value: 1, label: "1 · Muy mal" },
  { value: 2, label: "2 · Mal" },
  { value: 3, label: "3 · Más o menos" },
  { value: 4, label: "4 · Bien" },
  { value: 5, label: "5 · Muy bien" },
] as const;

const LINK =
  "inline-flex min-h-12 items-center font-bold text-primary underline";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Guarda la respuesta del día. Vuelve a comprobar la sesión. */
async function saveCheckIn(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const raw = formData.get("score");
  const circle = await resolveActiveCircle(supabase);
  const result =
    typeof raw === "string" && raw !== ""
      ? await checkIn(
          supabase,
          userId,
          Number(raw),
          new Date(),
          circle?.timezone,
        )
      : null;
  revalidatePath("/para-ti");
  redirect(`/para-ti?${result?.ok ? "guardado=1" : "error=1"}`);
}

export default async function ForYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const params = await searchParams;
  const circle = await resolveActiveCircle(
    supabase,
    typeof params.c === "string" ? params.c : null,
  );
  const now = new Date();
  const tz = circle?.timezone;
  const [score, heavy, resources, contacts] = await Promise.all([
    todayScore(supabase, userId, now, tz),
    lowStreak(supabase, userId, now, tz),
    verifiedResources(supabase),
    circle ? emergencyContacts(supabase, circle.id) : Promise.resolve([]),
  ]);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Para ti</h1>

      {heavy ? (
        <section
          aria-labelledby="pesados-titulo"
          className="flex flex-col gap-2 rounded-card border border-info bg-info-bg p-4"
        >
          <h2 id="pesados-titulo" className="sr-only">
            Un mensaje para ti
          </h2>
          <p className="font-bold text-info">
            Han sido días pesados. No tienes que poder con todo.
          </p>
          <p>
            Si quieres, mira los apoyos que hay más abajo o toma un respiro.
          </p>
        </section>
      ) : null}

      <section
        aria-labelledby="pregunta-titulo"
        className="flex flex-col gap-4"
      >
        <h2 id="pregunta-titulo" className="text-xl font-bold">
          ¿Cómo estás tú hoy?
        </h2>
        <p className="text-fg-muted">
          Esto es solo para ti: no lo ve nadie más
        </p>
        <div aria-live="polite">
          {params.guardado === "1" ? (
            <p className="rounded-card border border-success bg-success-bg p-4 text-success">
              Guardado. Gracias por contarlo.
            </p>
          ) : null}
        </div>
        {params.error === "1" ? (
          <p
            role="alert"
            className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
          >
            Elige una de las opciones y vuelve a guardar.
          </p>
        ) : null}
        <form action={saveCheckIn} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-lg font-bold">
              Elige la que más se parezca
            </legend>
            {SCORES.map((option) => (
              <label
                key={option.value}
                htmlFor={`score-${option.value}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-2 text-lg has-[:checked]:border-primary has-[:checked]:bg-surface has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
              >
                <input
                  id={`score-${option.value}`}
                  type="radio"
                  name="score"
                  value={option.value}
                  defaultChecked={score === option.value}
                  className="size-6 shrink-0 accent-primary"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          <p className="text-base text-fg-muted">
            Puedes no responder: nada se pierde.
          </p>
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="respiro-titulo" className="flex flex-col gap-2">
        <h2 id="respiro-titulo" className="text-xl font-bold">
          Un momento para ti
        </h2>
        <RespiroDialog
          resources={resources.map((resource) => ({
            id: resource.id,
            name: resource.name,
            phone: resource.phone,
            url: resource.url,
          }))}
          contacts={contacts}
        />
      </section>

      <section
        aria-labelledby="apoyos-titulo-pagina"
        className="flex flex-col gap-4"
      >
        <h2 id="apoyos-titulo-pagina" className="text-xl font-bold">
          Apoyos en Chile
        </h2>
        {resources.length === 0 ? (
          <p>Estamos verificando los recursos. Vuelve pronto.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4"
              >
                <h3 className="text-lg font-bold">{resource.name}</h3>
                <p>{resource.description}</p>
                {resource.phone ? (
                  <a href={telHref(resource.phone)} className={LINK}>
                    Llamar al {resource.phone}
                  </a>
                ) : null}
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK}
                  >
                    Sitio de {resource.name}
                  </a>
                ) : null}
                <p className="text-base text-fg-muted">
                  <a
                    href={resource.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary underline"
                  >
                    Fuente oficial
                  </a>
                  {" · "}
                  Verificado el {formatLongDate(resource.verifiedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
