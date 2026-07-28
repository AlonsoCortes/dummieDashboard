export function renderAreaRanking(datos, areaSeleccionada, onSelect) {
  const container = document.getElementById("chart-area-ranking");
  if (!container) return;
  container.innerHTML = "";

  const data = d3.rollups(
    datos.filter(d => d.areaCaptura),
    v => v.length,
    d => d.areaCaptura
  )
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({ area, count }));

  if (!data.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "inst-rank-table";
  table.innerHTML = `<thead><tr><th>Área</th><th>#</th></tr></thead>`;

  const tbody = document.createElement("tbody");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "inst-rank-row" + (d.area === areaSeleccionada ? " inst-rank-row--sel" : "");
    tr.innerHTML = `<td title="${d.area}">${d.area}</td><td>${d.count}</td>`;
    tr.addEventListener("click", () => onSelect(d.area === areaSeleccionada ? null : d.area));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}
