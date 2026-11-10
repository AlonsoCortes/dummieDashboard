/* ============================================================
   charts/estado_proyecto.js — Barras horizontales por año × estado (3 categorías)
   ============================================================ */

const ESTADO_COLORS = ["#3A7D44", "#C0762A", "#6B7280"];
const ESTADO_DOMAIN = ["Vigente", "No vigente", "Cerrado"];

export function renderEstadoProyecto(datos, containerId = "chart-inst-stacked") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const filas = datos
    .filter(d => d.estadoProyecto && d.anio)
    .map(d => ({ anio: d.anio, categoria: d.estadoProyecto }))
    .filter(d => ESTADO_DOMAIN.includes(d.categoria));

  if (!filas.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.85rem">Sin datos de estado disponibles.</p>';
    return;
  }

  const agrupado = d3.rollups(
    filas,
    v => v.length,
    d => d.anio,
    d => d.categoria
  ).flatMap(([anio, cats]) =>
    cats.map(([categoria, count]) => ({ anio, categoria, count }))
  );

  const anios = [...new Set(filas.map(d => d.anio))].sort();
  const width  = container.clientWidth || 580;
  const height = Math.max(anios.length * 34 + 40, 100);

  // Leyenda manual
  const leyenda = document.createElement("div");
  leyenda.style.cssText = "display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:0.6rem";
  ESTADO_DOMAIN.forEach((cat, i) => {
    const item = document.createElement("span");
    item.style.cssText = "display:inline-flex;align-items:center;gap:0.4rem;font-size:0.78rem;font-weight:600";
    item.innerHTML = `<span style="width:10px;height:10px;border-radius:2px;background:${ESTADO_COLORS[i]};display:inline-block"></span>${cat}`;
    leyenda.appendChild(item);
  });
  container.appendChild(leyenda);

  const chart = Plot.plot({
    marginLeft: 44,
    marginRight: 36,
    marginTop: 4,
    marginBottom: 8,
    width,
    height,
    x: { label: "Proyectos", grid: true, ticks: 4, tickSize: 0 },
    y: { label: null, domain: anios, tickSize: 0 },
    color: { domain: ESTADO_DOMAIN, range: ESTADO_COLORS },
    marks: [
      Plot.barX(agrupado, Plot.stackX({
        x: "count",
        y: "anio",
        fill: "categoria",
        rx: 2,
        tip: true,
        title: d => `${d.anio} · ${d.categoria}: ${d.count} proyecto${d.count !== 1 ? "s" : ""}`,
      })),
      Plot.text(agrupado, Plot.stackX({
        x: "count",
        y: "anio",
        fill: "white",
        text: d => d.count >= 2 ? String(d.count) : "",
        fontSize: 12,
        fontWeight: 700,
        textAnchor: "middle",
        frameAnchor: "middle",
      })),
    ],
    style: {
      background: "transparent",
      fontSize: 13,
      fontFamily: "inherit",

      overflow: "visible",
    },
  });

  container.appendChild(chart);
}
