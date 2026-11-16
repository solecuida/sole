import { TZDate } from "@date-fns/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import { Constants, type Database } from "@/lib/supabase/database.types";
import { templateItemSchema } from "@/server/reminders/rule-schema";

// Gestión de contenido del panel del fundador (F15). Todo corre con el cliente
// del ADMINISTRADOR (sesión aal2): la barrera real es RLS (`private.is_admin_mfa()`).
// El registro en la auditoría lo hace `adminPage(ruta, acción)` en cada página y acción.

type Client = SupabaseClient<Database>;
type Code = "validation_failed" | "conflict" | "not_found" | "internal";

const INVALID = "Revisa los datos: alguno no es válido.";
const INTERNAL = "No pudimos guardar el cambio. Prueba de nuevo.";

const uuid = z.string().uuid();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));
const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\/\S+$/, "Debe empezar con https://");

function invalid(error: z.ZodError): Result<never, Code> {
  const first = error.issues[0]?.message;
  return fail("validation_failed", first ? `${INVALID} ${first}` : INVALID);
}

function fromDb(error: { code?: string } | null): Result<never, Code> {
  return error?.code === "23505"
    ? fail("conflict", "Ya existe uno con ese código.")
    : fail("internal", INTERNAL);
}

// ---------------------------------------------------------------- organizaciones
export const ORG_KINDS = [
  { value: "fundacion", label: "Fundación" },
  { value: "municipio", label: "Municipio" },
  { value: "centro_salud", label: "Centro de salud" },
  { value: "agrupacion", label: "Agrupación" },
  { value: "asociacion_pacientes", label: "Asociación de pacientes" },
  { value: "otro", label: "Otro" },
] as const;

const orgSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto.").max(200),
  kind: z.enum([
    "fundacion",
    "municipio",
    "centro_salud",
    "agrupacion",
    "asociacion_pacientes",
    "otro",
  ]),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9-]{3,32}$/,
      "El código usa de 3 a 32 letras, números o guiones.",
    ),
});

export interface OrganizationRow {
  id: string;
  code: string;
  name: string;
  kind: string;
  active: boolean;
  createdAt: string;
}

export async function listOrganizations(
  client: Client,
): Promise<OrganizationRow[]> {
  const { data } = await client
    .from("organizations")
    .select("id, code, name, kind, active, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    kind: row.kind,
    active: row.active,
    createdAt: row.created_at,
  }));
}

export async function createOrganization(
  client: Client,
  input: unknown,
): Promise<Result<{ code: string }, Code>> {
  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { error } = await client.from("organizations").insert(parsed.data);
  return error ? fromDb(error) : ok({ code: parsed.data.code });
}

export async function toggleOrganization(
  client: Client,
  id: unknown,
  active: unknown,
): Promise<Result<undefined, Code>> {
  const parsed = z
    .object({ id: uuid, active: z.boolean() })
    .safeParse({ id, active });
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { data, error } = await client
    .from("organizations")
    .update({ active: parsed.data.active })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) {
    return fromDb(error);
  }
  return data?.length
    ? ok()
    : fail("not_found", "No encontramos esa organización.");
}

// ---------------------------------------------------------------- consejos
const tipSchema = z
  .object({
    kind: z.enum(["consejo", "actividad"]),
    text: z.string().trim().min(5, "El texto es muy corto.").max(200),
    activityTitle: optionalText(80),
    careTypes: z.array(z.enum(Constants.public.Enums.care_type)).max(9),
    active: z.boolean(),
  })
  .refine((tip) => tip.kind !== "actividad" || tip.activityTitle, {
    message: "Una actividad necesita su título.",
    path: ["activityTitle"],
  });

export interface TipRow {
  id: string;
  kind: string;
  text: string;
  activityTitle: string | null;
  careTypes: string[];
  active: boolean;
}

export async function listTips(client: Client): Promise<TipRow[]> {
  const { data } = await client
    .from("tips")
    .select("id, kind, text, activity_title, care_types, active")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    text: row.text,
    activityTitle: row.activity_title,
    careTypes: row.care_types,
    active: row.active,
  }));
}

function tipColumns(tip: z.infer<typeof tipSchema>) {
  return {
    kind: tip.kind,
    text: tip.text,
    activity_title: tip.kind === "actividad" ? tip.activityTitle : null,
    care_types: tip.careTypes,
    active: tip.active,
  };
}

export async function createTip(
  client: Client,
  input: unknown,
): Promise<Result<undefined, Code>> {
  const parsed = tipSchema.safeParse(input);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { error } = await client.from("tips").insert(tipColumns(parsed.data));
  return error ? fromDb(error) : ok();
}

export async function updateTip(
  client: Client,
  id: unknown,
  input: unknown,
): Promise<Result<undefined, Code>> {
  const parsedId = uuid.safeParse(id);
  const parsed = tipSchema.safeParse(input);
  if (!parsedId.success) {
    return fail("validation_failed", INVALID);
  }
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { data, error } = await client
    .from("tips")
    .update(tipColumns(parsed.data))
    .eq("id", parsedId.data)
    .select("id");
  if (error) {
    return fromDb(error);
  }
  return data?.length ? ok() : fail("not_found", "No encontramos ese consejo.");
}

export async function deleteTip(
  client: Client,
  id: unknown,
): Promise<Result<undefined, Code>> {
  const parsedId = uuid.safeParse(id);
  if (!parsedId.success) {
    return fail("validation_failed", INVALID);
  }
  const { error } = await client.from("tips").delete().eq("id", parsedId.data);
  return error ? fromDb(error) : ok();
}

// ---------------------------------------------------------------- recursos
const resourceSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto.").max(120),
  description: z
    .string()
    .trim()
    .min(5, "La descripción es muy corta.")
    .max(400),
  phone: optionalText(30),
  url: z.union([httpsUrl, z.literal("")]).transform((value) => value || null),
  sourceUrl: httpsUrl,
  region: z
    .string()
    .trim()
    .max(60)
    .transform((value) => value || "nacional"),
  active: z.boolean(),
});

export interface ResourceRow {
  id: string;
  name: string;
  description: string;
  phone: string | null;
  url: string | null;
  sourceUrl: string;
  verifiedAt: string | null;
  region: string;
  active: boolean;
}

/** Los sin verificar primero. */
export async function listResources(client: Client): Promise<ResourceRow[]> {
  const { data } = await client
    .from("resources")
    .select(
      "id, name, description, phone, url, source_url, verified_at, region, active",
    )
    .order("verified_at", { ascending: true, nullsFirst: true })
    .order("name", { ascending: true })
    .limit(500);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    phone: row.phone,
    url: row.url,
    sourceUrl: row.source_url,
    verifiedAt: row.verified_at,
    region: row.region,
    active: row.active,
  }));
}

function resourceColumns(resource: z.infer<typeof resourceSchema>) {
  return {
    name: resource.name,
    description: resource.description,
    phone: resource.phone,
    url: resource.url,
    source_url: resource.sourceUrl,
    region: resource.region,
    active: resource.active,
  };
}

/** Un recurso nuevo entra SIN verificar: no se muestra a nadie hasta que se verifique. */
export async function createResource(
  client: Client,
  input: unknown,
): Promise<Result<undefined, Code>> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { error } = await client
    .from("resources")
    .insert(resourceColumns(parsed.data));
  return error ? fromDb(error) : ok();
}

export async function updateResource(
  client: Client,
  id: unknown,
  input: unknown,
): Promise<Result<undefined, Code>> {
  const parsedId = uuid.safeParse(id);
  const parsed = resourceSchema.safeParse(input);
  if (!parsedId.success) {
    return fail("validation_failed", INVALID);
  }
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { data, error } = await client
    .from("resources")
    .update(resourceColumns(parsed.data))
    .eq("id", parsedId.data)
    .select("id");
  if (error) {
    return fromDb(error);
  }
  return data?.length ? ok() : fail("not_found", "No encontramos ese recurso.");
}

/** Hoy en Chile, como `YYYY-MM-DD`. */
export function todayInSantiago(now: Date): string {
  const day = new TZDate(now, "America/Santiago");
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** `verified: true` pone la fecha de hoy; `false` quita la verificación. */
export async function setResourceVerified(
  client: Client,
  id: unknown,
  verified: unknown,
  now: Date,
): Promise<Result<{ verifiedAt: string | null }, Code>> {
  const parsed = z
    .object({ id: uuid, verified: z.boolean() })
    .safeParse({ id, verified });
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const verifiedAt = parsed.data.verified ? todayInSantiago(now) : null;
  const { data, error } = await client
    .from("resources")
    .update({ verified_at: verifiedAt })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) {
    return fromDb(error);
  }
  return data?.length
    ? ok({ verifiedAt })
    : fail("not_found", "No encontramos ese recurso.");
}

export async function deleteResource(
  client: Client,
  id: unknown,
): Promise<Result<undefined, Code>> {
  const parsedId = uuid.safeParse(id);
  if (!parsedId.success) {
    return fail("validation_failed", INVALID);
  }
  const { error } = await client
    .from("resources")
    .delete()
    .eq("id", parsedId.data);
  return error ? fromDb(error) : ok();
}

// ---------------------------------------------------------------- plantillas
const templateSchema = z.object({
  careType: z.enum(Constants.public.Enums.care_type),
  name: z.string().trim().min(2, "El nombre es muy corto.").max(80),
  description: z
    .string()
    .trim()
    .min(5, "La descripción es muy corta.")
    .max(300),
  items: z.array(templateItemSchema).max(40, "Máximo 40 ítems."),
});

export interface TemplateRow {
  careType: string;
  name: string;
  description: string;
  items: unknown;
}

export async function listTemplates(client: Client): Promise<TemplateRow[]> {
  const { data } = await client
    .from("care_templates")
    .select("care_type, name, description, items")
    .order("name", { ascending: true });
  return (data ?? []).map((row) => ({
    careType: row.care_type,
    name: row.name,
    description: row.description,
    items: row.items,
  }));
}

/** `itemsJson` es el texto del campo: se interpreta y cada ítem se valida antes de guardar. */
export async function updateTemplate(
  client: Client,
  input: {
    careType: unknown;
    name: unknown;
    description: unknown;
    itemsJson: unknown;
  },
): Promise<Result<undefined, Code>> {
  let items: unknown;
  try {
    items = JSON.parse(
      typeof input.itemsJson === "string" ? input.itemsJson : "",
    );
  } catch {
    return fail(
      "validation_failed",
      "Los ítems no están escritos como una lista válida.",
    );
  }
  const parsed = templateSchema.safeParse({
    careType: input.careType,
    name: input.name,
    description: input.description,
    items,
  });
  if (!parsed.success) {
    return invalid(parsed.error);
  }
  const { data, error } = await client
    .from("care_templates")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      items: parsed.data.items,
    })
    .eq("care_type", parsed.data.careType)
    .select("care_type");
  if (error) {
    return fromDb(error);
  }
  return data?.length
    ? ok()
    : fail("not_found", "No encontramos esa plantilla.");
}

// ---------------------------------------------------------------- comentarios
export interface FeedbackRow {
  id: string;
  kind: string;
  message: string;
  screen: string | null;
  createdAt: string;
  readAt: string | null;
}

/** Los más nuevos primero. NUNCA trae `user_id`: el panel no muestra quién escribió. */
export async function listFeedback(
  client: Client,
  limit = 100,
): Promise<FeedbackRow[]> {
  const { data } = await client
    .from("feedback")
    .select("id, kind, message, screen, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    message: row.message,
    screen: row.screen,
    createdAt: row.created_at,
    readAt: row.read_at,
  }));
}

export async function markFeedbackRead(
  client: Client,
  id: unknown,
  now: Date,
): Promise<Result<undefined, Code>> {
  const parsedId = uuid.safeParse(id);
  if (!parsedId.success) {
    return fail("validation_failed", INVALID);
  }
  const { data, error } = await client
    .from("feedback")
    .update({ read_at: now.toISOString() })
    .eq("id", parsedId.data)
    .select("id");
  if (error) {
    return fromDb(error);
  }
  return data?.length
    ? ok()
    : fail("not_found", "No encontramos ese comentario.");
}

/** Eventos `app.error` de los últimos 7 días (o `null` si no se pudo contar). */
export async function countRecentErrors(
  client: Client,
  now: Date,
): Promise<number | null> {
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { count, error } = await client
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("name", "app.error")
    .gte("created_at", since.toISOString());
  return error ? null : (count ?? 0);
}
