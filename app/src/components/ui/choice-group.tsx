"use client";

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface ChoiceGroupProps {
  /** Nombre del campo en el formulario. */
  name: string;
  legend: string;
  options: ChoiceOption[];
  /** `true`: casillas (varias respuestas). Por defecto: una sola respuesta. */
  multiple?: boolean;
  /** Valores marcados. Con una sola respuesta, un arreglo de 0 o 1 elemento. */
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
  error?: string;
  required?: boolean;
}

export function ChoiceGroup({
  name,
  legend,
  options,
  multiple = false,
  value,
  onChange,
  hint,
  error,
  required = false,
}: ChoiceGroupProps) {
  const hintId = hint ? `${name}-pista` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  function toggle(optionValue: string, checked: boolean) {
    if (!multiple) {
      onChange([optionValue]);
      return;
    }
    onChange(
      checked
        ? [...value.filter((item) => item !== optionValue), optionValue]
        : value.filter((item) => item !== optionValue),
    );
  }

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-describedby={describedBy}
      aria-invalid={error ? "true" : undefined}
    >
      <legend className="mb-2 text-lg font-bold">{legend}</legend>
      {hint ? (
        <p id={hintId} className="text-base text-fg-muted">
          {hint}
        </p>
      ) : null}
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border-2 border-border-strong bg-background px-4 py-2 text-lg has-[:checked]:border-primary has-[:checked]:bg-surface has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
          >
            <input
              id={id}
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={(event) => toggle(option.value, event.target.checked)}
              required={required && !multiple}
              className="size-6 shrink-0 accent-primary"
            />
            <span className="flex flex-col">
              <span>{option.label}</span>
              {option.description ? (
                <span className="text-base text-fg-muted">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-base font-bold text-danger"
        >
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
