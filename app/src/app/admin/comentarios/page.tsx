import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  countRecentErrors,
  listFeedback,
  markFeedbackRead,
} from "@/server/admin/content";
import { adminPage } from "../access";

export const metadata: Metadata = { title: "Comentarios" };

const PATH = "/admin/comentarios";
const KIND_LABEL: Record<string, string> = {
  comentario: "Comentario",
  problema: "Problema",
};

async function markRead(formData: FormData): Promise<void> {
  "use server";
  const supabase = await adminPage(PATH, "marcar comentario leído");
  const result = await markFeedbackRead(
    supabase,
    formData.get("id"),
    new Date(),
  );
  revalidatePath(PATH);
  redirect(`${PATH}?${result.ok ? "guardado=1" : "error=1"}`);
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await adminPage(PATH);
  const params = await searchParams;
  const now = new Date();
  const [messages, errorCount] = await Promise.all([
    listFeedback(supabase, 100),
    countRecentErrors(supabase, now),
  ]);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Comentarios</h1>

      <section
        aria-labelledby="errores-titulo"
        className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
      >
        <h2 id="errores-titulo" className="text-xl font-bold">
          Errores técnicos
        </h2>
        <p>
          Errores de los últimos 7 días:{" "}
          <strong>
            {errorCount === null ? "no se pudo contar" : errorCount}
          </strong>
        </p>
        <a
          href="https://sentry.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center font-bold text-primary underline"
        >
          Abrir Sentry (se abre en otra pestaña)
        </a>
      </section>

      <div aria-live="polite">
        {params.guardado === "1" ? (
          <p className="rounded-card border border-success bg-success-bg p-4 text-success">
            Marcado como leído.
          </p>
        ) : null}
      </div>
      {params.error === "1" ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          No pudimos marcarlo como leído. Prueba de nuevo.
        </p>
      ) : null}

      <section aria-labelledby="lista-titulo" className="flex flex-col gap-4">
        <h2 id="lista-titulo" className="text-xl font-bold">
          Lo que han contado (los últimos 100, del más nuevo al más antiguo)
        </h2>
        {messages.length === 0 ? (
          <p>
            Todavía no hay comentarios. Cuando alguien escriba, aparecerá aquí.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((item) => (
              <li
                key={item.id}
                data-feedback={item.id}
                className="flex flex-col gap-2 rounded-card border border-border p-4"
              >
                <p className="text-fg-muted">
                  <strong>{KIND_LABEL[item.kind] ?? item.kind}</strong> ·{" "}
                  {item.screen ? `Desde ${item.screen}` : "Sin pantalla"} ·{" "}
                  {item.createdAt.slice(0, 10)} ·{" "}
                  <strong>{item.readAt ? "Leído" : "Sin leer"}</strong>
                </p>
                <p className="whitespace-pre-wrap break-words">
                  {item.message}
                </p>
                {item.readAt ? null : (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <SubmitButton variant="secondary">
                      Marcar como leído
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
