"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Reemplaza el layout raíz, así que trae su propio <html>. Nunca muestra
// error.message ni la traza.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es-CL">
      <body className="bg-background text-fg">
        <main
          id="contenido"
          className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 px-4 py-8"
        >
          <p className="text-xl font-bold text-primary">Sole</p>
          <h1 className="text-3xl font-bold leading-tight">
            Algo salió mal. Ya nos llegó el aviso.
          </h1>
          <div>
            <Button onClick={reset}>Intentar de nuevo</Button>
          </div>
        </main>
      </body>
    </html>
  );
}
