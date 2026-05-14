/* ============================================================
   charts/radar.js — Barras horizontales: proyectos por campo de estudio (filtrada)
   ============================================================ */

import { CAMPOS_ESTUDIO, CAMPO_COLORS } from "../config.js";

export function renderChartRadar(datos) {
  const container = document.getElementById("chart-radar");
  if (!container) return;
  container.innerHTML = "";

  // Contar proyectos por campo, ordenados de mayor a menor
  const counts = {};
  CAMPOS_ESTUDIO.forEach(c => { counts[c] = 0; });
  datos.forEach(d => {
    if (d.campo && counts[d.campo] !== undefined) counts[d.campo]++;
  });

  const porCampo = CAMPOS_ESTUDIO
    .map(c => ({ campo: c, count: counts[c] }))
    .sort((a, b) => b.count - a.count);

  const total = porCampo.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    container.innerHTML = '<p style="color:#999;padding:1rem 0">Sin datos clasificados para la selección actual.</p>';
    return;
  }

  // Gráfica
  const chart = Plot.plot({
    marginLeft: 4,
    marginRight: 36,
    marginTop: 4,
    marginBottom: 16,
    width: container.clientWidth || 340,
    height: 28 * porCampo.length + 20,
    x: {
      label: null,
      grid: true,
      tickSize: 0,
      ticks: 4,
    },
    y: {
      label: null,
      tickSize: 0,
      tickFormat: () => "",   // sin etiquetas en el eje Y
    },
    marks: [
      Plot.barX(porCampo, {
        x: "count",
        y: "campo",
        fill: d => CAMPO_COLORS[d.campo],
        rx: 3,
        sort: { y: "-x" },
        tip: true,
        title: d => `${d.campo}\n${d.count} proyecto${d.count !== 1 ? "s" : ""} (${((d.count / total) * 100).toFixed(1)}%)`,
      }),
      Plot.text(porCampo, {
        x: "count",
        y: "campo",
        text: d => d.count > 0 ? String(d.count) : "",
        dx: 6,
        fill: "#555",
        fontSize: 11,
        fontWeight: 600,
        textAnchor: "start",
        frameAnchor: "middle",
      }),
    ],
    style: {
      background: "transparent",
      fontSize: 11,
      fontFamily: "inherit",
    },
  });

  container.appendChild(chart);

  // Leyenda de colores (debajo de las barras)
  const legend = document.createElement("div");
  legend.className = "campo-legend";
  porCampo.forEach(d => {
    if (d.count === 0) return;
    const item = document.createElement("span");
    item.className = "campo-legend-item";
    item.innerHTML = `<span class="campo-dot" style="background:${CAMPO_COLORS[d.campo]}"></span>${d.campo}`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}
