import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 px-4 py-8"
    >
      <p className="text-xl font-bold text-primary">Sole</p>
      <h1 className="text-3xl font-bold leading-tight">
        No encontramos esta página.
      </h1>
      <div>
        <Link
          href="/hoy"
          className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline"
        >
          Ir a Hoy
        </Link>
      </div>
    </main>
  );
}
