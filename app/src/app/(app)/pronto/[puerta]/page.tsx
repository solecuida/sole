import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { track } from "@/server/events/track";
import {
  findDoor,
  getInterest,
  PLAN_PRICES,
  type PlanPrice,
  PRICE_LABELS,
  registerInterest,
} from "@/server/fake-doors/doors";

export const metadata: Metadata = { title: "Próximamente" };

type Params = Promise<{ puerta: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SECONDARY =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline hover:bg-surface";

function isPrice(value: FormDataEntryValue | null): value is PlanPrice {
  return PLAN_PRICES.some((price) => price === value);
}

export default async function FakeDoorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { puerta } = await params;
  const door = findDoor(puerta);
  if (!door) {
    notFound();
  }
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const query = await searchParams;
  const saved = query.guardado === "1";
  const isPlan = door.key === "plan_familiar";
  const doorKey = door.key;
  const doorSlug = door.slug;

  /** Guarda la respuesta ("Sí, avísame" o "No por ahora"). Vuelve a comprobar la sesión. */
  async function answer(formData: FormData): Promise<void> {
    "use server";
    const client = await createSupabaseServerClient();
    const currentUser = await getSessionUserId(client);
    if (!currentUser) {
      redirect("/entrar");
    }
    const wantsNotice = formData.get("answer") === "yes";
    const rawChoice = formData.get("choice");
    const choice = wantsNotice && isPrice(rawChoice) ? rawChoice : null;
    const result = await registerInterest(client, currentUser, doorKey, {
      notifyMe: wantsNotice,
      choice,
    });
    if (result.ok && wantsNotice) {
      await track(client, currentUser, "fake_door.interest", {
        door: doorKey,
        choice: choice ?? "none",
      });
    }
    redirect(`/pronto/${doorSlug}?${result.ok ? "guardado=1" : "error=1"}`);
  }

  // Al volver de guardar no se cuenta otra visita.
  if (!saved && query.error !== "1") {
    await track(supabase, userId, "fake_door.viewed", { door: door.key });
  }
  const previous = await getInterest(supabase, userId, door.key);

  return (
    <>
      <p>
        <Link href="/pronto" className="font-bold text-primary underline">
          Volver a Próximamente
        </Link>
      </p>
      <h1 className="text-3xl font-bold leading-tight">{door.title}</h1>
      <p className="text-lg">{door.description}</p>
      <p className="rounded-card border border-info bg-info-bg p-4 font-bold text-info">
        Esto todavía no existe. ¿Quieres que te avisemos cuando esté?
      </p>

      <div aria-live="polite">
        {saved ? (
          <p className="rounded-card border border-success bg-success-bg p-4 text-success">
            Gracias. Tu respuesta nos ayuda a decidir qué construir.
          </p>
        ) : null}
      </div>
      {query.error === "1" ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          No pudimos guardar tu respuesta. Prueba de nuevo en un momento.
        </p>
      ) : null}
      {previous && !saved ? (
        <p className="text-fg-muted">
          Tu última respuesta:{" "}
          {previous.notifyMe ? "Sí, avísame" : "No por ahora"}
          {previous.choice
            ? ` (precio de prueba ${PRICE_LABELS[previous.choice]})`
            : ""}
          . Puedes cambiarla.
        </p>
      ) : null}

      <form action={answer} className="flex flex-col gap-4">
        {isPlan ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-lg font-bold">
              Si existiera, ¿cuál de estos precios de prueba te parecería
              razonable?
            </legend>
            {PLAN_PRICES.map((price) => (
              <label
                key={price}
                htmlFor={`precio-${price}`}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-2 text-lg has-[:checked]:border-primary has-[:checked]:bg-surface has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
              >
                <input
                  id={`precio-${price}`}
                  type="radio"
                  name="choice"
                  value={price}
                  defaultChecked={previous?.choice === price}
                  className="size-6 shrink-0 accent-primary"
                />
                <span>{PRICE_LABELS[price]} al mes</span>
              </label>
            ))}
            <p className="font-bold">Precio de prueba: hoy no se cobra nada</p>
          </fieldset>
        ) : null}
        <p className="text-base text-fg-muted">
          No te pedimos ningún dato de pago.
        </p>
        <div className="flex flex-wrap gap-3">
          <SubmitButton name="answer" value="yes">
            Sí, avísame
          </SubmitButton>
          <SubmitButton name="answer" value="no" variant="secondary">
            No por ahora
          </SubmitButton>
        </div>
      </form>
      <Link href="/pronto" className={SECONDARY}>
        Ver las otras ideas
      </Link>
    </>
  );
}
