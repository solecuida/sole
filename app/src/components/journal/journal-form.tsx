"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Field } from "@/components/ui/field";
import { DAY_OPTIONS, LEVEL_OPTIONS, MOOD_OPTIONS } from "@/lib/journal/labels";

export interface JournalFormValues {
  dayRating: string | null;
  moods: string[];
  sleep: string | null;
  food: string | null;
  note: string;
}

export interface JournalFormProps {
  caredName: string;
  initialValues?: JournalFormValues;
  save: (input: {
    dayRating: string;
    moods: string[];
    sleep?: string;
    food?: string;
    note?: string;
    durationMs: number;
  }) => Promise<{ ok: boolean; message?: string }>;
}

const EMPTY: JournalFormValues = {
  dayRating: null,
  moods: [],
  sleep: null,
  food: null,
  note: "",
};

export function JournalForm({
  caredName,
  initialValues = EMPTY,
  save,
}: JournalFormProps) {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const [dayRating, setDayRating] = useState(initialValues.dayRating);
  const [moods, setMoods] = useState(initialValues.moods);
  const [sleep, setSleep] = useState(initialValues.sleep);
  const [food, setFood] = useState(initialValues.food);
  const [note, setNote] = useState(initialValues.note);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    if (!dayRating) {
      setError("Elige cómo fue el día.");
      return;
    }
    setError(null);
    setPending(true);
    const result = await save({
      dayRating,
      moods,
      sleep: sleep ?? undefined,
      food: food ?? undefined,
      note: note.trim() || undefined,
      durationMs: Math.max(0, Date.now() - startedAt.current),
    });
    setPending(false);
    if (result.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(result.message ?? "No pudimos guardar. Prueba de nuevo.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <ChoiceGroup
        name="dayRating"
        legend="¿Cómo fue el día?"
        options={DAY_OPTIONS}
        value={dayRating ? [dayRating] : []}
        onChange={([value]) => setDayRating(value)}
      />
      <ChoiceGroup
        name="moods"
        legend={`¿Cómo estuvo ${caredName}?`}
        hint="Puedes elegir varias."
        multiple
        options={MOOD_OPTIONS}
        value={moods}
        onChange={setMoods}
      />
      <ChoiceGroup
        name="sleep"
        legend="Sueño"
        options={LEVEL_OPTIONS}
        value={sleep ? [sleep] : []}
        onChange={([value]) => setSleep(value)}
      />
      <ChoiceGroup
        name="food"
        legend="Comida"
        options={LEVEL_OPTIONS}
        value={food ? [food] : []}
        onChange={([value]) => setFood(value)}
      />
      <Field
        as="textarea"
        id="note"
        label="Una nota (opcional)"
        hint="Puedes dictar con el micrófono del teclado"
        maxLength={1000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" pending={pending}>
        Guardar
      </Button>
      <p aria-live="polite" className="min-h-6 text-lg font-bold text-success">
        {saved ? "Guardado." : ""}
      </p>
    </form>
  );
}
