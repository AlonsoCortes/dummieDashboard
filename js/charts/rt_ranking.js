/* ============================================================
   charts/rt_ranking.js — Tabla: top 15 responsables técnicos por
   número de proyectos. Filas clickeables para seleccionar RT.
   ============================================================ */

export function renderRTRanking(datos, rtSeleccionado, onSelect) {
  const container = document.getElementById("chart-rt-ranking");
  if (!container) return;
  container.innerHTML = "";

  const data = d3.rollups(
    datos.filter(d => d.nombreRT),
    v => v.length,
    d => d.nombreRT
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([rt, count]) => ({ rt, count }));

  if (!data.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "inst-rank-table";
  table.innerHTML = `<thead><tr><th>Responsable Técnico</th><th>#</th></tr></thead>`;

  const tbody = document.createElement("tbody");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "inst-rank-row" + (d.rt === rtSeleccionado ? " inst-rank-row--sel" : "");
    tr.innerHTML = `<td>${d.rt}</td><td>${d.count}</td>`;
    tr.addEventListener("click", () => onSelect(d.rt === rtSeleccionado ? null : d.rt));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
