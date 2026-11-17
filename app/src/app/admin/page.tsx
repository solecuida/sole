import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { MetricChart } from "@/components/admin/metric-chart";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { MetricChartRow } from "@/lib/admin/chart";
import { parseMetricFilters, weekLabel } from "@/lib/admin/weeks";
import {
  computeMetrics,
  filterOptions,
  loadMetricRows,
  type RetentionPoint,
} from "@/server/admin/metrics";
import { adminPage } from "./access";

export const metadata: Metadata = { title: "Métricas" };

const FLOW_LABELS: Record<string, string> = {
  onboarding: "Bienvenida",
  reminder_create: "Crear un recordatorio",
  journal: "Guardar la bitácora",
};
const DOOR_LABELS: Record<string, string> = {
  ia: "Asistente",
  recetas: "Recetas",
  plan_familiar: "Plan familiar",
  comunidad: "Comunidad",
  fotos: "Fotos",
  invitar_familiar: "Invitar a un familiar",
};
const ANSWER_LABELS: Record<string, string> = {
  muy_decepcionada: "Muy decepcionada",
  algo_decepcionada: "Algo decepcionada",
  no_importaria: "No me importaría",
};

const percent = (rate: number) => `${Math.round(rate * 100)} %`;
const decimal = (value: number) => String(value).replace(".", ",");
const seconds = (ms: number) => `${decimal(Math.round(ms / 100) / 10)} s`;
const retentionText = (p: RetentionPoint) =>
  p.rate === null
    ? "Sin datos aún"
    : `${percent(p.rate)} (${p.retained} de ${p.eligible})`;

function Section({
  title,
  reference,
  children,
}: {
  title: string;
  reference?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      {reference ? (
        <p className="text-fg-muted">Referencia del brief: {reference}</p>
      ) : null}
      {children}
    </section>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-3xl font-bold">{value}</dd>
    </div>
  );
}

function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: string[][];
}) {
  if (rows.length === 0) {
    return <p className="text-fg-muted">Sin datos para este filtro.</p>;
  }
  return (
    <section
      aria-label={caption}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: una zona que se desplaza debe poder enfocarse con el teclado (WCAG 2.1.1)
      tabIndex={0}
      className="overflow-x-auto"
    >
      <table className="w-full border-collapse text-left">
        <caption className="mb-2 text-left font-bold">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                scope="col"
                className="border-b-2 border-border-strong p-2"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th
                    key={head[i]}
                    scope="row"
                    className="border-b border-border p-2"
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={head[i]} className="border-b border-border p-2">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default async function AdminMetricsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await adminPage("/admin");
  const filters = parseMetricFilters(await searchParams);
  const loaded = await loadMetricRows(supabase, filters);

  const heading = (
    <>
      <h1 className="text-3xl font-bold leading-tight">Métricas del piloto</h1>
      <p className="max-w-content text-fg-muted">
        Solo conteos, porcentajes y medianas. No se ven correos, nombres ni
        datos de cuidado.
      </p>
    </>
  );
  if (!loaded.ok) {
    return (
      <>
        {heading}
        <p
          role="alert"
          className="rounded-card border border-danger bg-danger-bg p-4 font-bold text-danger"
        >
          {loaded.error.message}
        </p>
      </>
    );
  }

  const rows = loaded.data;
  const options = filterOptions(rows);
  const m = computeMetrics(rows, filters, new Date());

  const retentionRows: MetricChartRow[] = m.h1.retention.map((p) => ({
    key: `w${p.week}`,
    label: `Semana ${p.week}`,
    value: p.rate === null ? 0 : p.rate * 100,
    text: p.rate === null ? "Sin datos" : percent(p.rate),
  }));
  const flowRows: MetricChartRow[] = m.h2.flows
    .filter((f) => f.medianMs !== null)
    .map((f) => ({
      key: f.flow,
      label: FLOW_LABELS[f.flow] ?? f.flow,
      value: (f.medianMs ?? 0) / 1000,
      text: seconds(f.medianMs ?? 0),
    }));
  const answerRows: MetricChartRow[] =
    m.h3.answered === 0
      ? []
      : Object.entries(ANSWER_LABELS).map(([key, label]) => ({
          key,
          label,
          value: (m.h3.shares[key] ?? 0) * 100,
          text: percent(m.h3.shares[key] ?? 0),
        }));
  const pushText =
    m.push.rate === null ? "Sin datos aún" : percent(m.push.rate);
  const avgDays = m.h1.avgActiveDaysPerWeek;

  return (
    <>
      {heading}

      <form
        method="get"
        className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
      >
        <Field
          as="select"
          id="filtro-org"
          name="org"
          label="Organización"
          defaultValue={filters.org ?? ""}
        >
          <option value="">Todas</option>
          {options.orgs.map((org) => (
            <option key={org} value={org}>
              {org}
            </option>
          ))}
        </Field>
        <Field
          as="select"
          id="filtro-cohorte"
          name="cohorte"
          label="Semana de registro"
          defaultValue={filters.cohort === null ? "" : String(filters.cohort)}
        >
          <option value="">Todas</option>
          {options.cohorts.map((week) => (
            <option key={week} value={week}>
              {weekLabel(week)}
            </option>
          ))}
        </Field>
        <div className="flex flex-wrap gap-3">
          <SubmitButton>Filtrar</SubmitButton>
          <Link
            href="/admin"
            className="inline-flex min-h-12 items-center rounded-control border-2 border-border-strong bg-background px-5 text-lg font-bold text-fg no-underline hover:bg-surface"
          >
            Quitar filtros
          </Link>
        </div>
      </form>

      {rows.truncated ? (
        <p
          role="status"
          className="rounded-card border border-warning bg-warning-bg p-4 text-warning"
        >
          Hay más filas de las que el panel lee de una vez: las cifras pueden
          estar incompletas.
        </p>
      ) : null}

      <Section title="Resumen">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Figure label="Personas registradas" value={String(m.users)} />
          <Figure
            label="Activas en los últimos 7 días"
            value={String(m.push.active7)}
          />
          <Figure label="Activas con avisos permitidos" value={pushText} />
        </dl>
        <p className="text-fg-muted">
          Los avisos se miden con el permiso que dieron en la app, no con la
          suscripción técnica.
        </p>
      </Section>

      <Section
        title="H1 · Uso diario"
        reference="al menos 4 días por semana y al menos 40 % activas en la semana 4."
      >
        <dl>
          <Figure
            label="Días activos por semana (promedio)"
            value={
              avgDays === null
                ? "Sin datos aún"
                : decimal(Math.round(avgDays * 10) / 10)
            }
          />
        </dl>
        <MetricChart
          rows={retentionRows}
          max={100}
          caption="Retención por semana desde el registro"
          valueHeader="Personas que volvieron"
        />
        <Table
          caption="Retención por semana de registro"
          head={[
            "Semana de registro",
            "Personas",
            "Semana 1",
            "Semana 4",
            "Semana 8",
          ]}
          rows={m.h1.byCohort.map((c) => [
            weekLabel(c.cohort),
            String(c.size),
            ...c.retention.map(retentionText),
          ])}
        />
      </Section>

      <Section
        title="H2 · Tareas rápidas"
        reference="bitácora en menos de 15 s y recordatorio en menos de 60 s (mediana)."
      >
        <MetricChart
          rows={flowRows}
          caption="Mediana de tiempo por flujo, en segundos"
          valueHeader="Mediana"
        />
        <Table
          caption="Flujos medidos"
          head={["Flujo", "Empezados", "Terminados", "Abandonados", "Abandono"]}
          rows={m.h2.flows.map((f) => [
            FLOW_LABELS[f.flow] ?? f.flow,
            String(f.started),
            String(f.completed),
            String(f.abandoned),
            f.abandonRate === null ? "Sin datos" : percent(f.abandonRate),
          ])}
        />
        <Table
          caption="Errores mostrados por pantalla"
          head={["Pantalla", "Errores"]}
          rows={Object.entries(m.h2.errorsByScreen).map(([screen, n]) => [
            screen,
            String(n),
          ])}
        />
      </Section>

      <Section
        title="H3 · Valor percibido"
        reference="al menos 40 % responde «muy decepcionada»."
      >
        <p>
          <strong>
            {m.h3.answered === 0
              ? "Sin respuestas aún"
              : `${percent(m.h3.shares.muy_decepcionada ?? 0)} muy decepcionada`}
          </strong>{" "}
          · {m.h3.answered} {m.h3.answered === 1 ? "respuesta" : "respuestas"} a
          «¿Cómo te sentirías si Sole dejara de existir?».
        </p>
        <MetricChart
          rows={answerRows}
          max={100}
          caption="Respuestas a la encuesta del día 28"
          valueHeader="Porcentaje"
        />
      </Section>

      <Section
        title="H4 · Disposición a pagar"
        reference="comparativo por función."
      >
        <p>
          Usos del informe para el médico: <strong>{m.h4.premiumUsed}</strong>
        </p>
        <Table
          caption="Puertas falsas"
          head={[
            "Puerta",
            "Vistas",
            "Pidieron aviso",
            "Eligió $2.990",
            "Eligió $4.990",
            "Eligió $7.990",
          ]}
          rows={m.h4.doors.map((d) => [
            DOOR_LABELS[d.door] ?? d.door,
            String(d.viewed),
            String(d.interested),
            String(d.choices["2990"] ?? 0),
            String(d.choices["4990"] ?? 0),
            String(d.choices["7990"] ?? 0),
          ])}
        />
      </Section>

      <Section title="H5 · Sumar a otras personas">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Figure
            label="Invitaciones creadas"
            value={`${m.h5.invitations} (${m.h5.invitationUsers} personas)`}
          />
          <Figure
            label="Vínculos de la persona cuidada"
            value={`${m.h5.caredLinks} (${m.h5.caredLinkUsers} personas)`}
          />
          <Figure
            label="Interés en invitar a un familiar"
            value={String(m.h5.inviteDoorInterest)}
          />
        </dl>
      </Section>

      <Section title="H6 · Canales" reference="comparativo entre orígenes.">
        <Table
          caption="Altas y retención por organización"
          head={[
            "Organización",
            "Altas",
            "Activas en 7 días",
            "Semana 1",
            "Semana 4",
            "Semana 8",
          ]}
          rows={m.h6.map((o) => [
            o.org ?? "Sin organización",
            String(o.signups),
            String(o.active7),
            ...o.retention.map(retentionText),
          ])}
        />
      </Section>
    </>
  );
}
