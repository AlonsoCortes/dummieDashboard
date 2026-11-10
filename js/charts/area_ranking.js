export function renderDireccionEncargadaRanking(datos, seleccionada, onSelect) {
  const container = document.getElementById("chart-dir-encargada-ranking");
  if (!container) return;
  container.innerHTML = "";

  const data = d3.rollups(
    datos.filter(d => d.direccionEncargada),
    v => v.length,
    d => d.direccionEncargada
  )
    .sort((a, b) => b[1] - a[1])
    .map(([dir, count]) => ({ dir, count }));

  if (!data.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos.</p>';
    return;
  }

  const table = document.createElement("table");
  table.className = "inst-rank-table";
  table.innerHTML = `<thead><tr><th>Direcci&oacute;n Encargada</th><th>#</th></tr></thead>`;

  const tbody = document.createElement("tbody");
  data.forEach(d => {
    const tr = document.createElement("tr");
    tr.className = "inst-rank-row" + (d.dir === seleccionada ? " inst-rank-row--sel" : "");
    tr.innerHTML = `<td title="${d.dir}">${d.dir}</td><td>${d.count}</td>`;
    tr.addEventListener("click", () => onSelect(d.dir === seleccionada ? null : d.dir));
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

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
