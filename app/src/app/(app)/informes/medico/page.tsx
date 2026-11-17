import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShareReport } from "@/components/reports/share-report";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/server/auth/session";
import { resolveActiveCircle } from "@/server/circles/circles";
import { track } from "@/server/events/track";
import { localDateOf } from "@/server/reminders/recurrence";
import {
  buildDoctorReport,
  loadDoctorRows,
  monthLabel,
  parseMonth,
  shiftMonth,
} from "@/server/reports/doctor-report";

export const metadata: Metadata = { title: "Informe para el médico" };

const PREMIUM_LABEL = "Premium · gratis durante el piloto";

// Al imprimir: una sola hoja A4, sin barra superior ni accesos, letra compacta.
// La zona que se desplaza en pantalla se suelta para que el informe use la hoja.
const PRINT_CSS = `
@page { size: A4; margin: 15mm; }
@media print {
  div:has(> main#contenido) > header, div:has(> main#contenido) > nav, .no-print { display: none !important; }
  div:has(> main#contenido) { display: block !important; height: auto !important; overflow: visible !important; }
  main#contenido { overflow: visible !important; }
  body { font-size: 11pt; background: transparent; }
  #informe-medico { border: 0; padding: 0; gap: 10pt; break-inside: avoid; }
  #informe-medico h2 { font-size: 15pt; }
  #informe-medico h3 { font-size: 12pt; }
  #informe-medico li, #informe-medico td, #informe-medico th { font-size: 11pt; }
}
`;

const neutral =
  "inline-flex min-h-12 items-center justify-center rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline hover:bg-surface";

/** El uso se anota al abrir el informe; imprimir no agrega nada más. */
async function printed(): Promise<void> {
  "use server";
}

export default async function DoctorReportPage({
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

  // Solo lo genera la cuidadora del círculo.
  const member = await supabase
    .from("circle_members")
    .select("role")
    .eq("circle_id", circle.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (member.data?.role !== "caregiver") {
    redirect(`/informes?c=${circle.id}`);
  }

  const now = new Date();
  const today = localDateOf(now, circle.timezone);
  const month = parseMonth(params.mes, today);
  const rows = await loadDoctorRows(
    supabase,
    circle.id,
    month,
    circle.timezone,
  );
  const report = buildDoctorReport(rows, month);

  await track(supabase, userId, "premium.used", { feature: "informe_medico" });

  const choose = (value: string) =>
    `/informes/medico?mes=${value}&c=${circle.id}`;
  const months = [shiftMonth(month, -1), month, shiftMonth(month, 1)];

  return (
    <>
      <style>{PRINT_CSS}</style>
      <h1 className="no-print text-3xl font-bold">Informe para el médico</h1>
      <div className="no-print flex flex-col gap-3">
        <p className="inline-flex w-fit rounded-control border-2 border-primary px-3 py-1 font-bold">
          {PREMIUM_LABEL}
        </p>
        <p className="text-fg-muted">
          Reúne lo que registraste este mes, para llevarlo a un control. No
          incluye lo que respondiste solo para ti. En el cuadro de impresión
          elige "Guardar como PDF"; Sole no guarda ni envía el informe.
        </p>
        <nav aria-label="Mes del informe" className="flex flex-wrap gap-2">
          {months.map((value) => (
            <Link
              key={value}
              href={choose(value)}
              aria-current={value === month ? "page" : undefined}
              className={neutral}
            >
              {monthLabel(value)}
            </Link>
          ))}
        </nav>
        <ShareReport
          mode="print"
          period="mes"
          date={today}
          onShared={printed}
        />
        <Link href={`/informes?c=${circle.id}`} className={neutral}>
          Volver a los informes
        </Link>
      </div>

      <article
        id="informe-medico"
        aria-labelledby="informe-medico-titulo"
        className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5"
      >
        <header className="flex flex-col gap-1">
          <p className="font-bold">{PREMIUM_LABEL}</p>
          <h2 id="informe-medico-titulo" className="text-2xl font-bold">
            Informe del mes · {report.monthLabel}
          </h2>
          <p className="text-fg-muted">
            Cuidado de {circle.caredName}. Reúne lo que la persona que cuida
            registró en Sole; no interpreta ni recomienda.
          </p>
        </header>

        {report.hasData ? (
          <>
            {report.medication.length > 0 ? (
              <section aria-labelledby="medico-medicamentos">
                <h3 id="medico-medicamentos" className="mb-1 text-xl font-bold">
                  Cumplimiento de los medicamentos
                </h3>
                <table className="w-full border-collapse text-left">
                  <caption className="sr-only">
                    Medicamentos registrados en {report.monthLabel}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="border-b border-border py-1">
                        Medicamento
                      </th>
                      <th scope="col" className="border-b border-border py-1">
                        Tomas hechas
                      </th>
                      <th scope="col" className="border-b border-border py-1">
                        Cumplimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.medication.map((item) => (
                      <tr key={item.reminderId}>
                        <th
                          scope="row"
                          className="border-b border-border py-1 font-normal"
                        >
                          {item.label}
                        </th>
                        <td className="border-b border-border py-1">
                          {item.done} de {item.total}
                        </td>
                        <td className="border-b border-border py-1">
                          {item.text}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section aria-labelledby="medico-actividades">
              <h3 id="medico-actividades" className="mb-1 text-xl font-bold">
                Actividades hechas
              </h3>
              {report.activities.items.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {report.activities.items.map((item) => (
                    <li key={item.label}>
                      {item.label}: {item.done}{" "}
                      {item.done === 1 ? "vez" : "veces"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay actividades registradas este mes.</p>
              )}
            </section>

            <section aria-labelledby="medico-bitacora">
              <h3 id="medico-bitacora" className="mb-1 text-xl font-bold">
                Bitácora del mes
              </h3>
              {report.journal.days > 0 ? (
                <ul className="flex flex-col gap-1">
                  <li>Días con registro: {report.journal.days}</li>
                  <li>Días buenos: {report.journal.bueno}</li>
                  <li>Días regulares: {report.journal.regular}</li>
                  <li>Días difíciles: {report.journal.dificil}</li>
                </ul>
              ) : (
                <p>No hay días registrados en la bitácora este mes.</p>
              )}
            </section>
          </>
        ) : (
          <p>No hay registros en {report.monthLabel}.</p>
        )}

        <section aria-labelledby="medico-preguntas">
          <h3 id="medico-preguntas" className="mb-1 text-xl font-bold">
            {report.questions.title}
          </h3>
          <div aria-hidden="true" className="flex flex-col gap-4 pt-2">
            {Array.from({ length: report.questions.blankLines }, (_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: líneas en blanco idénticas
                key={index}
                className="h-6 border-b border-border-strong"
              />
            ))}
          </div>
        </section>
      </article>
    </>
  );
}
