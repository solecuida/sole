"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { RepeatFields } from "@/components/reminders/repeat-fields";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Field } from "@/components/ui/field";
import {
  type ReminderFormValues,
  reminderFormSchema,
  toReminderInput,
} from "@/lib/reminders/form";
import {
  IMPORTANCE_LABELS,
  KIND_LABELS,
  KINDS_WITH_ADVANCE,
} from "@/lib/reminders/labels";
import type { Result } from "@/lib/result";

type ActionResult = Result<{ id: string }, string>;

export interface ReminderFormProps {
  circleId: string;
  caredName: string;
  /** Presente al editar. */
  reminderId?: string;
  initialValues: ReminderFormValues;
  save: (request: {
    circleId: string;
    reminderId?: string;
    data: unknown;
    durationMs?: number;
  }) => Promise<ActionResult>;
  remove: (reminderId: string) => Promise<ActionResult>;
}

const ADVANCE_OPTIONS = [
  { value: "3", label: "3 días antes" },
  { value: "1", label: "El día anterior" },
  { value: "0", label: "El mismo día" },
];

export function ReminderForm({
  circleId,
  caredName,
  reminderId,
  initialValues,
  save,
  remove,
}: ReminderFormProps) {
  const router = useRouter();
  const startedAt = useRef(Date.now());
  const [serverError, setServerError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: initialValues,
  });
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const kind = useWatch({ control, name: "kind" });
  const importance = useWatch({ control, name: "importance" });
  const advance = useWatch({ control, name: "advance" });
  const back = `/recordatorios?c=${circleId}`;

  async function finish(result: ActionResult) {
    if (result.ok) {
      router.push(back);
      router.refresh();
      return;
    }
    setServerError(result.error.message);
  }

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    await finish(
      await save({
        circleId,
        reminderId,
        data: toReminderInput(values),
        durationMs: Date.now() - startedAt.current,
      }),
    );
  });

  async function onRemove() {
    if (!reminderId) {
      return;
    }
    setRemoving(true);
    setServerError(null);
    await finish(await remove(reminderId));
    setRemoving(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {serverError ? (
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {serverError}
        </p>
      ) : null}

      <Field as="select" id="kind" label="¿Qué es?" {...register("kind")}>
        {Object.entries(KIND_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Field>

      <Field
        id="title"
        label="Título"
        hint="Es lo que vas a ver en el aviso. Por ejemplo: «Medicamento de la mañana»."
        maxLength={120}
        error={errors.title?.message}
        {...register("title")}
      />

      {kind === "medication" ? (
        <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4">
          <legend className="px-1 text-lg font-bold">
            Sobre el medicamento (opcional)
          </legend>
          <p className="text-base text-fg-muted">
            Sin catálogo de fármacos ni dosis: escribe lo que diga la receta.
            Esto no aparece en los avisos; solo lo ves dentro de Sole.
          </p>
          <Field
            id="medName"
            label="Nombre del medicamento"
            maxLength={120}
            error={errors.medName?.message}
            {...register("medName")}
          />
          <Field
            id="medInstructions"
            label="Indicación"
            hint="Por ejemplo: «1 pastilla con comida»."
            maxLength={300}
            error={errors.medInstructions?.message}
            {...register("medInstructions")}
          />
        </fieldset>
      ) : null}

      <ChoiceGroup
        name="importance"
        legend="¿Qué tan importante es?"
        options={Object.entries(IMPORTANCE_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        value={[importance]}
        onChange={([value]) =>
          setValue("importance", value as ReminderFormValues["importance"])
        }
      />

      <RepeatFields form={form} />

      {KINDS_WITH_ADVANCE.includes(kind) ? (
        <ChoiceGroup
          name="advance"
          legend="¿Cuándo te avisamos antes?"
          hint="El aviso previo llega a las 9 de la mañana."
          multiple
          options={ADVANCE_OPTIONS}
          value={advance}
          onChange={(value) => setValue("advance", value)}
        />
      ) : null}

      <label
        htmlFor="visibleToCared"
        className="flex min-h-12 cursor-pointer items-start gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-3 text-lg has-[:checked]:border-primary"
      >
        <input
          id="visibleToCared"
          type="checkbox"
          className="mt-1 size-6 shrink-0 accent-primary"
          {...register("visibleToCared")}
        />
        <span>
          Visible para {caredName}
          <span className="block text-base text-fg-muted">
            Solo sirve si {caredName} usa su propia vista de Sole.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3">
        <Button type="submit" pending={isSubmitting}>
          Guardar
        </Button>
        <Button variant="ghost" onClick={() => router.push(back)}>
          Volver sin guardar
        </Button>
        {reminderId ? (
          <Button variant="danger" pending={removing} onClick={onRemove}>
            Quitar este recordatorio
          </Button>
        ) : null}
      </div>
    </form>
  );
}
