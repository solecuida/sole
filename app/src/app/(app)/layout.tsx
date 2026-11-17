import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { RestoreAccount } from "@/components/account/restore-account";
import { MainArea, QuickNav, TopBar } from "@/components/app/main-nav";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatLongDate } from "@/lib/reminders/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccountState } from "@/server/account/lifecycle";
import {
  getSessionProfile,
  getSessionUserId,
  hasAnyCircle,
  touchLastActive,
} from "@/server/auth/session";
import { localDate } from "@/server/circles/circles";
import {
  getConsentState,
  hasRequiredConsents,
} from "@/server/consents/consents";
import { submitFeedback } from "@/server/feedback/actions";
import { feedbackAllowed } from "@/server/feedback/feedback";
import { signOut } from "../(auth)/entrar/actions";
import { restoreAccountAction } from "./cuenta/actions";

export const metadata: Metadata = { robots: { index: false } };

// Toda la app con sesión: exige sesión, consentimientos obligatorios y al menos
// un círculo. El proxy ya filtró a quien no tiene sesión; aquí se vuelve a comprobar.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (!userId) {
    redirect("/entrar");
  }
  const account = await getAccountState(supabase, userId);
  if (account.status === "pending_deletion") {
    return (
      <RestoreAccount
        purgeDate={formatLongDate(localDate(new Date(account.purgeAfter)))}
        restore={restoreAccountAction}
        keep={
          <form action={signOut}>
            <SubmitButton variant="ghost" className="w-full">
              Mantener el borrado y salir
            </SubmitButton>
          </form>
        }
      />
    );
  }
  if (!hasRequiredConsents(await getConsentState(supabase, userId))) {
    redirect("/bienvenida/consentimientos");
  }
  if (!(await hasAnyCircle(supabase))) {
    redirect("/bienvenida");
  }

  const askFeedback = await feedbackAllowed(supabase);
  const profile = await getSessionProfile(supabase, userId);
  if (profile) {
    await touchLastActive(supabase, userId, profile.lastActiveAt, new Date());
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar
        signOut={
          <form action={signOut}>
            <SubmitButton variant="secondary" className="w-full">
              Salir
            </SubmitButton>
          </form>
        }
      />
      <MainArea>
        {children}
        {askFeedback ? <FeedbackButton submit={submitFeedback} /> : null}
      </MainArea>
      <QuickNav />
    </div>
  );
}
