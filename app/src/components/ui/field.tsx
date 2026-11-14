import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldBase {
  /** Único en la página: une la etiqueta, la pista y el error con el control. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
}

type InputField = FieldBase & { as?: "input" } & Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id"
  >;
type TextareaField = FieldBase & { as: "textarea" } & Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id"
  >;
type SelectField = FieldBase & { as: "select"; children: ReactNode } & Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "id"
  >;

export type FieldProps = InputField | TextareaField | SelectField;

const controlClass =
  "min-h-12 w-full rounded-control border-2 border-border-strong bg-background px-3 py-2 text-lg text-fg placeholder:text-fg-subtle aria-[invalid=true]:border-danger";

export function Field(props: FieldProps) {
  const { id, label, hint, error } = props;
  const hintId = hint ? `${id}-pista` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  const a11y = {
    id,
    "aria-invalid": error ? ("true" as const) : undefined,
    "aria-describedby": describedBy,
  };

  let control: ReactNode;
  if (props.as === "textarea") {
    const {
      as: _as,
      label: _l,
      hint: _h,
      error: _e,
      className,
      ...rest
    } = props;
    control = (
      <textarea
        rows={4}
        {...rest}
        {...a11y}
        className={[controlClass, className].filter(Boolean).join(" ")}
      />
    );
  } else if (props.as === "select") {
    const {
      as: _as,
      label: _l,
      hint: _h,
      error: _e,
      className,
      children,
      ...rest
    } = props;
    control = (
      <select
        {...rest}
        {...a11y}
        className={[controlClass, className].filter(Boolean).join(" ")}
      >
        {children}
      </select>
    );
  } else {
    const {
      as: _as,
      label: _l,
      hint: _h,
      error: _e,
      className,
      ...rest
    } = props;
    control = (
      <input
        {...rest}
        {...a11y}
        className={[controlClass, className].filter(Boolean).join(" ")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-lg font-bold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="text-base text-fg-muted">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-base font-bold text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
