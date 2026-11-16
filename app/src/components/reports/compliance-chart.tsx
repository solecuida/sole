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
import type { ChartRow } from "@/lib/reports/view";

const ROW_HEIGHT = 44;

/**
 * Barras simples de cumplimiento por tipo. El dibujo es solo apoyo: cada barra
 * lleva su porcentaje escrito y, debajo, la misma información en una tabla para
 * lectores de pantalla. Colores de token (variables CSS), sin animación.
 */
export function ComplianceChart({
  rows,
  caption,
}: {
  rows: ChartRow[];
  caption: string;
}) {
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
            margin={{ top: 4, right: 48, bottom: 4, left: 0 }}
            accessibilityLayer={false}
            barCategoryGap={8}
          >
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={132}
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
            <th scope="col">Tipo</th>
            <th scope="col">Hechos</th>
            <th scope="col">Total</th>
            <th scope="col">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              <td>{row.done}</td>
              <td>{row.total}</td>
              <td>{row.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
