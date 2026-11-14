import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Mientras la acción está en curso: deshabilita y lo anuncia con aria-busy. */
  pending?: boolean;
}

const base =
  "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-control border-2 px-5 py-2 text-lg font-bold transition-opacity duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover",
  secondary: "border-border-strong bg-background text-fg hover:bg-surface",
  danger: "border-danger bg-danger-bg text-danger hover:bg-surface",
  ghost:
    "border-transparent bg-transparent text-primary underline hover:bg-surface",
};

export function Button({
  variant = "primary",
  pending = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[base, variants[variant], className].filter(Boolean).join(" ")}
      disabled={disabled || pending}
      aria-busy={pending ? "true" : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
