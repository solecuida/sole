import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type CreateLinkState,
  LinkCreator,
} from "@/components/cared/link-creator";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/env";
import { formatLongDate } from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import {
  createLink,
  type LinkView,
  listLinks,
  revokeLink,
} from "@/server/cared-link/links";
import { localDate, resolveActiveCircle } from "@/server/circles/circles";
import { isCaregiverOf } from "@/server/contacts/contacts";

export const metadata: Metadata = { title: "Vínculo de la persona cuidada" };

const NOTICES: Record<string, string> = {
  revocado: "Listo, revocamos el vínculo. Ya no abre nada.",
};

const ERRORS: Record<string, string> = {
  revocar: "No pudimos revocar el vínculo. Prueba de nuevo en un momento.",
};

const STATE_LABELS: Record<LinkView["state"], string> = {
  active: "Vigente",
  revoked: "Revocado",
  expired: "Vencido",
};

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

const single = (value: string | string[] | undefined) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

function pageUrl(circleId: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (/^[0-9a-f-]{36}$/i.test(circleId)) {
    params.set("c", circleId);
  }
  for (const [key, value] of Object.entries(extra)) {
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `/persona-cuidada?${query}` : "/persona-cuidada";
}

const day = (iso: string) => formatLongDate(localDate(new Date(iso)));

/** Crea el vínculo y DEVUELVE el enlace: no hay redirect, así no queda en el historial. */
async function createLinkAction(
  _previous: CreateLinkState,
  formData: FormData,
): Promise<CreateLinkState> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const result = await createLink(
    supabase,
    userId,
    text(formData, "circleId"),
    text(formData, "label"),
    new Date(),
  );
  if (!result.ok) {
    return { error: result.error.message };
  }
  revalidatePath("/persona-cuidada");
  return { url: `${appUrl()}/v/${result.data.token}` };
}

async function revokeLinkAction(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const circleId = text(formData, "circleId");
  const result = await revokeLink(
    supabase,
    text(formData, "linkId"),
    new Date(),
  );
  revalidatePath("/persona-cuidada");
  redirect(
    pageUrl(circleId, result.ok ? { ok: "revocado" } : { error: "revocar" }),
  );
}

export default async function CaredLinkPage({
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
  const circle = await resolveActiveCircle(supabase, single(params.c) ?? null);
  if (!circle) {
    redirect("/bienvenida");
  }

  if (!(await isCaregiverOf(supabase, userId, circle.id))) {
    return (
      <>
        <h1 className="text-3xl font-bold leading-tight">
          Vínculo de la persona cuidada
        </h1>
        <p className="rounded-card border border-border bg-surface p-4">
          Solo quien cuida puede crear o revocar este vínculo.
        </p>
      </>
    );
  }

  const links = await listLinks(supabase, circle.id, new Date());
  const error = ERRORS[single(params.error) ?? ""];
  const notice = NOTICES[single(params.ok) ?? ""];

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">
        Vínculo de la persona cuidada
      </h1>
      <p className="text-fg-muted">
        Un enlace secreto para que {circle.caredName} vea su día en una pantalla
        grande, sin cuenta ni contraseña.
      </p>

      <section
        aria-labelledby="que-vera"
        className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
      >
        <h2 id="que-vera" className="text-xl font-bold">
          Qué verá {circle.caredName}
        </h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Solo el título y la hora de los recordatorios que marques como
            visibles para ella o él.
          </li>
          <li>Un botón “Listo” en cada uno.</li>
          <li>
            Un botón para pedir ayuda, que antes pregunta si de verdad quiere.
          </li>
        </ul>
        <p>
          Nunca verá medicamentos, la bitácora, las tareas ni los contactos.
          Quien tenga el enlace puede abrirlo: compártelo solo con quien
          corresponde. El enlace dura 90 días y puedes revocarlo cuando quieras.
        </p>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="rounded-card border border-border bg-surface p-4 font-bold"
        >
          {notice}
        </p>
      ) : null}

      <section aria-labelledby="crear-titulo" className="flex flex-col gap-4">
        <h2 id="crear-titulo" className="text-2xl font-bold">
          Crear un vínculo
        </h2>
        <LinkCreator action={createLinkAction} circleId={circle.id} />
      </section>

      <section aria-labelledby="lista-titulo" className="flex flex-col gap-3">
        <h2 id="lista-titulo" className="text-2xl font-bold">
          Tus vínculos
        </h2>
        {links.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-4">
            Todavía no hay vínculos.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
              >
                <h3 className="text-lg font-bold">
                  {link.label ?? "Sin nombre"}
                </h3>
                <p className="font-bold">{STATE_LABELS[link.state]}</p>
                <p className="text-fg-muted">
                  Creado el {day(link.createdAt)} · Vence el{" "}
                  {day(link.expiresAt)} ·{" "}
                  {link.lastUsedAt
                    ? `Último uso: ${day(link.lastUsedAt)}`
                    : "Todavía sin usar"}
                </p>
                {link.state === "active" ? (
                  <form action={revokeLinkAction}>
                    <input type="hidden" name="circleId" value={circle.id} />
                    <input type="hidden" name="linkId" value={link.id} />
                    <Button
                      type="submit"
                      variant="danger"
                      aria-label={`Revocar ${link.label ?? "vínculo sin nombre"}`}
                    >
                      Revocar
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
