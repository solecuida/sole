import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TaskItem } from "@/components/tasks/task-item";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatLongDate } from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { listMyCircles, resolveActiveCircle } from "@/server/circles/circles";
import { localDateOf } from "@/server/reminders/recurrence";
import {
  addTask,
  completeTask,
  helpLinkFor,
  listTasks,
  memberRole,
  moveToToday,
  removeTask,
  type TaskView,
} from "@/server/tasks/tasks";

export const metadata: Metadata = { title: "Tareas" };

type ActionOutcome = { ok: boolean; message?: string };

const SESSION_ENDED: ActionOutcome = {
  ok: false,
  message: "Tu sesión terminó. Vuelve a entrar.",
};

/** Sesión y círculo de una acción: vuelve a comprobar la pertenencia. */
async function actionContext(circleId: string) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return null;
  }
  const circle = (await listMyCircles(supabase)).find(
    (item) => item.id === circleId,
  );
  return circle ? { supabase, userId, circle } : null;
}

async function createTask(circleId: string, formData: FormData): Promise<void> {
  "use server";
  const context = await actionContext(circleId);
  if (!context) {
    redirect("/entrar");
  }
  const result = await addTask(
    context.supabase,
    context.userId,
    circleId,
    formData.get("title"),
  );
  revalidatePath("/tareas");
  redirect(result.ok ? "/tareas" : `/tareas?error=${result.error.code}`);
}

async function moveAction(
  circleId: string,
  taskId: string,
): Promise<ActionOutcome> {
  "use server";
  const context = await actionContext(circleId);
  if (!context) {
    return SESSION_ENDED;
  }
  const result = await moveToToday(
    context.supabase,
    taskId,
    new Date(),
    context.circle.timezone,
  );
  revalidatePath("/tareas");
  revalidatePath("/hoy");
  return result.ok
    ? { ok: true }
    : { ok: false, message: result.error.message };
}

async function completeAction(
  circleId: string,
  taskId: string,
): Promise<ActionOutcome> {
  "use server";
  const context = await actionContext(circleId);
  if (!context) {
    return SESSION_ENDED;
  }
  const result = await completeTask(
    context.supabase,
    context.userId,
    taskId,
    new Date(),
  );
  revalidatePath("/tareas");
  revalidatePath("/hoy");
  return result.ok
    ? { ok: true }
    : { ok: false, message: result.error.message };
}

async function removeAction(
  circleId: string,
  taskId: string,
): Promise<ActionOutcome> {
  "use server";
  const context = await actionContext(circleId);
  if (!context) {
    return SESSION_ENDED;
  }
  const result = await removeTask(context.supabase, taskId);
  revalidatePath("/tareas");
  revalidatePath("/hoy");
  return result.ok
    ? { ok: true }
    : { ok: false, message: result.error.message };
}

const ERROR_MESSAGES: Record<string, string> = {
  validation_failed: "Escribe la tarea con hasta 120 letras.",
  forbidden: "Solo quien cuida puede agregar tareas.",
};

export default async function TasksPage({
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
  const requested = typeof params.c === "string" ? params.c : null;
  const circle = await resolveActiveCircle(supabase, requested);
  if (!circle) {
    redirect("/bienvenida");
  }
  const today = localDateOf(new Date(), circle.timezone);
  const [lists, role] = await Promise.all([
    listTasks(supabase, circle.id, today),
    memberRole(supabase, userId, circle.id),
  ]);
  const canEdit = role === "caregiver";
  const errorMessage =
    typeof params.error === "string"
      ? (ERROR_MESSAGES[params.error] ?? "No pudimos guardar. Prueba de nuevo.")
      : null;

  const renderList = (tasks: TaskView[], done: boolean) => (
    <ul className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={{
            id: task.id,
            title: task.title,
            scheduled: task.scheduledFor !== null,
            done,
          }}
          helpHref={helpLinkFor(task.id)}
          canEdit={canEdit}
          onMoveToToday={moveAction.bind(null, circle.id)}
          onComplete={completeAction.bind(null, circle.id)}
          onRemove={removeAction.bind(null, circle.id)}
        />
      ))}
    </ul>
  );

  return (
    <>
      <h1 className="text-3xl font-bold">Tareas</h1>
      <p className="text-fg-muted">
        Lo que hay que hacer por {circle.caredName}, aunque no tenga fecha.
      </p>

      {canEdit ? (
        <form
          action={createTask.bind(null, circle.id)}
          className="flex flex-col gap-4"
        >
          {errorMessage ? (
            <p
              role="alert"
              className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
            >
              {errorMessage}
            </p>
          ) : null}
          <Field
            id="title"
            name="title"
            label="Agregar tarea"
            hint="Por ejemplo: comprar pañales."
            maxLength={120}
            required
            autoComplete="off"
          />
          <SubmitButton>Agregar</SubmitButton>
        </form>
      ) : (
        <p className="rounded-card border border-border bg-surface p-4">
          Como familiar puedes ver las tareas. Solo quien cuida las cambia.
        </p>
      )}

      <section
        aria-labelledby="para-hoy-titulo"
        className="flex flex-col gap-4"
      >
        <h2 id="para-hoy-titulo" className="text-2xl font-bold">
          Para hoy
        </h2>
        <p className="text-fg-muted">{formatLongDate(today)}</p>
        {lists.today.length === 0 ? (
          <p>No hay tareas para hoy.</p>
        ) : (
          renderList(lists.today, false)
        )}
      </section>

      <section
        aria-labelledby="sin-fecha-titulo"
        className="flex flex-col gap-4"
      >
        <h2 id="sin-fecha-titulo" className="text-2xl font-bold">
          Sin fecha
        </h2>
        {lists.undated.length === 0 ? (
          <p>No hay tareas sin fecha.</p>
        ) : (
          renderList(lists.undated, false)
        )}
      </section>

      <section aria-labelledby="hechas-titulo" className="flex flex-col gap-4">
        <h2 id="hechas-titulo" className="text-2xl font-bold">
          Hechas
        </h2>
        {lists.done.length === 0 ? (
          <p>Aún no hay tareas hechas.</p>
        ) : (
          renderList(lists.done, true)
        )}
      </section>
    </>
  );
}
