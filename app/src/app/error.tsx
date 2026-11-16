"use client";

import { Button } from "@/components/ui/button";

// Nunca se muestra error.message ni la traza: Sentry recibe el error ya filtrado.
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
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
  );
}
