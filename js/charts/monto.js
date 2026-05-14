/* ============================================================
   charts/monto.js — Barras: monto total por año (global, no filtrada)
   ============================================================ */

import { GUINDA } from "../config.js";
import { formatoMXN } from "../kpis.js";

export function renderChartMontoAnio(datos) {
  const container = document.getElementById("chart-monto-anio");
  container.innerHTML = "";

  const porAnio = d3.rollups(
    datos.filter(d => d.anio),
    v => d3.sum(v, d => d.monto),
    d => d.anio
  ).map(([anio, monto]) => ({ anio, monto }))
   .sort((a, b) => a.anio.localeCompare(b.anio));

  if (porAnio.length === 0) return;

  const chart = Plot.plot({
    marginLeft: 52,
    marginRight: 8,
    marginTop: 22,
    marginBottom: 28,
    width: container.clientWidth || 320,
    height: 150,
    x: { label: null, type: "band", tickSize: 0 },
    y: { label: null, grid: true, ticks: 4, tickSize: 0, tickFormat: d => `$${(d / 1e6).toFixed(0)}M` },
    marks: [
      Plot.barY(porAnio, {
        x: "anio",
        y: "monto",
        fill: GUINDA,
        rx: 2,
        tip: true,
        title: d => `${d.anio}: ${formatoMXN(d.monto)}`,
      }),
      Plot.ruleY([0]),
      Plot.text(porAnio, {
        x: "anio",
        y: "monto",
        text: d => `$${(d.monto / 1e6).toFixed(0)}M`,
        dy: -6,
        fill: GUINDA,
        fontSize: 10,
        fontWeight: 700,
      }),
    ],
    style: { background: "transparent", fontSize: 11, fontFamily: "inherit", overflow: "visible" },
  });

  container.appendChild(chart);
}
