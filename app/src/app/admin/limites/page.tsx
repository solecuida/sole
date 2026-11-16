import type { Metadata } from "next";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { usageSnapshot } from "@/server/admin/limits";
import { adminPage } from "../access";

export const metadata: Metadata = { title: "Límites" };

const percent = (ratio: number) => `${Math.round(ratio * 100)} %`;

function number(value: number): string {
  const [whole, decimals] = String(value).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimals ? `${grouped},${decimals}` : grouped;
}

export default async function AdminLimitsPage() {
  // Rol y segundo factor se comprueban antes de usar el cliente de servicio.
  await adminPage("/admin/limites");
  const rows = await usageSnapshot(createSupabaseAdminClient(), new Date());
  const warnings = rows.filter((row) => row.warning);

  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">Límites gratuitos</h1>
      <p className="max-w-content text-fg-muted">
        Sole funciona con planes gratuitos. Aquí se ve cuánto se está usando.
        Desde el 80 % conviene actuar antes de llegar al tope.
      </p>

      {warnings.length > 0 ? (
        <p
          role="alert"
          className="rounded-card border border-warning bg-warning-bg p-4 font-bold text-warning"
        >
          Atención: {warnings.map((row) => row.label.toLowerCase()).join("; ")}{" "}
          {warnings.length === 1 ? "llegó" : "llegaron"} al 80 % o más.
        </p>
      ) : (
        <p className="rounded-card border border-success bg-success-bg p-4 text-success">
          Todo bajo el 80 %.
        </p>
      )}

      <section
        aria-label="Uso actual frente a cada límite"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: una zona que se desplaza debe poder enfocarse con el teclado (WCAG 2.1.1)
        tabIndex={0}
        className="overflow-x-auto"
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Uso actual frente a cada límite</caption>
          <thead>
            <tr className="border-b-2 border-border-strong">
              <th scope="col" className="p-2">
                Qué
              </th>
              <th scope="col" className="p-2">
                Uso
              </th>
              <th scope="col" className="p-2">
                Límite
              </th>
              <th scope="col" className="p-2">
                Porcentaje
              </th>
              <th scope="col" className="p-2">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-border align-top">
                <th scope="row" className="p-2 font-bold">
                  {row.label}
                  <span className="block text-base font-normal text-fg-muted">
                    {row.source}
                  </span>
                </th>
                <td className="p-2">
                  {number(row.used)} {row.unit}
                </td>
                <td className="p-2">
                  {number(row.limit)} {row.unit}
                </td>
                <td className="p-2">{percent(row.ratio)}</td>
                <td className="p-2 font-bold">
                  {row.warning ? "Atención: 80 % o más" : "Bien"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="exportar" className="flex flex-col gap-3">
        <h2 id="exportar" className="text-xl font-bold">
          Exportar datos de investigación
        </h2>
        <p className="max-w-content text-fg-muted">
          Un archivo CSV con los eventos de uso. Lleva un identificador
          seudónimo: sin nombres, sin correos y sin texto escrito por las
          usuarias. Cada descarga queda anotada en la auditoría.
        </p>
        <a
          href="/api/admin/export"
          download
          className="inline-flex min-h-12 items-center self-start rounded-control border-2 border-border-strong bg-background px-5 py-2 text-lg font-bold text-fg no-underline hover:bg-surface"
        >
          Descargar eventos
        </a>
      </section>

      <p className="max-w-content text-base text-fg-muted">
        Los límites del proveedor están marcados [VERIFICAR]: hay que
        confirmarlos en su página oficial. El detalle y qué pasa al llegar a
        cada tope está en <code>docs/limites.md</code>.
      </p>
    </>
  );
}
