"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Botón de envío que se marca ocupado mientras corre la acción de su formulario. */
export function SubmitButton({
  children,
  ...rest
}: Omit<ButtonProps, "type" | "pending">) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" pending={pending} {...rest}>
      {children}
    </Button>
  );
}
