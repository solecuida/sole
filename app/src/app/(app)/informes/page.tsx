import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ReportCard } from "@/components/reports/report-card";
import { ShareReport } from "@/components/reports/share-report";
import {
  chartRows,
  PERIOD_LABELS,
  PERIOD_TITLES,
  PERIODS,
  parsePeriod,
  periodSubtitle,
} from "@/lib/reports/view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import { track } from "@/server/events/track";
import { loadReport } from "@/server/reports/report";

export const metadata: Metadata = { title: "Informes" };

const linkButton =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 px-5 py-2 text-lg font-bold no-underline";
const neutral = `${linkButton} border-border-strong bg-background text-fg hover:bg-surface`;
const active = `${linkButton} border-primary bg-primary text-primary-fg hover:border-primary-hover hover:bg-primary-hover`;

/** Anota que se compartió (solo el formato). El archivo nunca pasa por el servidor. */
async function reportShared(format: "png" | "pdf"): Promise<void> {
  "use server";
  const parsed = z.enum(["png", "pdf"]).safeParse(format);
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (parsed.success && userId) {
    await track(supabase, userId, "report.shared", { format: parsed.data });
  }
}

export default async function ReportsPage({
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
  const circle = await resolveActiveCircle(supabase, requested);
  if (!circle) {
    redirect("/bienvenida");
  }
  const period = parsePeriod(params.periodo);
  const report = await loadReport(supabase, userId, circle, period, new Date());
  await track(supabase, userId, "report.viewed", { period });

  const link = (value: string, path = "/informes") =>
    `${path}?periodo=${value}&c=${circle.id}`;

  return (
    <>
      <h1 className="text-3xl font-bold">Informes</h1>
      <p className="text-fg-muted">
        Cómo va el cuidado de {circle.caredName}, contado con números simples.
      </p>

      <nav aria-label="Período del informe" className="flex flex-wrap gap-3">
        {PERIODS.map((value) => (
          <Link
            key={value}
            href={link(value)}
            aria-current={value === period ? "page" : undefined}
            className={value === period ? active : neutral}
          >
            {PERIOD_LABELS[value]}
          </Link>
        ))}
      </nav>

      <ReportCard
        id="informe"
        title={PERIOD_TITLES[period]}
        subtitle={periodSubtitle(period, report.range.from, report.range.to)}
        caredName={circle.caredName}
        hasData={report.shared.hasData}
        sentences={report.shared.sentences}
        rows={chartRows(report.shared.compliance)}
        milestones={report.milestones}
      />

      {report.mine ? (
        <section
          aria-labelledby="solo-para-ti"
          className="flex flex-col gap-2 rounded-card border border-border bg-surface p-5"
        >
          <h2 id="solo-para-ti" className="text-xl font-bold">
            Solo para ti
          </h2>
          <p>
            Respondiste cómo estabas {report.mine.days}{" "}
            {report.mine.days === 1 ? "día" : "días"}; tu promedio fue{" "}
            {String(report.mine.average).replace(".", ",")} de 5.
          </p>
          <p className="text-fg-muted">
            Esto no sale en lo que compartes ni lo ve nadie más.
          </p>
        </section>
      ) : null}

      <section aria-labelledby="compartir" className="flex flex-col gap-3">
        <h2 id="compartir" className="text-xl font-bold">
          Compartir
        </h2>
        <p className="text-fg-muted">
          Se arma en tu teléfono; Sole no envía nada por su cuenta.
        </p>
        <ShareReport
          period={period}
          date={report.today}
          targetId="informe"
          onShared={reportShared}
        />
        <Link href={link(period, "/informes/imprimir")} className={neutral}>
          Versión para imprimir
        </Link>
      </section>
    </>
  );
}
