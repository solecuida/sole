"use client";

import { type UseFormReturn, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { Field } from "@/components/ui/field";
import {
  FREQUENCIES,
  FREQUENCY_LABELS,
  type ReminderFormValues,
} from "@/lib/reminders/form";
import { MONTH_LABELS, WEEKDAY_LABELS } from "@/lib/reminders/labels";

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Cuándo y a qué hora: repetición, horas y fechas de inicio y término. */
export function RepeatFields({
  form,
}: {
  form: UseFormReturn<ReminderFormValues>;
}) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;
  const freq = useWatch({ control, name: "freq" });
  const weekdays = useWatch({ control, name: "weekdays" });
  const times = useWatch({ control, name: "times" });

  function setTime(index: number, value: string) {
    setValue(
      "times",
      times.map((time, i) => (i === index ? value : time)),
    );
  }

  return (
    <>
      <Field as="select" id="freq" label="¿Cada cuánto?" {...register("freq")}>
        {FREQUENCIES.map((value) => (
          <option key={value} value={value}>
            {FREQUENCY_LABELS[value]}
          </option>
        ))}
      </Field>

      {freq === "once" ? (
        <Field
          id="date"
          type="date"
          label="¿Qué día?"
          error={errors.date?.message}
          {...register("date")}
        />
      ) : null}

      {freq === "weekly" ? (
        <ChoiceGroup
          name="weekdays"
          legend="¿Qué días?"
          multiple
          options={WEEKDAY_LABELS.map((label, index) => ({
            value: String(index + 1),
            label: capitalize(label),
          }))}
          value={weekdays}
          onChange={(value) => setValue("weekdays", value)}
          error={errors.weekdays?.message}
        />
      ) : null}

      {freq === "interval" ? (
        <Field
          id="everyDays"
          type="number"
          inputMode="numeric"
          min={2}
          max={365}
          label="¿Cada cuántos días?"
          error={errors.everyDays?.message}
          {...register("everyDays")}
        />
      ) : null}

      {freq === "monthly" ? (
        <Field
          id="dayOfMonth"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          label="¿Qué día del mes?"
          hint="Si el mes no tiene ese día, te avisamos el último día del mes."
          error={errors.dayOfMonth?.message}
          {...register("dayOfMonth")}
        />
      ) : null}

      {freq === "yearly" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="day"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            label="Día"
            error={errors.day?.message}
            {...register("day")}
          />
          <Field as="select" id="month" label="Mes" {...register("month")}>
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={String(index + 1)}>
                {capitalize(label)}
              </option>
            ))}
          </Field>
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-bold">¿A qué hora?</legend>
        {times.map((time, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: las horas no tienen otra identidad que su posición
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor={`time-${index}`}
                className="mb-2 block text-base text-fg-muted"
              >
                {index === 0 ? "Hora" : `Hora ${index + 1}`}
              </label>
              <input
                id={`time-${index}`}
                type="time"
                value={time}
                onChange={(event) => setTime(index, event.target.value)}
                aria-invalid={errors.times ? "true" : undefined}
                aria-describedby={errors.times ? "times-error" : undefined}
                className="min-h-12 w-full rounded-control border-2 border-border-strong bg-background px-3 py-2 text-lg text-fg aria-[invalid=true]:border-danger"
              />
            </div>
            {times.length > 1 ? (
              <Button
                variant="secondary"
                aria-label={`Quitar la hora ${index + 1}`}
                onClick={() =>
                  setValue(
                    "times",
                    times.filter((_, i) => i !== index),
                  )
                }
              >
                Quitar
              </Button>
            ) : null}
          </div>
        ))}
        {errors.times?.message ? (
          <p
            id="times-error"
            role="alert"
            className="text-base font-bold text-danger"
          >
            {errors.times.message}
          </p>
        ) : null}
        {times.length < 8 ? (
          <Button
            variant="secondary"
            onClick={() => setValue("times", [...times, ""])}
          >
            Agregar otra hora
          </Button>
        ) : null}
      </fieldset>

      <Field
        id="startDate"
        type="date"
        label="Desde qué día"
        error={errors.startDate?.message}
        {...register("startDate")}
      />
      <Field
        id="endDate"
        type="date"
        label="Hasta qué día (opcional)"
        hint="Déjalo en blanco si no tiene término."
        error={errors.endDate?.message}
        {...register("endDate")}
      />
    </>
  );
}
