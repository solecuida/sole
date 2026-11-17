// Forma de las filas que dibuja el gráfico del panel. Vive en lib (y no en el
// archivo "use client" del gráfico) para que la página de servidor la comparta.

export interface MetricChartRow {
  key: string;
  label: string;
  /** Largo de la barra. */
  value: number;
  /** La cifra escrita junto a la barra y en la tabla ("40 %", "12 000 ms"). */
  text: string;
}
