/* ============================================================
   charts/tendencia.js — Barras: proyectos por año (global, no filtrada)
   ============================================================ */

import { GUINDA, DORADO } from "../config.js";

export function renderChartTendencia(datos) {
  const container = document.getElementById("chart-tendencia");
  container.innerHTML = "";

  const porAnio = d3.rollups(
    datos.filter(d => d.anio),
    v => v.length,
    d => d.anio
  ).map(([anio, count]) => ({ anio, count }))
   .sort((a, b) => a.anio.localeCompare(b.anio));

  if (porAnio.length === 0) return;

  const chart = Plot.plot({
    marginLeft: 32,
    marginRight: 8,
    marginTop: 22,
    marginBottom: 28,
    width: container.clientWidth || 320,
    height: 150,
    x: { label: null, type: "band", tickSize: 0 },
    y: { label: null, grid: true, ticks: 4, tickSize: 0 },
    marks: [
      Plot.barY(porAnio, {
        x: "anio",
        y: "count",
        fill: DORADO,
        rx: 2,
        tip: true,
        title: d => `${d.anio}: ${d.count} proyecto${d.count !== 1 ? "s" : ""}`,
      }),
      Plot.ruleY([0]),
      Plot.text(porAnio, {
        x: "anio",
        y: "count",
        text: d => String(d.count),
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
