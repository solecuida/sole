import * as Sentry from "@sentry/nextjs";
import { buildSentryOptions } from "@/lib/observability/scrub";

// Next.js llama a register() una vez por runtime. Sin DSN, Sentry queda apagado.
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    Sentry.init(buildSentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN));
  }
}

export const onRequestError = Sentry.captureRequestError;
