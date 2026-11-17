import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  CONTACT_KINDS,
  type ContactKind,
  NOTES_MAX,
  PHONE_PATTERN,
} from "@/lib/contacts/labels";
import { decryptField, encryptField } from "@/lib/crypto/field";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["contacts"]["Row"];

export type ContactErrorCode =
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "internal";

/** Contexto de cifrado de las notas: lo comparten la exportación y la rotación de clave. */
const NOTES_CONTEXT = "contacts.notes";

const MESSAGES = {
  validation: "Revisa el contacto: falta algo o hay un dato que no calza.",
  forbidden: "Solo quien administra este círculo puede cambiar los contactos.",
  notFound: "No encontramos ese contacto.",
  internal: "No pudimos guardar. Prueba de nuevo en un momento.",
} as const;

export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(CONTACT_KINDS),
  phone: z.string().trim().regex(PHONE_PATTERN),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX)
    .optional()
    .transform((value) => (value ? value : undefined)),
  isEmergency: z.boolean().default(false),
});

export type ContactInput = z.input<typeof contactInputSchema>;

export interface ContactView {
  id: string;
  circleId: string;
  name: string;
  kind: ContactKind;
  phone: string;
  /** Vacía si no hay nota o si no se pudo descifrar. */
  notes: string;
  isEmergency: boolean;
  updatedAt: string;
}

/**
 * Enlace `tel:` de un teléfono guardado: deja solo el `+` inicial y los dígitos.
 * Es el camino confiable para llamar; no depende de ningún servicio.
 */
export function telHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

function toColumns(data: z.output<typeof contactInputSchema>) {
  return {
    name: data.name,
    kind: data.kind,
    phone: data.phone,
    notes_enc: data.notes ? encryptField(data.notes, NOTES_CONTEXT) : null,
    is_emergency: data.isEmergency,
  };
}

/** Null si falta la clave de cifrado: el llamador responde `internal`. */
function safeColumns(
  data: z.output<typeof contactInputSchema>,
): ReturnType<typeof toColumns> | null {
  try {
    return toColumns(data);
  } catch {
    return null;
  }
}

function readNotes(value: string | null): string {
  if (!value) {
    return "";
  }
  try {
    return decryptField(value, NOTES_CONTEXT);
  } catch {
    // Una nota ilegible no puede botar la lista entera de contactos.
    return "";
  }
}

function toView(row: Row): ContactView {
  return {
    id: row.id,
    circleId: row.circle_id,
    name: row.name,
    kind: row.kind as ContactKind,
    phone: row.phone,
    notes: readNotes(row.notes_enc),
    isEmergency: row.is_emergency,
    updatedAt: row.updated_at,
  };
}

function fromPostgres(error: {
  code?: string;
}): Result<never, ContactErrorCode> {
  return error.code === "42501"
    ? fail("forbidden", MESSAGES.forbidden)
    : fail("internal", MESSAGES.internal);
}

export async function createContact(
  client: Client,
  circleId: string,
  input: unknown,
): Promise<Result<{ id: string }, ContactErrorCode>> {
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success || !z.uuid().safeParse(circleId).success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  const columns = safeColumns(parsed.data);
  if (!columns) {
    return fail("internal", MESSAGES.internal);
  }
  const { data, error } = await client
    .from("contacts")
    .insert({ ...columns, circle_id: circleId })
    .select("id")
    .single();
  if (error || !data) {
    return fromPostgres(error ?? {});
  }
  return ok({ id: data.id });
}

export async function updateContact(
  client: Client,
  contactId: string,
  input: unknown,
): Promise<Result<{ id: string }, ContactErrorCode>> {
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  if (!z.uuid().safeParse(contactId).success) {
    return fail("not_found", MESSAGES.notFound);
  }
  const visible = await client
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .maybeSingle();
  if (!visible.data) {
    return fail("not_found", MESSAGES.notFound);
  }
  const columns = safeColumns(parsed.data);
  if (!columns) {
    return fail("internal", MESSAGES.internal);
  }
  const { data, error } = await client
    .from("contacts")
    .update(columns)
    .eq("id", contactId)
    .select("id");
  if (error) {
    return fromPostgres(error);
  }
  if (!data || data.length === 0) {
    // RLS dejó verlo pero no cambiarlo: es familiar, no cuidadora.
    return fail("forbidden", MESSAGES.forbidden);
  }
  return ok({ id: contactId });
}

export async function deleteContact(
  client: Client,
  contactId: string,
): Promise<Result<{ id: string }, ContactErrorCode>> {
  if (!z.uuid().safeParse(contactId).success) {
    return fail("not_found", MESSAGES.notFound);
  }
  const visible = await client
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .maybeSingle();
  if (!visible.data) {
    return fail("not_found", MESSAGES.notFound);
  }
  const { data, error } = await client
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .select("id");
  if (error) {
    return fromPostgres(error);
  }
  if (!data || data.length === 0) {
    return fail("forbidden", MESSAGES.forbidden);
  }
  return ok({ id: contactId });
}

/** Contactos del círculo (los de emergencia primero), con la nota ya legible. */
export async function listContacts(
  client: Client,
  circleId: string,
): Promise<ContactView[]> {
  const { data } = await client
    .from("contacts")
    .select("*")
    .eq("circle_id", circleId)
    .order("is_emergency", { ascending: false })
    .order("name", { ascending: true })
    .limit(200);
  return (data ?? []).map(toView);
}

export async function getContact(
  client: Client,
  contactId: string,
): Promise<ContactView | null> {
  if (!z.uuid().safeParse(contactId).success) {
    return null;
  }
  const { data } = await client
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();
  return data ? toView(data) : null;
}

/** ¿Es cuidadora del círculo? Solo ella puede cambiar los contactos. */
export async function isCaregiverOf(
  client: Client,
  userId: string,
  circleId: string,
): Promise<boolean> {
  const { data } = await client
    .from("circle_members")
    .select("role")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "caregiver";
}

/**
 * El contacto de emergencia del círculo (el actualizado más recientemente) o null.
 * Pensado para el cliente de servicio: filtra SIEMPRE por `circle_id` y devuelve
 * solo nombre y teléfono; nunca las notas.
 */
export async function emergencyContactFor(
  admin: Client,
  circleId: string,
): Promise<{ name: string; phone: string } | null> {
  if (!z.uuid().safeParse(circleId).success) {
    return null;
  }
  const { data } = await admin
    .from("contacts")
    .select("name, phone")
    .eq("circle_id", circleId)
    .eq("is_emergency", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? { name: data.name, phone: data.phone } : null;
}
