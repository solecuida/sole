import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ContactForm,
  type ContactFormValues,
  EMPTY_CONTACT,
} from "@/components/contacts/contact-form";
import { Button } from "@/components/ui/button";
import { CONTACT_KIND_LABELS } from "@/lib/contacts/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import {
  type ContactErrorCode,
  createContact,
  deleteContact,
  getContact,
  isCaregiverOf,
  listContacts,
  telHref,
  updateContact,
} from "@/server/contacts/contacts";

export const metadata: Metadata = { title: "Contactos" };

const ERRORS: Record<string, string> = {
  datos:
    "Revisa el contacto: falta el nombre o el teléfono, o el teléfono tiene algo que no es un número.",
  permiso: "Solo quien administra este círculo puede cambiar los contactos.",
  noexiste: "No encontramos ese contacto.",
  guardar: "No pudimos guardar. Prueba de nuevo en un momento.",
};

const NOTICES: Record<string, string> = {
  guardado: "Listo, guardamos el contacto.",
  quitado: "Quitamos el contacto.",
};

const ERROR_KEY: Record<ContactErrorCode, string> = {
  validation_failed: "datos",
  forbidden: "permiso",
  not_found: "noexiste",
  internal: "guardar",
};

const linkButton =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 px-5 py-2 text-lg font-bold no-underline";

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

/** Vuelve a la lista del círculo; `c` solo se arrastra si parece un id. */
function listUrl(circleId: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (/^[0-9a-f-]{36}$/i.test(circleId)) {
    params.set("c", circleId);
  }
  for (const [key, value] of Object.entries(extra)) {
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `/contactos?${query}` : "/contactos";
}

/** Crea o edita un contacto. Vuelve a comprobar sesión; RLS decide si puede escribir. */
async function saveContact(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const circleId = text(formData, "circleId");
  const contactId = text(formData, "contactId");
  const input = {
    name: text(formData, "name"),
    kind: text(formData, "kind"),
    phone: text(formData, "phone"),
    notes: text(formData, "notes"),
    isEmergency: formData.get("isEmergency") === "on",
  };
  const result = contactId
    ? await updateContact(supabase, contactId, input)
    : await createContact(supabase, circleId, input);
  if (!result.ok) {
    redirect(
      listUrl(circleId, {
        error: ERROR_KEY[result.error.code],
        ...(contactId ? { editar: contactId } : {}),
      }),
    );
  }
  revalidatePath("/contactos");
  redirect(listUrl(circleId, { ok: "guardado" }));
}

async function removeContact(formData: FormData): Promise<void> {
  "use server";
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  const circleId = text(formData, "circleId");
  const result = await deleteContact(supabase, text(formData, "contactId"));
  if (!result.ok) {
    redirect(listUrl(circleId, { error: ERROR_KEY[result.error.code] }));
  }
  revalidatePath("/contactos");
  redirect(listUrl(circleId, { ok: "quitado" }));
}

const single = (value: string | string[] | undefined) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export default async function ContactsPage({
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
  const [contacts, canEdit] = await Promise.all([
    listContacts(supabase, circle.id),
    isCaregiverOf(supabase, userId, circle.id),
  ]);

  const editingId = canEdit ? single(params.editar) : undefined;
  const editing = editingId
    ? (contacts.find((contact) => contact.id === editingId) ??
      (await getContact(supabase, editingId)))
    : null;
  const formValues: ContactFormValues = editing
    ? {
        id: editing.id,
        name: editing.name,
        kind: editing.kind,
        phone: editing.phone,
        notes: editing.notes,
        isEmergency: editing.isEmergency,
      }
    : EMPTY_CONTACT;

  const error = ERRORS[single(params.error) ?? ""];
  const notice = NOTICES[single(params.ok) ?? ""];

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Contactos</h1>
      <p className="text-fg-muted">
        Los números que importan para cuidar a {circle.caredName}, a un toque de
        llamar.
      </p>

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

      <section aria-labelledby="lista-titulo" className="flex flex-col gap-3">
        <h2 id="lista-titulo" className="text-2xl font-bold">
          Tu lista
        </h2>
        {contacts.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-4">
            Todavía no hay contactos.
            {canEdit ? " Agrega el primero abajo." : ""}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
              >
                <h3 className="text-lg font-bold">{contact.name}</h3>
                {contact.isEmergency ? (
                  <p className="font-bold text-danger">
                    Contacto de emergencia
                  </p>
                ) : null}
                <p className="text-fg-muted">
                  {CONTACT_KIND_LABELS[contact.kind]} · {contact.phone}
                </p>
                {contact.notes ? (
                  <p className="whitespace-pre-wrap text-base text-fg-muted">
                    {contact.notes}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={telHref(contact.phone)}
                    aria-label={`Llamar a ${contact.name}`}
                    className={`${linkButton} border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover`}
                  >
                    Llamar
                  </a>
                  {canEdit ? (
                    <>
                      <Link
                        href={listUrl(circle.id, { editar: contact.id })}
                        aria-label={`Editar ${contact.name}`}
                        className={`${linkButton} border-border-strong bg-background text-fg hover:bg-surface`}
                      >
                        Editar
                      </Link>
                      <form action={removeContact}>
                        <input
                          type="hidden"
                          name="circleId"
                          value={circle.id}
                        />
                        <input
                          type="hidden"
                          name="contactId"
                          value={contact.id}
                        />
                        <Button
                          type="submit"
                          variant="danger"
                          aria-label={`Quitar ${contact.name}`}
                        >
                          Quitar
                        </Button>
                      </form>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit ? (
        <section aria-labelledby="form-titulo" className="flex flex-col gap-4">
          <h2 id="form-titulo" className="text-2xl font-bold">
            {editing ? "Editar contacto" : "Agregar contacto"}
          </h2>
          <ContactForm
            // Cambiar de contacto reinicia los campos con sus valores.
            key={editing?.id ?? "nuevo"}
            action={saveContact}
            circleId={circle.id}
            values={formValues}
            cancelHref={editing ? listUrl(circle.id) : undefined}
          />
        </section>
      ) : (
        <p className="rounded-card border border-border bg-surface p-4">
          Solo quien administra el círculo puede agregar o cambiar contactos.
        </p>
      )}
    </>
  );
}
