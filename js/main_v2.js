/* ============================================================
   main_v2.js — Punto de entrada del dashboard SECTEI v2
   Orquesta la carga de datos, filtros y renderizado.
   ============================================================ */

import { cargarDatos }                        from "./data.js";
import { poblarFiltros, bindFiltros, datosFiltrados } from "./filters.js";
import { renderKPIs }                         from "./kpis.js";
import { renderTabla }                        from "./tabla.js";
import { renderChartTendencia }               from "./charts/tendencia.js";
import { renderChartMontoAnio }               from "./charts/monto.js";
import { renderChartRadar }                   from "./charts/radar.js";
import { initCustomSelect }                   from "./ui/customSelect.js";

let todosLosDatos = [];

function actualizar() {
  const datos = datosFiltrados(todosLosDatos);
  renderKPIs(datos);
  renderChartRadar(datos);
  renderTabla(datos);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    todosLosDatos = await cargarDatos();
    poblarFiltros(todosLosDatos);
    initCustomSelect("filtro-inst");   // dropdown personalizado para institución
    bindFiltros(() => todosLosDatos, actualizar);
    renderChartTendencia(todosLosDatos);   // globales — no se vuelven a llamar con filtros
    renderChartMontoAnio(todosLosDatos);
    actualizar();
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
});
