import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CloseCircleSection } from "@/components/account/close-circle-section";
import { DeleteAccountSection } from "@/components/account/delete-account-section";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatLongDate } from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CSV_TABLES, type CsvTable } from "@/server/account/export";
import { getSessionUserId } from "@/server/auth/session";
import { listMyCircles, localDate } from "@/server/circles/circles";
import {
  getConsentRecords,
  grantResearch,
  revokeResearch,
} from "@/server/consents/consents";

import { closeCircleAction, deleteAccountAction } from "./actions";

export const metadata: Metadata = { title: "Mi cuenta" };

const CSV_LABELS: Record<CsvTable, string> = {
  recordatorios: "Recordatorios",
  cumplimiento: "Lo que se hizo y lo que no",
  bitacora: "Bitácora",
  tareas: "Tareas",
  contactos: "Contactos",
  bienestar: "Cómo he estado yo",
};

const MESSAGES: Record<string, { text: string; error?: boolean }> = {
  investigacion: { text: "Listo. Guardamos tu decisión." },
  clave: { text: "Listo. Ya puedes entrar con tu contraseña." },
  "clave-invalida": {
    text: "La contraseña necesita al menos 10 caracteres, con mayúsculas, minúsculas y números.",
    error: true,
  },
  "clave-distinta": {
    text: "Las dos contraseñas no son iguales.",
    error: true,
  },
  cerrado: {
    text: "Listo. Ese espacio quedó cerrado y ya no llegarán sus avisos. Lo que escribiste sigue aquí.",
  },
  "cerrado-fallecimiento": {
    text: "Lo sentimos mucho. Ya silenciamos todos los recordatorios. Lo que escribiste sigue aquí, por si quieres guardarlo.",
  },
  motivo: { text: "Elige un motivo para cerrar.", error: true },
  error: {
    text: "No pudimos guardar. Prueba de nuevo en un momento.",
    error: true,
  },
};

const linkButton =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline hover:bg-surface";

async function setResearch(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const result =
    formData.get("research") === "on"
      ? await grantResearch(supabase, userId)
      : await revokeResearch(supabase, userId);
  revalidatePath("/cuenta");
  redirect(`/cuenta?aviso=${result.ok ? "investigacion" : "error"}`);
}

async function setPassword(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const password = formData.get("password");
  const repeat = formData.get("passwordRepeat");
  if (
    typeof password !== "string" ||
    password.length < 10 ||
    password.length > 72 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  ) {
    redirect("/cuenta?aviso=clave-invalida");
  }
  if (password !== repeat) {
    redirect("/cuenta?aviso=clave-distinta");
  }
  const { error } = await supabase.auth.updateUser({ password });
  redirect(`/cuenta?aviso=${error ? "error" : "clave"}`);
}

export default async function AccountPage({
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
  const message =
    typeof params.aviso === "string" ? MESSAGES[params.aviso] : undefined;
  const [consents, circles, membership] = await Promise.all([
    getConsentRecords(supabase, userId),
    listMyCircles(supabase),
    supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", userId)
      .eq("role", "caregiver"),
  ]);
  const managed = new Set((membership.data ?? []).map((row) => row.circle_id));
  const closable = circles
    .filter((circle) => circle.closedAt === null && managed.has(circle.id))
    .map((circle) => ({ id: circle.id, caredName: circle.caredName }));
  const since = (iso: string | undefined) =>
    iso ? formatLongDate(localDate(new Date(iso))) : null;
  const researchOn = consents.research?.granted === true;

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Mi cuenta</h1>

      <div aria-live="polite">
        {message && !message.error ? (
          <p className="rounded-card border border-success bg-success-bg p-4 text-success">
            {message.text}
          </p>
        ) : null}
      </div>
      {message?.error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {message.text}
        </p>
      ) : null}

      <section aria-labelledby="permisos" className="flex flex-col gap-4">
        <h2 id="permisos" className="text-xl font-bold">
          Tus permisos
        </h2>
        <ul className="flex flex-col gap-3">
          <li className="rounded-card border border-border bg-surface p-4">
            <h3 className="text-lg font-bold">Usar Sole</h3>
            <p>
              {consents.terms?.granted
                ? `Aceptado el ${since(consents.terms.decidedAt)}.`
                : "Sin aceptar."}
            </p>
            <p className="text-base text-fg-muted">
              Necesario para tener tu cuenta.{" "}
              <a href="https://solecuida.com/terminos.html">Términos de uso</a>{" "}
              ·{" "}
              <a href="https://solecuida.com/privacidad.html">
                Política de privacidad
              </a>
            </p>
          </li>
          <li className="rounded-card border border-border bg-surface p-4">
            <h3 className="text-lg font-bold">Datos del cuidado</h3>
            <p>
              {consents.sensitive?.granted
                ? `Aceptado el ${since(consents.sensitive.decidedAt)}.`
                : "Sin aceptar."}
            </p>
            <p className="text-base text-fg-muted">
              Necesario para guardar recordatorios, medicamentos y la bitácora.
              Si ya no quieres que los guardemos, puedes borrar tu cuenta más
              abajo.
            </p>
          </li>
          <li className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
            <h3 className="text-lg font-bold">Ayudar a mejorar Sole</h3>
            <p>
              {researchOn
                ? `Aceptado el ${since(consents.research?.decidedAt)}.`
                : "No aceptado."}{" "}
              Es opcional.
            </p>
            <p className="text-base text-fg-muted">
              Registra cómo se usa la app, sin tu nombre, sin tu correo y sin lo
              que escribes. Puedes seguir usando Sole igual.
            </p>
            <form action={setResearch}>
              {researchOn ? null : (
                <input type="hidden" name="research" value="on" />
              )}
              <SubmitButton variant="secondary">
                {researchOn
                  ? "Dejar de compartir mis datos de uso"
                  : "Compartir mis datos de uso"}
              </SubmitButton>
            </form>
          </li>
        </ul>
      </section>

      <section aria-labelledby="descargas" className="flex flex-col gap-4">
        <h2 id="descargas" className="text-xl font-bold">
          Descargar mis datos
        </h2>
        <p>
          Todo lo que Sole guarda de ti es tuyo. Al descargarlo sale de Sole:
          guárdalo en un lugar seguro.
        </p>
        <a
          href="/api/cuenta/exportar?formato=json"
          download
          className={linkButton}
        >
          Descargar todo
        </a>
        <p className="text-base text-fg-muted">
          «Descargar todo» entrega un archivo completo. Si prefieres abrirlo en
          Excel, descarga cada parte por separado:
        </p>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CSV_TABLES.map((table) => (
            <li key={table}>
              <a
                href={`/api/cuenta/exportar?formato=csv&tabla=${table}`}
                download
                className={`${linkButton} w-full`}
              >
                {CSV_LABELS[table]}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="clave" className="flex flex-col gap-4">
        <h2 id="clave" className="text-xl font-bold">
          Contraseña (opcional)
        </h2>
        <p>
          No la necesitas: puedes seguir entrando con el enlace que llega a tu
          correo. Créala solo si te acomoda más.
        </p>
        <form action={setPassword} className="flex flex-col gap-4">
          <Field
            id="password"
            name="password"
            type="password"
            label="Contraseña nueva"
            hint="Al menos 10 caracteres, con mayúsculas, minúsculas y números."
            autoComplete="new-password"
            maxLength={72}
          />
          <Field
            id="passwordRepeat"
            name="passwordRepeat"
            type="password"
            label="Repite la contraseña"
            autoComplete="new-password"
            maxLength={72}
          />
          <SubmitButton variant="secondary">Guardar contraseña</SubmitButton>
        </form>
      </section>

      <CloseCircleSection circles={closable} close={closeCircleAction} />

      <DeleteAccountSection
        remove={deleteAccountAction}
        error={
          params.aviso === "confirmar"
            ? "Escribe la palabra BORRAR para confirmar."
            : undefined
        }
      />
    </>
  );
}
