import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { QuickNav, TopBar } from "@/components/app/main-nav";
import { SubmitButton } from "@/components/ui/submit-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSessionProfile,
  getSessionUserId,
  hasAnyCircle,
  touchLastActive,
} from "@/server/auth/session";
import {
  getConsentState,
  hasRequiredConsents,
} from "@/server/consents/consents";
import { signOut } from "../(auth)/entrar/actions";

export const metadata: Metadata = { robots: { index: false } };

// Toda la app con sesión: exige sesión, consentimientos obligatorios y al menos
// un círculo. El proxy ya filtró a quien no tiene sesión; aquí se vuelve a comprobar.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  if (!hasRequiredConsents(await getConsentState(supabase, userId))) {
    redirect("/bienvenida/consentimientos");
  }
  if (!(await hasAnyCircle(supabase))) {
    redirect("/bienvenida");
  }

  const profile = await getSessionProfile(supabase, userId);
  if (profile) {
    await touchLastActive(supabase, userId, profile.lastActiveAt, new Date());
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        signOut={
          <form action={signOut}>
            <SubmitButton variant="secondary" className="w-full">
              Salir
            </SubmitButton>
          </form>
        }
      />
      <main
        id="contenido"
        className="mx-auto flex w-full max-w-content flex-1 flex-col gap-6 px-4 py-6"
      >
        {children}
      </main>
      <QuickNav />
    </div>
  );
}
