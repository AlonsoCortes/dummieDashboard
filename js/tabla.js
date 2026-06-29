/* ============================================================
   tabla.js — Tabla de proyectos filtrados con columnas ordenables
   ============================================================ */

import { formatoMXN } from "./kpis.js";
import { CAMPO_COLORS } from "./config.js";

let sortCol = null;
let sortDir = "asc";
let lastDatos = [];

const SORT_KEY = [
  d => d.folio || "",
  d => parseInt(d.id) || 0,
  d => d.acronimo || "",
  d => d.institucion || "",
  d => d.unidad || "",
  d => d.campo || "",
  d => d.tipo || "",
  d => d.nombreRT || "",
  d => d.anio || "",
  d => d.monto || 0,
];

export function initTablaSort() {
  const ths = document.querySelectorAll(".tabla-container thead th");
  ths.forEach((th, i) => {
    th.addEventListener("click", () => {
      if (sortCol === i) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortCol = i;
        sortDir = "asc";
      }
      renderTabla(lastDatos);
    });
  });
}

export function renderTabla(datos) {
  lastDatos = datos;

  let filas = datos;
  if (sortCol !== null) {
    const key = SORT_KEY[sortCol];
    filas = [...datos].sort((a, b) => {
      const va = key(a);
      const vb = key(b);
      let cmp;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), "es", { sensitivity: "base" });
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  // Actualizar indicadores en encabezados
  document.querySelectorAll(".tabla-container thead th").forEach((th, i) => {
    th.classList.remove("th--sort-asc", "th--sort-desc");
    if (i === sortCol) {
      th.classList.add(sortDir === "asc" ? "th--sort-asc" : "th--sort-desc");
    }
  });

  const tbody = document.getElementById("tabla-body");
  tbody.innerHTML = "";

  filas.forEach(d => {
    const tr = document.createElement("tr");
    const label = d.acronimo !== d.titulo && d.titulo
      ? `<strong>${d.acronimo}</strong><br><small style="color:#666">${d.titulo.slice(0, 80)}${d.titulo.length > 80 ? "…" : ""}</small>`
      : `<strong>${d.acronimo}</strong>`;
    tr.innerHTML = `
      <td>${d.folio || "—"}</td>
      <td>${d.id || "—"}</td>
      <td>${label}</td>
      <td>${d.institucion}</td>
      <td>${d.unidad || "—"}</td>
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
