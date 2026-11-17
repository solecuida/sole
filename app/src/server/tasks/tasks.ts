import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { fail, ok, type Result } from "@/lib/result";
import type { Database } from "@/lib/supabase/database.types";
import { DEFAULT_TIMEZONE } from "@/server/circles/circles";
import { FAMILY_ENABLED } from "@/server/fake-doors/doors";
import { localDateOf } from "@/server/reminders/recurrence";

type Client = SupabaseClient<Database>;
type Row = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskErrorCode =
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "internal";

export interface TaskView {
  id: string;
  title: string;
  /** Día local `YYYY-MM-DD`, o null si la tarea no tiene fecha. */
  scheduledFor: string | null;
  doneAt: string | null;
}

/** Lo que `getToday` necesita de cada tarea de hoy. */
export type TodayTask = Pick<TaskView, "id" | "title">;

export interface TaskLists {
  /** Pendientes con fecha de hoy (o de un día anterior que quedó sin hacer). */
  today: TaskView[];
  /** Pendientes sin fecha. */
  undated: TaskView[];
  /** Las últimas hechas, la más reciente primero. */
  done: TaskView[];
}

const MESSAGES = {
  validation: "Escribe la tarea con hasta 120 letras.",
  forbidden: "Solo quien cuida puede cambiar las tareas.",
  notFound: "No encontramos esa tarea.",
  internal: "No pudimos guardar. Prueba de nuevo en un momento.",
} as const;

const DONE_LIMIT = 20;
const OPEN_LIMIT = 200;
const COLUMNS = "id, title, scheduled_for, done_at";

const titleSchema = z.string().trim().min(1).max(120);

function toView(
  row: Pick<Row, "id" | "title" | "scheduled_for" | "done_at">,
): TaskView {
  return {
    id: row.id,
    title: row.title,
    scheduledFor: row.scheduled_for,
    doneAt: row.done_at,
  };
}

function fromPostgres(error: { code?: string }): Result<never, TaskErrorCode> {
  return error.code === "42501"
    ? fail("forbidden", MESSAGES.forbidden)
    : fail("internal", MESSAGES.internal);
}

/**
 * Un cambio que no tocó filas: si la tarea se ve, la usuaria es familiar (RLS
 * no le deja cambiarla); si no se ve, no existe o no es de su círculo.
 */
async function noRowsResult(
  client: Client,
  taskId: string,
): Promise<Result<never, TaskErrorCode>> {
  const found = await client
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .maybeSingle();
  if (found.error) {
    return fromPostgres(found.error);
  }
  return found.data
    ? fail("forbidden", MESSAGES.forbidden)
    : fail("not_found", MESSAGES.notFound);
}

/** Agrega una tarea sin fecha al círculo. Solo quien cuida. */
export async function addTask(
  client: Client,
  userId: string,
  circleId: string,
  title: unknown,
): Promise<Result<{ id: string }, TaskErrorCode>> {
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success || !z.uuid().safeParse(circleId).success) {
    return fail("validation_failed", MESSAGES.validation);
  }
  const { data, error } = await client
    .from("tasks")
    .insert({ circle_id: circleId, title: parsed.data, created_by: userId })
    .select("id")
    .single();
  if (error || !data) {
    return fromPostgres(error ?? {});
  }
  return ok({ id: data.id });
}

/** Pone la tarea en el día de hoy del círculo (`America/Santiago` por defecto). */
export async function moveToToday(
  client: Client,
  taskId: string,
  now: Date,
  timezone: string = DEFAULT_TIMEZONE,
): Promise<Result<{ scheduledFor: string }, TaskErrorCode>> {
  if (!z.uuid().safeParse(taskId).success) {
    return fail("not_found", MESSAGES.notFound);
  }
  const scheduledFor = localDateOf(now, timezone);
  const { data, error } = await client
    .from("tasks")
    .update({ scheduled_for: scheduledFor })
    .eq("id", taskId)
    .select("id");
  if (error) {
    return fromPostgres(error);
  }
  if (!data || data.length === 0) {
    return noRowsResult(client, taskId);
  }
  return ok({ scheduledFor });
}

/** Marca la tarea como hecha, con la hora y quién la hizo. */
export async function completeTask(
  client: Client,
  userId: string,
  taskId: string,
  now: Date,
): Promise<Result<undefined, TaskErrorCode>> {
  if (!z.uuid().safeParse(taskId).success) {
    return fail("not_found", MESSAGES.notFound);
  }
  const { data, error } = await client
    .from("tasks")
    .update({ done_at: now.toISOString(), done_by: userId })
    .eq("id", taskId)
    .select("id");
  if (error) {
    return fromPostgres(error);
  }
  if (!data || data.length === 0) {
    return noRowsResult(client, taskId);
  }
  return ok();
}

/** Borra la tarea. */
export async function removeTask(
  client: Client,
  taskId: string,
): Promise<Result<undefined, TaskErrorCode>> {
  if (!z.uuid().safeParse(taskId).success) {
    return fail("not_found", MESSAGES.notFound);
  }
  const { data, error } = await client
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .select("id");
  if (error) {
    return fromPostgres(error);
  }
  if (!data || data.length === 0) {
    return noRowsResult(client, taskId);
  }
  return ok();
}

/**
 * Tareas pendientes de hoy, para el grupo `whenever` de "Hoy". Incluye las de
 * días anteriores que quedaron sin hacer, para que no desaparezcan.
 * `today` es el día local `YYYY-MM-DD`.
 */
export async function todayTasks(
  client: Client,
  circleId: string,
  today: string,
): Promise<TodayTask[]> {
  const { data } = await client
    .from("tasks")
    .select(COLUMNS)
    .eq("circle_id", circleId)
    .is("done_at", null)
    .lte("scheduled_for", today)
    .order("created_at", { ascending: true })
    .limit(OPEN_LIMIT);
  return (data ?? []).map((row) => ({ id: row.id, title: row.title }));
}

/** Las tres listas de la pantalla de tareas. `today` es el día local. */
export async function listTasks(
  client: Client,
  circleId: string,
  today: string,
): Promise<TaskLists> {
  const open = () =>
    client
      .from("tasks")
      .select(COLUMNS)
      .eq("circle_id", circleId)
      .is("done_at", null)
      .order("created_at", { ascending: true })
      .limit(OPEN_LIMIT);
  const [dated, undated, done] = await Promise.all([
    open().lte("scheduled_for", today),
    open().is("scheduled_for", null),
    client
      .from("tasks")
      .select(COLUMNS)
      .eq("circle_id", circleId)
      .not("done_at", "is", null)
      .order("done_at", { ascending: false })
      .limit(DONE_LIMIT),
  ]);
  return {
    today: (dated.data ?? []).map(toView),
    undated: (undated.data ?? []).map(toView),
    done: (done.data ?? []).map(toView),
  };
}

/** Rol de la usuaria en el círculo, o null si no es miembro. */
export async function memberRole(
  client: Client,
  userId: string,
  circleId: string,
): Promise<"caregiver" | "family" | null> {
  const { data } = await client
    .from("circle_members")
    .select("role")
    .eq("circle_id", circleId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "caregiver" || data?.role === "family"
    ? data.role
    : null;
}

/**
 * A dónde lleva "Pedir ayuda con esto". Mientras no exista la invitación a
 * familiares, va a la puerta; después, al círculo con la tarea elegida.
 */
export function helpLinkFor(
  taskId: string,
  familyEnabled: boolean = FAMILY_ENABLED,
): string {
  return familyEnabled
    ? `/circulo?pedir=${encodeURIComponent(taskId)}`
    : "/pronto/invitar-familiar";
}
