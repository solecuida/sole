import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { JournalForm } from "@/components/journal/journal-form";
import { DAY_OPTIONS, LEVEL_OPTIONS, MOOD_OPTIONS } from "@/lib/journal/labels";
import { formatLongDate, joinList } from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import {
  listMyCircles,
  localDate,
  resolveActiveCircle,
} from "@/server/circles/circles";
import {
  getEntry,
  type JournalEntryView,
  listEntries,
  saveEntry,
} from "@/server/journal/journal";

export const metadata: Metadata = { title: "Bitácora" };

const labelOf = (
  options: { value: string; label: string }[],
  value: string | null,
) => options.find((option) => option.value === value)?.label ?? null;

/** Guarda la bitácora de hoy. Vuelve a comprobar sesión y pertenencia. */
async function saveJournal(
  circleId: string,
  input: unknown,
): Promise<{ ok: boolean; message?: string }> {
  "use server";
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    return { ok: false, message: "Tu sesión terminó. Vuelve a entrar." };
  }
  const circle = (await listMyCircles(supabase)).find(
    (item) => item.id === circleId,
  );
  if (!circle) {
    return { ok: false, message: "No pudimos guardar. Prueba de nuevo." };
  }
  const result = await saveEntry(
    supabase,
    userId,
    circle.id,
    input,
    new Date(),
    circle.timezone,
  );
  revalidatePath("/bitacora");
  return result.ok
    ? { ok: true }
    : { ok: false, message: result.error.message };
}

function EntryItem({ entry }: { entry: JournalEntryView }) {
  const moods = entry.moods
    .map((mood) => labelOf(MOOD_OPTIONS, mood)?.toLowerCase())
    .filter((label): label is string => Boolean(label));
  return (
    <li className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4">
      <h3 className="text-lg font-bold">{formatLongDate(entry.entryDate)}</h3>
      <p>Día: {labelOf(DAY_OPTIONS, entry.dayRating)}</p>
      {moods.length > 0 ? <p>Ánimo: {joinList(moods)}</p> : null}
      {entry.sleep ? <p>Sueño: {labelOf(LEVEL_OPTIONS, entry.sleep)}</p> : null}
      {entry.food ? <p>Comida: {labelOf(LEVEL_OPTIONS, entry.food)}</p> : null}
      {entry.note ? (
        <p className="whitespace-pre-wrap text-fg-muted">{entry.note}</p>
      ) : null}
    </li>
  );
}

export default async function JournalPage({
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
  const today = localDate(new Date(), circle.timezone);
  const [current, entries] = await Promise.all([
    getEntry(supabase, circle.id, today),
    listEntries(supabase, circle.id, 14),
  ]);
  const save = saveJournal.bind(null, circle.id);

  return (
    <>
      <h1 className="text-3xl font-bold">Bitácora</h1>
      <p className="text-fg-muted">
        Cómo fue el día de {circle.caredName}, en pocos toques.
      </p>
      <section aria-labelledby="hoy-titulo" className="flex flex-col gap-4">
        <h2 id="hoy-titulo" className="text-2xl font-bold">
          Hoy, {formatLongDate(today)}
        </h2>
        <JournalForm
          caredName={circle.caredName}
          save={save}
          initialValues={
            current
              ? {
                  dayRating: current.dayRating,
                  moods: current.moods,
                  sleep: current.sleep,
                  food: current.food,
                  note: current.note ?? "",
                }
              : undefined
          }
        />
      </section>
      <section aria-labelledby="ultimos-titulo" className="flex flex-col gap-4">
        <h2 id="ultimos-titulo" className="text-2xl font-bold">
          Últimos días
        </h2>
        {entries.length === 0 ? (
          <p>Aún no escribes en la bitácora. Hoy puede ser el primer día.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <EntryItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
