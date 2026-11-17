import type { ReactNode } from "react";
import { SubmitButton } from "@/components/ui/submit-button";

export interface RestoreAccountProps {
  /** Fecha en palabras del borrado definitivo: "21 de noviembre de 2026". */
  purgeDate: string;
  restore: () => Promise<void>;
  /** Botón para salir manteniendo el borrado (lo arma el layout). */
  keep: ReactNode;
}

/** Lo único que ve quien pidió borrar su cuenta y vuelve a entrar dentro del plazo. */
export function RestoreAccount({
  purgeDate,
  restore,
  keep,
}: RestoreAccountProps) {
  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 px-4 py-10"
    >
      <p className="text-xl font-bold text-primary">Sole</p>
      <h1 className="text-3xl font-bold leading-tight">
        Pediste borrar tu cuenta
      </h1>
      <p className="text-xl">
        Se borrará definitivamente el <strong>{purgeDate}</strong>.
      </p>
      <p className="text-fg-muted">
        Mientras tanto no te llega ningún aviso. Si cambiaste de idea, puedes
        recuperarla y todo vuelve a estar como lo dejaste.
      </p>
      <form action={restore}>
        <SubmitButton className="w-full">Recuperar mi cuenta</SubmitButton>
      </form>
      {keep}
    </main>
  );
}
