/* ============================================================
   tabla.js — Tabla de proyectos filtrados
   ============================================================ */

import { formatoMXN } from "./kpis.js";
import { CAMPO_COLORS } from "./config.js";

export function renderTabla(datos) {
  const tbody = document.getElementById("tabla-body");
  tbody.innerHTML = "";

  datos.forEach(d => {
    const tr = document.createElement("tr");
    const label = d.acronimo !== d.titulo && d.titulo
      ? `<strong>${d.acronimo}</strong><br><small style="color:#666">${d.titulo.slice(0, 80)}${d.titulo.length > 80 ? "…" : ""}</small>`
      : `<strong>${d.acronimo}</strong>`;
    tr.innerHTML = `
      <td>${d.folio || "—"}</td>
      <td>${d.id || "—"}</td>
      <td>${label}</td>
      <td>${d.institucion}</td>
      <td>${d.campo
        ? `<span style="display:inline-flex;align-items:center;gap:0.35rem">
             <span style="width:8px;height:8px;border-radius:50%;background:${CAMPO_COLORS[d.campo] || '#ccc'};flex-shrink:0;display:inline-block"></span>
             ${d.campo}
           </span>`
        : "—"}</td>
      <td>${d.tipo || "—"}</td>
      <td>${d.nombreRT || "—"}</td>
      <td>${d.anio || "—"}</td>
      <td style="text-align:right">${d.monto > 0 ? formatoMXN(d.monto) : "—"}</td>
    `;
    tbody.appendChild(tr);
  });
}
