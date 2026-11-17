import { ComplianceChart } from "@/components/reports/compliance-chart";
import type { ChartRow } from "@/lib/reports/view";

export interface ReportCardProps {
  /** `id` para que el botón de compartir encuentre la tarjeta. */
  id: string;
  title: string;
  subtitle: string;
  caredName: string;
  hasData: boolean;
  sentences: string[];
  rows: ChartRow[];
  milestones: { key: string; text: string }[];
}

/**
 * La tarjeta del informe: lo que se ve en pantalla, se imprime y se comparte
 * como imagen. Nunca recibe datos personales de la cuidadora.
 */
export function ReportCard({
  id,
  title,
  subtitle,
  caredName,
  hasData,
  sentences,
  rows,
  milestones,
}: ReportCardProps) {
  return (
    <article
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5"
    >
      <header className="flex flex-col gap-1">
        <h2 id={`${id}-titulo`} className="text-2xl font-bold">
          {title}
        </h2>
        <p className="text-fg-muted">
          Cuidado de {caredName} · {subtitle}
        </p>
      </header>

      {hasData ? (
        <>
          <ul className="flex flex-col gap-2">
            {sentences.map((sentence) => (
              <li key={sentence} className="text-lg">
                {sentence}
              </li>
            ))}
          </ul>
          {rows.length > 0 ? (
            <section aria-labelledby={`${id}-grafico`}>
              <h3 id={`${id}-grafico`} className="mb-2 text-xl font-bold">
                Cumplimiento por tipo
              </h3>
              <ComplianceChart
                rows={rows}
                caption={`Cumplimiento por tipo de recordatorio. ${title}.`}
              />
            </section>
          ) : null}
        </>
      ) : (
        <p>Cuando tengas una semana de uso, aquí verás tu resumen.</p>
      )}

      {milestones.length > 0 ? (
        <section aria-labelledby={`${id}-logros`}>
          <h3 id={`${id}-logros`} className="mb-2 text-xl font-bold">
            Logros
          </h3>
          <ul className="flex flex-col gap-2">
            {milestones.map((item) => (
              <li
                key={item.key}
                className="rounded-control border border-border-strong bg-success-bg p-3 text-success"
              >
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
