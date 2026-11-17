import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";

export const metadata: Metadata = { robots: { index: false } };

// Bienvenida: exige sesión y nada más. Sin navegación, para no distraer.
export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  if (!(await getSessionUserId(supabase))) {
    redirect("/entrar");
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-content flex-col gap-6 px-4 py-8">
      <p className="text-xl font-bold text-primary">Sole</p>
      <main id="contenido" className="flex flex-col gap-6">
        {children}
      </main>
    </div>
  );
}
