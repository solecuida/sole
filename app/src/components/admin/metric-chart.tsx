"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricChartRow } from "@/lib/admin/chart";

const ROW_HEIGHT = 44;

/**
 * Barras simples de una métrica. El dibujo es solo apoyo: cada barra lleva su
 * cifra escrita y, debajo, la misma información en una tabla para lectores de
 * pantalla. Colores de token (variables CSS), sin animación.
 */
export function MetricChart({
  rows,
  caption,
  valueHeader,
  max,
}: {
  rows: MetricChartRow[];
  caption: string;
  valueHeader: string;
  /** Tope de la escala; sin él, el mayor valor. */
  max?: number;
}) {
  if (rows.length === 0) {
    return <p className="text-fg-muted">Sin datos para este filtro.</p>;
  }
  const top = max ?? Math.max(1, ...rows.map((row) => row.value));
  const height = rows.length * ROW_HEIGHT + 16;
  return (
    <div>
      <div aria-hidden="true" style={{ width: "100%", height }}>
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 320, height }}
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 72, bottom: 4, left: 0 }}
            accessibilityLayer={false}
            barCategoryGap={8}
          >
            <XAxis type="number" domain={[0, top]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--fg)", fontSize: 14 }}
            />
            <Bar dataKey="value" isAnimationActive={false} radius={6}>
              {rows.map((row) => (
                <Cell key={row.key} fill="var(--primary)" />
              ))}
              <LabelList
                dataKey="text"
                position="right"
                fill="var(--fg)"
                fontSize={14}
                fontWeight={700}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Dato</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{row.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
