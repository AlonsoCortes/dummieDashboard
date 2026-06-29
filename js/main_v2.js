/* ============================================================
   main_v2.js — Punto de entrada del dashboard SECTEI v2
   Orquesta la carga de datos, filtros y renderizado.
   Vistas: "general" | "institucion"
   ============================================================ */

import { cargarDatos }                              from "./data.js";
import { poblarFiltros, bindFiltros,
         datosFiltrados, datosFiltradosPorAnio,
         actualizarOpcionesInst, actualizarOpcionesUnidad } from "./filters.js";
import { renderKPIs }                               from "./kpis.js";
import { renderTabla, initTablaSort }               from "./tabla.js";
import { renderChartTendencia }                     from "./charts/tendencia.js";
import { renderChartMontoAnio }                     from "./charts/monto.js";
import { renderChartRadar }                         from "./charts/radar.js";
import { renderInstRanking }                        from "./charts/inst_ranking.js";
import { renderInstMontoRanking }                   from "./charts/inst_monto.js";
import { renderRTRanking }                          from "./charts/rt_ranking.js";
import { renderRTMontoRanking }                     from "./charts/rt_monto.js";
import { renderInstTimelineStacked }                from "./charts/inst_timeline_stacked.js";
import { initCustomSelect }                         from "./ui/customSelect.js";

let todosLosDatos    = [];
let vistaActual      = "general";
let instSeleccionada = null;
let rtSeleccionado   = null;

// ── Utilidades DOM ─────────────────────────────────────────
function show(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

// ── Filtro de unidad (dependiente de institución) ───────────
// La visibilidad del grupo la maneja aplicarVista; aquí solo se repuebla.
function syncUnidadFiltro(instActual) {
  actualizarOpcionesUnidad(todosLosDatos, instActual);
}

function resetUnidadFiltro() {
  const sel = document.getElementById("filtro-unidad");
  if (sel) { sel.value = ""; sel.innerHTML = '<option value="">Todas</option>'; }
}

// ── Búsqueda predictiva de institución ─────────────────────
function initInstSearch() {
  const input    = document.getElementById("inst-search-input");
  const dropdown = document.getElementById("inst-search-dropdown");
  if (!input || !dropdown) return;

  function getInsts() {
    const datos = datosFiltradosPorAnio(todosLosDatos);
    const named = [...new Set(datos.filter(d => d.institucion && d.institucion !== "Sin institución").map(d => d.institucion))].sort();
    const hasSin = datos.some(d => d.institucion === "Sin institución");
    return hasSin ? [...named, "Sin institución"] : named;
  }

  function showDropdown(insts) {
    dropdown.innerHTML = "";
    if (!insts.length) { dropdown.style.display = "none"; return; }
    insts.forEach(inst => {
      const li = document.createElement("li");
      li.className = "inst-search-option";
      li.textContent = inst;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        instSeleccionada = inst;
        input.value = inst;
        dropdown.style.display = "none";
        actualizarInst();
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = "block";
  }

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const insts = getInsts();
    showDropdown(q ? insts.filter(i => i.toLowerCase().includes(q)) : insts);
  });

  input.addEventListener("focus", () => {
    const q = input.value.toLowerCase().trim();
    const insts = getInsts();
    showDropdown(q ? insts.filter(i => i.toLowerCase().includes(q)) : insts);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 150);
  });
}

function syncInstSearch() {
  const input = document.getElementById("inst-search-input");
  if (input) input.value = instSeleccionada || "";
}

// ── Búsqueda predictiva de responsable técnico ─────────────
function initRTSearch() {
  const input    = document.getElementById("rt-search-input");
  const dropdown = document.getElementById("rt-search-dropdown");
  if (!input || !dropdown) return;

  function getRTs() {
    const datos = datosFiltradosPorAnio(todosLosDatos);
    return [...new Set(datos.map(d => d.nombreRT).filter(Boolean))].sort();
  }

  function showDropdown(rts) {
    dropdown.innerHTML = "";
    if (!rts.length) { dropdown.style.display = "none"; return; }
    rts.forEach(rt => {
      const li = document.createElement("li");
      li.className = "inst-search-option";
      li.textContent = rt;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        rtSeleccionado = rt;
        input.value = rt;
        dropdown.style.display = "none";
        actualizarRT();
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = "block";
  }

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const rts = getRTs();
    showDropdown(q ? rts.filter(r => r.toLowerCase().includes(q)) : rts);
  });

  input.addEventListener("focus", () => {
    const q = input.value.toLowerCase().trim();
    const rts = getRTs();
    showDropdown(q ? rts.filter(r => r.toLowerCase().includes(q)) : rts);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 150);
  });
}

function syncRTSearch() {
  const input = document.getElementById("rt-search-input");
  if (input) input.value = rtSeleccionado || "";
}

// ── Vista General ───────────────────────────────────────────
function actualizar() {
  const datos = datosFiltrados(todosLosDatos);
  renderKPIs(datos);
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderChartRadar(datos, "chart-radar");
  renderTabla(datos);
}

// ── Vista Institución ───────────────────────────────────────
function actualizarInst() {
  const datosPorAnio = datosFiltradosPorAnio(todosLosDatos);

  syncInstSearch();

  // Sidebar: rankings (siempre visibles en esta vista)
  renderInstRanking(datosPorAnio, instSeleccionada, sel => {
    instSeleccionada = sel;
    actualizarInst();
  });
  renderInstMontoRanking(datosPorAnio, instSeleccionada, sel => {
    instSeleccionada = sel;
    actualizarInst();
  });

  // Filtro unidad: solo relevante cuando hay institución seleccionada
  syncUnidadFiltro(instSeleccionada);

  const unidad = document.getElementById("filtro-unidad")?.value || "";
  const datosInst = instSeleccionada
    ? datosPorAnio
        .filter(d => d.institucion === instSeleccionada)
        .filter(d => !unidad || d.unidad === unidad)
    : datosPorAnio;

  renderKPIs(datosInst);
  renderTabla(datosInst);

  const unidadesCard = document.getElementById("kpi-unidades-card");

  if (instSeleccionada) {
    const numUnidades = new Set(datosInst.map(d => d.unidad).filter(Boolean)).size;
    document.getElementById("kpi-unidades").textContent = numUnidades;
    if (unidadesCard) unidadesCard.style.display = "";
  } else {
    if (unidadesCard) unidadesCard.style.display = "none";
  }

  hide("chart-section-general");
  show("chart-inst-row");
  renderInstTimelineStacked(datosInst);

  if (instSeleccionada) {
    show("inst-header");
    document.getElementById("inst-nombre").textContent = instSeleccionada;
    document.getElementById("inst-badge").textContent =
      `${datosInst.length} proyecto${datosInst.length !== 1 ? "s" : ""}`;
  } else {
    hide("inst-header");
  }
}

// ── Vista Responsable Técnico ───────────────────────────────
function actualizarRT() {
  const datosPorAnio = datosFiltradosPorAnio(todosLosDatos);

  syncRTSearch();

  // Sidebar: rankings sin filtro de año (universo completo)
  renderRTRanking(todosLosDatos, rtSeleccionado, sel => {
    rtSeleccionado = sel;
    actualizarRT();
  });
  renderRTMontoRanking(todosLosDatos, rtSeleccionado, sel => {
    rtSeleccionado = sel;
    actualizarRT();
  });

  // Panel principal: respeta el filtro de año
  const datosRT = rtSeleccionado
    ? datosPorAnio.filter(d => d.nombreRT === rtSeleccionado)
    : datosPorAnio;

  renderKPIs(datosRT);
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderTabla(datosRT);

  hide("chart-section-general");
  show("chart-inst-row");
  renderInstTimelineStacked(datosRT);

  if (rtSeleccionado) {
    show("rt-header");
    document.getElementById("rt-nombre").textContent = rtSeleccionado;
    document.getElementById("rt-badge").textContent =
      `${datosRT.length} proyecto${datosRT.length !== 1 ? "s" : ""}`;
  } else {
    hide("rt-header");
  }
}

// ── Cambio de vista ─────────────────────────────────────────
function aplicarVista(vista) {
  vistaActual = vista;
  instSeleccionada = null;
  rtSeleccionado = null;

  // Reset completo — cada vista arranca sin filtros del tab anterior
  document.getElementById("filtro-year").value = "";
  const selInst = document.getElementById("filtro-inst");
  selInst.value = "";
  if (typeof selInst._syncCustomSelect === "function") selInst._syncCustomSelect();
  actualizarOpcionesInst(todosLosDatos);
  resetUnidadFiltro();

  document.querySelectorAll(".vista-tab").forEach(btn => {
    btn.classList.toggle("vista-tab--activa", btn.dataset.vista === vistaActual);
  });

  const resumenRow = document.querySelector(".resumen-top-row");

  if (vistaActual === "general") {
    resumenRow.classList.remove("resumen-top-row--inst");
    show("filtro-inst-group");
    show("sidebar-charts-general");
    hide("sidebar-charts-inst");

    hide("inst-search-section");
    hide("inst-header");
    hide("rt-search-section");
    hide("rt-header");
    show("chart-section-general");
    hide("chart-inst-row");

    actualizar();
  } else if (vistaActual === "institucion") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    hide("sidebar-charts-general");
    show("sidebar-charts-inst");
    hide("sidebar-charts-rt");

    show("inst-search-section");
    hide("rt-search-section");
    hide("rt-header");
    syncInstSearch();

    actualizarInst();
  } else if (vistaActual === "rt") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    hide("sidebar-charts-general");
    hide("sidebar-charts-inst");
    show("sidebar-charts-rt");

    hide("inst-search-section");
    hide("inst-header");
    show("rt-search-section");
    syncRTSearch();

    actualizarRT();
  }
}

// ── Bootstrap ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    todosLosDatos = await cargarDatos();
    poblarFiltros(todosLosDatos);
    initCustomSelect("filtro-inst");
    initTablaSort();
    initInstSearch();
    initRTSearch();

    // Filtros: callback view-aware
    bindFiltros(
      () => todosLosDatos,
      () => vistaActual === "institucion" ? actualizarInst()
           : vistaActual === "rt"         ? actualizarRT()
           : actualizar()
    );

    // Sincronizar filtro unidad cuando cambia año o institución en vista general
    document.getElementById("filtro-year").addEventListener("change", () => {
      if (vistaActual === "general") {
        syncUnidadFiltro(document.getElementById("filtro-inst").value);
      }
    });
    document.getElementById("filtro-inst").addEventListener("change", () => {
      if (vistaActual === "general") {
        syncUnidadFiltro(document.getElementById("filtro-inst").value);
      }
    });

    // Tabs de navegación
    document.querySelectorAll(".vista-tab:not(.vista-tab--disabled)").forEach(btn => {
      btn.addEventListener("click", () => aplicarVista(btn.dataset.vista));
    });

    // Botón "Limpiar selección" en inst-header
    document.getElementById("inst-clear").addEventListener("click", () => {
      instSeleccionada = null;
      syncInstSearch();
      resetUnidadFiltro();
      actualizarInst();
    });

    // Botón "Limpiar selección" en rt-header
    document.getElementById("rt-clear").addEventListener("click", () => {
      rtSeleccionado = null;
      syncRTSearch();
      actualizarRT();
    });

    // Charts globales (solo vista general, se renderizan una vez)
    renderChartTendencia(todosLosDatos);
    renderChartMontoAnio(todosLosDatos);

    // Render inicial
    actualizar();
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
});
