export function renderSeguimientoRanking(datos, seguimientoSeleccionado, onSelect) {
  const container = document.getElementById("chart-seguimiento-ranking");
  if (!container) return;
  container.innerHTML = "";

  const data = d3.rollups(
    datos.filter(d => d.seguimiento),
    v => v.length,
    d => d.seguimiento
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([seg, count]) => ({ seg, count }));

  if (!data.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "inst-rank-table";
  table.innerHTML = `<thead><tr><th>Responsable</th><th>#</th></tr></thead>`;

  const tbody = document.createElement("tbody");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "inst-rank-row" + (d.seg === seguimientoSeleccionado ? " inst-rank-row--sel" : "");
    tr.innerHTML = `<td>${d.seg}</td><td>${d.count}</td>`;
    tr.addEventListener("click", () => onSelect(d.seg === seguimientoSeleccionado ? null : d.seg));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
