import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/server/admin/guard";
import { getSessionUserId } from "@/server/auth/session";
import { signOut } from "../(auth)/entrar/actions";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel de Sole" },
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { href: "/admin", label: "Métricas" },
  { href: "/admin/organizaciones", label: "Organizaciones" },
  { href: "/admin/contenido", label: "Contenido" },
  { href: "/admin/comentarios", label: "Comentarios" },
  { href: "/admin/limites", label: "Límites" },
];

/**
 * Marco del panel del fundador.
 *  - Sin sesión → a entrar.
 *  - Sin rol de administrador → 404, como si el panel no existiera.
 *
 * OJO: un layout no se vuelve a ejecutar al navegar entre sus páginas, así que
 * NO es la barrera de seguridad. Cada página del panel llama a `adminPage()`
 * (./access.ts), que exige rol y segundo factor en cada petición; y debajo,
 * RLS lo vuelve a exigir en cada consulta.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar?next=/admin");
  }
  const check = await requireAdmin(supabase);
  if (!check.ok && check.reason === "not_admin") {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-3 border-b border-border pb-4">
        <p className="text-xl font-bold">Sole · Panel del fundador</p>
        {check.ok ? (
          <nav aria-label="Secciones del panel">
            <ul className="flex flex-wrap gap-2">
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    className="inline-flex min-h-12 items-center rounded-control border-2 border-border-strong bg-background px-4 text-lg font-bold text-fg no-underline hover:bg-surface"
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <form action={signOut}>
          <SubmitButton variant="ghost">Salir</SubmitButton>
        </form>
      </header>
      <main id="contenido" className="flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
