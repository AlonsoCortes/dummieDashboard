/* ============================================================
   charts/inst_monto.js — Tabla: top 15 instituciones por
   monto total de proyectos. Filas clickeables para seleccionar institución.
   ============================================================ */

function fmtM(v) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v}`;
}

export function renderInstMontoRanking(datos, instSeleccionada, onSelect) {
  const container = document.getElementById("chart-inst-monto");
  if (!container) return;
  container.innerHTML = "";

  const data = d3.rollups(
    datos.filter(d => d.institucion && d.institucion !== "Sin institución"),
    v => d3.sum(v, r => r.monto),
    d => d.institucion
  )
    .filter(([, m]) => m > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([inst, monto]) => ({ inst, monto }));

  if (!data.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos de monto.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "inst-rank-table";
  table.innerHTML = `<thead><tr><th>Institución</th><th>Monto</th></tr></thead>`;

  const tbody = document.createElement("tbody");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "inst-rank-row" + (d.inst === instSeleccionada ? " inst-rank-row--sel" : "");
    tr.innerHTML = `<td>${d.inst}</td><td>${fmtM(d.monto)}</td>`;
    tr.addEventListener("click", () => onSelect(d.inst === instSeleccionada ? null : d.inst));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
