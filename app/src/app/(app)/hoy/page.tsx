import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { InstallGuide } from "@/components/onboarding/install-guide";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionProfile, getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";

export const metadata: Metadata = { title: "Hoy" };

// Versión mínima de "Hoy": saludo y, recién llegada, la guía de instalación.
// El paso 25 la reemplaza por el día completo.
export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const params = await searchParams;
  const requested = typeof params.c === "string" ? params.c : null;
  const [profile, circle] = await Promise.all([
    getSessionProfile(supabase, userId),
    resolveActiveCircle(supabase, requested),
  ]);
  if (!circle) {
    redirect("/bienvenida");
  }
  const justArrived = params.bienvenida === "1";

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">
        Hola{profile?.displayName ? `, ${profile.displayName}` : ""}
      </h1>
      <p className="text-xl">
        Hoy acompañas a <strong>{circle.caredName}</strong>.
      </p>
      {justArrived ? (
        <>
          <p
            role="status"
            className="rounded-card border border-success bg-success-bg p-4 text-success"
          >
            Listo, ya quedó todo guardado. Bienvenida a Sole.
          </p>
          <InstallGuide />
        </>
      ) : null}
      <p className="text-fg-muted">
        Aquí vas a ver lo pendiente de cada día. Lo estamos terminando de
        construir.
      </p>
    </>
  );
}
