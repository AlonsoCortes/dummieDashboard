/* ============================================================
   charts/inst_timeline.js — Barras: proyectos por año para una
   institución seleccionada (datos ya filtrados por institución).
   ============================================================ */

import { GUINDA } from "../config.js";

export function renderInstTimeline(datos) {
  const container = document.getElementById("chart-inst-timeline");
  if (!container) return;
  container.innerHTML = "";

  const porAnio = d3.rollups(
    datos.filter(d => d.anio),
    v => v.length,
    d => d.anio
  )
    .map(([anio, count]) => ({ anio, count }))
    .sort((a, b) => a.anio.localeCompare(b.anio));

  if (porAnio.length === 0) {
    container.innerHTML = '<p style="color:#999;padding:0.5rem 0">Sin datos de año disponibles.</p>';
    return;
  }

  const chart = Plot.plot({
    marginLeft: 32,
    marginRight: 8,
    marginTop: 22,
    marginBottom: 28,
    width: container.clientWidth || 600,
    height: 160,
    x: { label: null, type: "band", tickSize: 0 },
    y: { label: null, grid: true, ticks: 4, tickSize: 0 },
    marks: [
      Plot.barY(porAnio, {
        x: "anio",
        y: "count",
        fill: GUINDA,
        rx: 3,
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
        fontSize: 12,
        fontWeight: 700,
      }),
    ],
    style: { background: "transparent", fontSize: 11, fontFamily: "inherit", overflow: "visible" },
  });

  container.appendChild(chart);
}
