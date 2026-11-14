import { TZDate } from "@date-fns/tz";
import type { SupabaseClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import { Constants, type Database } from "@/lib/supabase/database.types";
import { track } from "@/server/events/track";
import {
  type TemplateItem,
  templateItemSchema,
} from "@/server/reminders/rule-schema";

type Client = SupabaseClient<Database>;
export type CareType = Database["public"]["Enums"]["care_type"];

export const DEFAULT_TIMEZONE = "America/Santiago";

/** Día local `YYYY-MM-DD` de un instante en una zona horaria. */
export function localDate(now: Date, timezone = DEFAULT_TIMEZONE): string {
  return format(new TZDate(now, timezone), "yyyy-MM-dd");
}

export interface CareTemplate {
  careType: CareType;
  name: string;
  description: string;
  items: TemplateItem[];
}

export interface CircleSummary {
  id: string;
  caredName: string;
  relation: string;
  careType: CareType;
  timezone: string;
  closedAt: string | null;
}

export type CircleErrorCode =
  | "validation_failed"
  | "forbidden"
  | "unavailable"
  | "internal";

const createCircleSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  caredName: z.string().trim().min(1).max(60),
  relation: z.string().trim().min(1).max(40),
  careType: z.enum(Constants.public.Enums.care_type),
  /** Cuánto demoró la bienvenida, si se midió. */
  durationMs: z.number().int().min(0).max(86_400_000).optional(),
});

function parseItems(items: unknown): TemplateItem[] {
  if (!Array.isArray(items)) {
    return [];
  }
  // Un ítem mal formado (por una edición en el panel) se omite, no rompe la bienvenida.
  return items.flatMap((item) => {
    const parsed = templateItemSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Plantillas en el orden de los tipos de cuidado. */
export async function listCareTemplates(
  client: Client,
): Promise<CareTemplate[]> {
  const { data } = await client
    .from("care_templates")
    .select("care_type, name, description, items");
  const order = Constants.public.Enums.care_type;
  return (data ?? [])
    .map((row) => ({
      careType: row.care_type,
      name: row.name,
      description: row.description,
      items: parseItems(row.items),
    }))
    .sort((a, b) => order.indexOf(a.careType) - order.indexOf(b.careType));
}

/**
 * Crea el círculo de una persona cuidada y carga los recordatorios de su plantilla.
 * La RPC `create_circle` exige los consentimientos obligatorios.
 */
export async function createCircleWithTemplate(
  client: Client,
  userId: string,
  input: unknown,
  now: Date = new Date(),
): Promise<
  Result<{ circleId: string; templateItems: number }, CircleErrorCode>
> {
  const parsed = createCircleSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      "validation_failed",
      "Revisa los datos: falta algo o hay un texto muy largo.",
    );
  }
  const { displayName, caredName, relation, careType, durationMs } =
    parsed.data;

  const created = await client.rpc("create_circle", {
    p_cared_name: caredName,
    p_relation: relation,
    p_care_type: careType,
    p_display_name: displayName,
  });
  if (created.error || !created.data) {
    if (created.error?.message === "consent_required") {
      return fail(
        "forbidden",
        "Antes de seguir necesitamos tus permisos para guardar datos del cuidado.",
      );
    }
    return fail(
      "internal",
      "No pudimos guardar. Prueba de nuevo en un momento.",
    );
  }
  const circleId = created.data;

  const template = await client
    .from("care_templates")
    .select("items")
    .eq("care_type", careType)
    .maybeSingle();
  const items = parseItems(template.data?.items);

  let templateItems = 0;
  if (items.length > 0) {
    const startDate = localDate(now);
    const inserted = await client.from("reminders").insert(
      items.map((item) => ({
        circle_id: circleId,
        created_by: userId,
        kind: item.kind,
        importance: item.importance,
        title: item.title,
        rule: { ...item.rule, startDate },
        advance_days: item.advanceDays,
        visible_to_cared: item.visibleToCared,
        source: "template",
      })),
    );
    // Si la plantilla no cargó, el círculo igual existe: la persona puede
    // agregar sus recordatorios a mano en vez de quedar atrapada en la bienvenida.
    templateItems = inserted.error ? 0 : items.length;
  }

  await client
    .from("profiles")
    .update({
      display_name: displayName,
      onboarding_completed_at: now.toISOString(),
    })
    .eq("id", userId);

  await track(client, userId, "flow.completed", {
    flow: "onboarding",
    duration_ms: durationMs ?? 0,
  });
  await track(client, userId, "onboarding.completed", {
    care_type: careType,
    template_items: templateItems,
  });

  return ok({ circleId, templateItems });
}

/** Círculos de la usuaria (RLS deja ver solo los suyos), del más antiguo al más nuevo. */
export async function listMyCircles(client: Client): Promise<CircleSummary[]> {
  const { data } = await client
    .from("circles")
    .select("id, cared_name, relation, care_type, timezone, closed_at")
    .order("created_at", { ascending: true })
    .limit(50);
  return (data ?? []).map((row) => ({
    id: row.id,
    caredName: row.cared_name,
    relation: row.relation,
    careType: row.care_type,
    timezone: row.timezone,
    closedAt: row.closed_at,
  }));
}

/**
 * Círculo con el que se trabaja: el pedido en la URL (`?c=`) si la usuaria es
 * miembro; si no, el primero abierto, o el primero a secas. Null si no tiene ninguno.
 */
export async function resolveActiveCircle(
  client: Client,
  requestedId?: string | null,
): Promise<CircleSummary | null> {
  const circles = await listMyCircles(client);
  return (
    circles.find((circle) => circle.id === requestedId) ??
    circles.find((circle) => circle.closedAt === null) ??
    circles[0] ??
    null
  );
}
