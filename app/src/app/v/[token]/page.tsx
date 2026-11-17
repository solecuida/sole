import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaredItems } from "@/components/cared/cared-items";
import { EmergencyButton } from "@/components/cared/emergency-button";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveLink, visibleToday } from "@/server/cared-link/links";

// Sin nada personal en el título, y fuera de los buscadores.
export const metadata: Metadata = {
  title: { absolute: "Sole" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Vista pública de la persona cuidada. No hay sesión: el enlace es la credencial.
// Un enlace que no sirve (inexistente, revocado o vencido) responde 404 igual.
export default async function CaredPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  const link = await resolveLink(admin, token, new Date());
  if (!link) {
    notFound();
  }
  const items = await visibleToday(admin, link.circleId, new Date());

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 px-5 py-10"
    >
      <h1 className="text-4xl font-bold leading-tight">
        Hola, {link.caredName}
      </h1>

      <section aria-labelledby="hoy-titulo" className="flex flex-col gap-6">
        <h2 id="hoy-titulo" className="text-3xl font-bold">
          Para hoy
        </h2>
        {items.length === 0 ? (
          <p className="text-3xl leading-snug">
            Hoy no hay nada anotado para ti.
          </p>
        ) : (
          <CaredItems token={token} items={items} />
        )}
      </section>

      <EmergencyButton token={token} />

      <p className="text-xl text-fg-muted">
        Sole no reemplaza a un servicio de emergencia y no puede garantizar que
        un aviso llegue.
      </p>
    </main>
  );
}
