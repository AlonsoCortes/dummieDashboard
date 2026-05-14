/* ============================================================
   charts/inst_ranking.js — Tabla: top 15 instituciones por
   número de proyectos. Filas clickeables para seleccionar institución.
   ============================================================ */

export function renderInstRanking(datos, instSeleccionada, onSelect) {
  const container = document.getElementById("chart-inst-ranking");
  if (!container) return;
  container.innerHTML = "";

  const data = d3.rollups(
    datos.filter(d => d.institucion && d.institucion !== "Sin institución"),
    v => v.length,
    d => d.institucion
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([inst, count]) => ({ inst, count }));

  if (!data.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "inst-rank-table";
  table.innerHTML = `<thead><tr><th>Institución</th><th>#</th></tr></thead>`;

  const tbody = document.createElement("tbody");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "inst-rank-row" + (d.inst === instSeleccionada ? " inst-rank-row--sel" : "");
    tr.innerHTML = `<td>${d.inst}</td><td>${d.count}</td>`;
    tr.addEventListener("click", () => onSelect(d.inst === instSeleccionada ? null : d.inst));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
