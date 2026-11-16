import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ReportCard } from "@/components/reports/report-card";
import { ShareReport } from "@/components/reports/share-report";
import {
  chartRows,
  PERIOD_TITLES,
  parsePeriod,
  periodSubtitle,
} from "@/lib/reports/view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import { track } from "@/server/events/track";
import { loadReport } from "@/server/reports/report";

export const metadata: Metadata = { title: "Informe para imprimir" };

// Al imprimir: sin barra superior ni accesos, letra de 12 pt y hoja A4. La zona
// que se desplaza en pantalla se suelta para que el informe use todas las hojas.
const PRINT_CSS = `
@page { size: A4; margin: 15mm; }
@media print {
  div:has(> main#contenido) > header, div:has(> main#contenido) > nav, .no-print { display: none !important; }
  div:has(> main#contenido) { display: block !important; height: auto !important; overflow: visible !important; }
  main#contenido { overflow: visible !important; }
  body { font-size: 12pt; background: transparent; }
  #informe-imprimir { border: 0; padding: 0; }
}
`;

const neutral =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline hover:bg-surface";

async function reportPrinted(format: "png" | "pdf"): Promise<void> {
  "use server";
  const parsed = z.enum(["png", "pdf"]).safeParse(format);
  const supabase = await createSupabaseServerClient();
  const userId = await getSessionUserId(supabase);
  if (parsed.success && userId) {
    await track(supabase, userId, "report.shared", { format: parsed.data });
  }
}

export default async function PrintReportPage({
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

  return (
    <>
      <style>{PRINT_CSS}</style>
      <h1 className="no-print text-3xl font-bold">Informe para imprimir</h1>
      <div className="no-print flex flex-col gap-3">
        <p className="text-fg-muted">
          En el cuadro de impresión elige "Guardar como PDF" para tenerlo en tu
          teléfono. No incluye lo que respondiste solo para ti.
        </p>
        <ShareReport
          mode="print"
          period={period}
          date={report.today}
          onShared={reportPrinted}
        />
        <Link
          href={`/informes?periodo=${period}&c=${circle.id}`}
          className={neutral}
        >
          Volver a los informes
        </Link>
      </div>
      <ReportCard
        id="informe-imprimir"
        title={PERIOD_TITLES[period]}
        subtitle={periodSubtitle(period, report.range.from, report.range.to)}
        caredName={circle.caredName}
        hasData={report.shared.hasData}
        sentences={report.shared.sentences}
        rows={chartRows(report.shared.compliance)}
        milestones={report.milestones}
      />
    </>
  );
}
