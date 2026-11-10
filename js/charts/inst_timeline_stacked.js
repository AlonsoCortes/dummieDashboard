/* ============================================================
   charts/inst_timeline_stacked.js — Barras apiladas: proyectos
   por año desglosados por campo de estudio o estado del proyecto.
   ============================================================ */

import { CAMPOS_ESTUDIO, CAMPO_COLORS } from "../config.js";

const ESTADO_COLORS = {
  "Vigente":    "#3A7D44",
  "No vigente": "#C0762A",
  "Cerrado":    "#6B7280",
  "Sin estado": "#d1d5db",
};
const ESTADO_ORDER = ["Vigente", "No vigente", "Cerrado", "Sin estado"];

export function renderInstTimelineStacked(datos, containerId = "chart-inst-stacked", groupBy = "campo") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const rows = datos.filter(d => d.anio);

  if (rows.length === 0) {
    container.innerHTML = '<p style="color:#999;padding:0.5rem 0">Sin datos de año disponibles.</p>';
    return;
  }

  const availableHeight = container.clientHeight - 68;
  const chartHeight = availableHeight > 140 ? availableHeight : 200;
  const chartWidth = container.clientWidth || container.parentElement?.clientWidth || 700;

  if (groupBy === "estado") {
    const counts = d3.rollups(
      rows,
      v => v.length,
      d => d.anio,
      d => d.estadoProyecto || "Sin estado"
    ).flatMap(([anio, cats]) =>
      cats.map(([categoria, count]) => ({ anio, categoria, count }))
    );

    const categoriasPresentes = ESTADO_ORDER.filter(c =>
      counts.some(d => d.categoria === c && d.count > 0)
    );

    const chart = Plot.plot({
      marginLeft: 32,
      marginRight: 8,
      marginTop: 28,
      marginBottom: 28,
      width: chartWidth,
      height: chartHeight,
      fx: { label: null, tickSize: 0 },
      x: { label: null, tickSize: 0, tickFormat: () => "" },
      y: { label: null, grid: true, ticks: 4, tickSize: 0 },
      marks: [
        Plot.barY(counts, {
          fx: "anio",
          x: "categoria",
          y: "count",
          fill: d => ESTADO_COLORS[d.categoria] ?? "#ccc",
          rx: 2,
          tip: true,
          title: d => `${d.categoria}\n${d.anio}: ${d.count} proyecto${d.count !== 1 ? "s" : ""}`,
        }),
        Plot.ruleY([0]),
      ],
      style: { background: "transparent", fontSize: 13, fontFamily: "inherit", overflow: "visible" },
    });

    container.appendChild(chart);

    const legend = document.createElement("div");
    legend.className = "campo-legend";
    categoriasPresentes.forEach(cat => {
      const item = document.createElement("span");
      item.className = "campo-legend-item";
      item.innerHTML = `<span class="campo-dot" style="background:${ESTADO_COLORS[cat]}"></span>${cat}`;
      legend.appendChild(item);
    });
    container.appendChild(legend);

  } else {
    // Agrupación por campo de estudio (comportamiento original)
    const counts = d3.rollups(
      rows,
      v => v.length,
      d => d.anio,
      d => d.campo || "Sin clasificar"
    ).flatMap(([anio, campos]) =>
      campos.map(([campo, count]) => ({ anio, campo, count }))
    );

    const camposPresentes = CAMPOS_ESTUDIO.filter(c =>
      counts.some(d => d.campo === c && d.count > 0)
    );

    const chart = Plot.plot({
      marginLeft: 32,
      marginRight: 8,
      marginTop: 28,
      marginBottom: 28,
      width: chartWidth,
      height: chartHeight,
      fx: { label: null, tickSize: 0 },
      x: { label: null, tickSize: 0, tickFormat: () => "" },
      y: { label: null, grid: true, ticks: 4, tickSize: 0 },
      marks: [
        Plot.barY(counts, {
          fx: "anio",
          x: "campo",
          y: "count",
          fill: d => CAMPO_COLORS[d.campo] ?? "#ccc",
          rx: 2,
          tip: true,
          title: d => `${d.campo}\n${d.anio}: ${d.count} proyecto${d.count !== 1 ? "s" : ""}`,
        }),
        Plot.ruleY([0]),
      ],
      style: { background: "transparent", fontSize: 13, fontFamily: "inherit", overflow: "visible" },
    });

    container.appendChild(chart);

    const legend = document.createElement("div");
    legend.className = "campo-legend";
    camposPresentes.forEach(campo => {
      const item = document.createElement("span");
      item.className = "campo-legend-item";
      item.innerHTML = `<span class="campo-dot" style="background:${CAMPO_COLORS[campo]}"></span>${campo}`;
      legend.appendChild(item);
    });
    container.appendChild(legend);
  }
}
