import Link from "next/link";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Portada de la app: la única página indexable. No lee datos.
export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { org } = await searchParams;
  const validOrg =
    typeof org === "string" && /^[A-Za-z0-9-]{3,32}$/.test(org) ? org : null;
  const loginHref = validOrg ? `/entrar?org=${validOrg}` : "/entrar";

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 px-4 py-12"
    >
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-card bg-primary text-4xl font-bold text-primary-fg"
      >
        S
      </div>
      <h1 className="text-4xl font-bold leading-tight">Sole</h1>
      <div className="flex flex-col gap-3 text-xl">
        <p>Sole te acompaña en el día a día de cuidar a otra persona.</p>
        <p>
          Te recuerda los remedios, los controles y los trámites, y te deja
          anotar cómo estuvo el día en unos segundos.
        </p>
        <p>
          También te pregunta cómo estás tú. Es gratis, sin publicidad y está
          hecha en Chile.
        </p>
      </div>
      <Link
        href={loginHref}
        className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-primary bg-primary px-5 py-2 text-lg font-bold text-primary-fg no-underline hover:border-primary-hover hover:bg-primary-hover"
      >
        Entrar
      </Link>
      <p className="text-base text-fg-muted">
        Sole es un piloto. Conoce el proyecto en{" "}
        <a href="https://solecuida.com">solecuida.com</a>.
      </p>
    </main>
  );
}
