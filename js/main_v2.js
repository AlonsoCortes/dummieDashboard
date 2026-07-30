/* ============================================================
   main_v2.js — Punto de entrada del dashboard SECTEI v2
   Orquesta la carga de datos, filtros y renderizado.
   Vistas: "general" | "institucion" | "rt" | "seguimiento"
   ============================================================ */

import { cargarDatos }                              from "./data.js";
import { poblarFiltros, bindFiltros,
         datosFiltrados, datosFiltradosPorAnio,
         datosFiltradosParaMonto,
         actualizarOpcionesInst, actualizarOpcionesUnidad } from "./filters.js";
import { renderKPIs }                               from "./kpis.js";
import { renderTabla, initTablaSort,
         setRowClickHandler, clearRowClickHandler }  from "./tabla.js";
import { renderChartTendencia }                     from "./charts/tendencia.js";
import { renderChartMontoAnio }                     from "./charts/monto.js";
import { renderChartRadar }                         from "./charts/radar.js";
import { renderInstRanking }                        from "./charts/inst_ranking.js";
import { renderInstMontoRanking }                   from "./charts/inst_monto.js";
import { renderRTRanking }                          from "./charts/rt_ranking.js";
import { renderRTMontoRanking }                     from "./charts/rt_monto.js";
import { renderAreaRanking }                        from "./charts/area_ranking.js";
import { renderSeguimientoRanking }                 from "./charts/seguimiento_ranking.js";
import { renderInstTimelineStacked }                from "./charts/inst_timeline_stacked.js";
import { initCustomSelect }                         from "./ui/customSelect.js";
import { initMapa, actualizarMapa, invalidarTamano,
         seleccionarProyectoIncidencia, limpiarSeleccionIncidencia,
         getColorMap, getLabelPorCapa } from "./maps/mapa.js";

let todosLosDatos           = [];
let vistaActual             = "general";
let instSeleccionada        = null;
let rtSeleccionado          = null;
let areaSeleccionada        = null;
let seguimientoSeleccionado = null;
let geojsonCargado          = null;
let mapaInicializado        = false;

// ── Utilidades DOM ─────────────────────────────────────────
function show(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

// ── Filtro de unidad (dependiente de institución) ───────────
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

// ── Búsqueda predictiva de área ─────────────────────────────
function initAreaSearch() {
  const input    = document.getElementById("area-search-input");
  const dropdown = document.getElementById("area-search-dropdown");
  if (!input || !dropdown) return;

  function getAreas() {
    const datos = datosFiltradosPorAnio(todosLosDatos);
    return [...new Set(datos.map(d => d.areaCaptura).filter(Boolean))].sort();
  }

  function showDropdown(areas) {
    dropdown.innerHTML = "";
    if (!areas.length) { dropdown.style.display = "none"; return; }
    areas.forEach(area => {
      const li = document.createElement("li");
      li.className = "inst-search-option";
      li.textContent = area;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        areaSeleccionada = area;
        input.value = area;
        dropdown.style.display = "none";
        seguimientoSeleccionado = null;
        syncSeguimientoPersonSearch();
        actualizarSeguimiento();
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = "block";
  }

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const areas = getAreas();
    showDropdown(q ? areas.filter(a => a.toLowerCase().includes(q)) : areas);
  });

  input.addEventListener("focus", () => {
    const q = input.value.toLowerCase().trim();
    const areas = getAreas();
    showDropdown(q ? areas.filter(a => a.toLowerCase().includes(q)) : areas);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 150);
  });
}

function syncAreaSearch() {
  const input = document.getElementById("area-search-input");
  if (input) input.value = areaSeleccionada || "";
}

// ── Búsqueda predictiva de responsable de seguimiento ───────
function initSeguimientoPersonSearch() {
  const input    = document.getElementById("seg-person-search-input");
  const dropdown = document.getElementById("seg-person-search-dropdown");
  if (!input || !dropdown) return;

  function getPersonas() {
    const datos = datosFiltradosPorAnio(todosLosDatos);
    const base = areaSeleccionada
      ? datos.filter(d => d.areaCaptura === areaSeleccionada)
      : datos;
    return [...new Set(base.map(d => d.seguimiento).filter(Boolean))].sort();
  }

  function showDropdown(personas) {
    dropdown.innerHTML = "";
    if (!personas.length) { dropdown.style.display = "none"; return; }
    personas.forEach(p => {
      const li = document.createElement("li");
      li.className = "inst-search-option";
      li.textContent = p;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        seguimientoSeleccionado = p;
        input.value = p;
        dropdown.style.display = "none";
        actualizarSeguimiento();
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = "block";
  }

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const personas = getPersonas();
    showDropdown(q ? personas.filter(p => p.toLowerCase().includes(q)) : personas);
  });

  input.addEventListener("focus", () => {
    const q = input.value.toLowerCase().trim();
    const personas = getPersonas();
    showDropdown(q ? personas.filter(p => p.toLowerCase().includes(q)) : personas);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 150);
  });
}

function syncSeguimientoPersonSearch() {
  const input = document.getElementById("seg-person-search-input");
  if (input) input.value = seguimientoSeleccionado || "";
}

// ── Vista Mapa ──────────────────────────────────────────────
function poblarListaIncidencia(geojsonFeatures, datos) {
  const container = document.getElementById("incidencia-lista-items");
  if (!container) return;
  container.innerHTML = "";

  const idMap      = new Map(datos.map(d => [String(d.id), d]));
  const idsEnDatos = new Set(datos.map(d => String(d.id)));
  const colores    = getColorMap();

  const features = geojsonFeatures.filter(f => idsEnDatos.has(String(f.properties.ID)));

  if (features.length === 0) {
    container.innerHTML = '<p style="font-size:0.78rem;color:#999;padding:0.4rem 0.5rem">Sin proyectos para el año seleccionado.</p>';
    return;
  }

  features.forEach(f => {
    const id    = String(f.properties.ID);
    const proj  = idMap.get(id);
    const titulo = proj ? (proj.titulo || proj.acronimo || `Proyecto ${id}`) : `Proyecto ${id}`;
    const color = colores.get(id) || "#888";
    const capas = f.properties.capas_geometria || "";

    const item = document.createElement("div");
    item.className = "incidencia-item";
    item.dataset.id = id;
    item.innerHTML = `
      <span class="incidencia-swatch" style="background:${color}"></span>
      <span class="incidencia-titulo" title="${titulo}">${titulo}</span>
      <span class="incidencia-badge" style="background:${color};color:#fff">${getLabelPorCapa(capas)}</span>
    `;
    item.addEventListener("click", () => seleccionarProyectoIncidencia(id));
    container.appendChild(item);
  });
}

async function actualizarMapaVista() {
  const datos = datosFiltradosPorAnio(todosLosDatos);

  if (!geojsonCargado) {
    geojsonCargado = await d3.json("datos/proyectos_geometrias.geojson");
  }

  if (!mapaInicializado) {
    initMapa(datos, geojsonCargado);
    mapaInicializado = true;
  } else {
    actualizarMapa(datos, geojsonCargado);
  }
  invalidarTamano();

  const idsConGeojson = new Set(geojsonCargado.features.map(f => String(f.properties.ID)));
  renderTabla(datos.filter(d => idsConGeojson.has(String(d.id))));
}

// ── Vista General ───────────────────────────────────────────
function actualizar() {
  const datos       = datosFiltrados(todosLosDatos);
  const datosMonto  = datosFiltradosParaMonto(todosLosDatos);
  renderKPIs(datos, datosMonto);
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderChartRadar(datos, "chart-radar");
  renderTabla(datos);
}

// ── Vista Institución ───────────────────────────────────────
function actualizarInst() {
  const datosPorAnio = datosFiltradosPorAnio(todosLosDatos);

  syncInstSearch();

  renderInstRanking(datosPorAnio, instSeleccionada, sel => {
    instSeleccionada = sel;
    actualizarInst();
  });
  renderInstMontoRanking(datosPorAnio, instSeleccionada, sel => {
    instSeleccionada = sel;
    actualizarInst();
  });

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

  renderRTRanking(todosLosDatos, rtSeleccionado, sel => {
    rtSeleccionado = sel;
    actualizarRT();
  });
  renderRTMontoRanking(todosLosDatos, rtSeleccionado, sel => {
    rtSeleccionado = sel;
    actualizarRT();
  });

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

// ── Vista Seguimiento ───────────────────────────────────────
function actualizarSeguimiento() {
  const datosPorAnio = datosFiltradosPorAnio(todosLosDatos);

  syncAreaSearch();
  syncSeguimientoPersonSearch();

  // Sidebar usa universo completo (sin filtro de año)
  renderAreaRanking(todosLosDatos, areaSeleccionada, sel => {
    areaSeleccionada = sel;
    seguimientoSeleccionado = null;
    syncSeguimientoPersonSearch();
    actualizarSeguimiento();
  });
  renderSeguimientoRanking(todosLosDatos, seguimientoSeleccionado, sel => {
    seguimientoSeleccionado = sel;
    actualizarSeguimiento();
  });

  // Panel principal: respeta filtro de año + área + responsable
  let datosSeg = datosPorAnio;
  if (areaSeleccionada)        datosSeg = datosSeg.filter(d => d.areaCaptura === areaSeleccionada);
  if (seguimientoSeleccionado) datosSeg = datosSeg.filter(d => d.seguimiento === seguimientoSeleccionado);

  renderKPIs(datosSeg);
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderTabla(datosSeg);

  hide("chart-section-general");
  show("chart-inst-row");
  renderInstTimelineStacked(datosSeg);

  if (areaSeleccionada || seguimientoSeleccionado) {
    show("seguimiento-header");
    const partes = [areaSeleccionada, seguimientoSeleccionado].filter(Boolean);
    document.getElementById("seguimiento-nombre").textContent = partes.join(" — ");
    document.getElementById("seguimiento-badge").textContent =
      `${datosSeg.length} proyecto${datosSeg.length !== 1 ? "s" : ""}`;
  } else {
    hide("seguimiento-header");
  }
}

// ── Cambio de vista ─────────────────────────────────────────
function aplicarVista(vista) {
  vistaActual = vista;
  instSeleccionada = null;
  rtSeleccionado = null;
  areaSeleccionada = null;
  seguimientoSeleccionado = null;

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
  const mainContent = document.querySelector(".main-content");
  mainContent.classList.toggle("main-content--mapa", vistaActual === "mapa");
  if (vistaActual === "mapa") {
    setTimeout(() => invalidarTamano(), 300);
    setRowClickHandler(d => {
      if (!geojsonCargado) return;
      const hasGeom = geojsonCargado.features.some(f => String(f.properties.ID) === String(d.id));
      if (hasGeom) seleccionarProyectoIncidencia(String(d.id));
    });
  } else {
    clearRowClickHandler();
  }

  if (vistaActual === "general") {
    resumenRow.classList.remove("resumen-top-row--inst");
    show("filtro-inst-group");
    show("filtro-modalidad-group");
    show("filtro-alcaldia-group");
    show("sidebar-charts-general");
    hide("sidebar-charts-inst");
    hide("sidebar-charts-rt");
    hide("sidebar-charts-seguimiento");
    hide("sidebar-charts-mapa");

    hide("inst-search-section");
    hide("inst-header");
    hide("rt-search-section");
    hide("rt-header");
    hide("seguimiento-search-section");
    hide("seguimiento-header");
    show("chart-section-general");
    hide("chart-inst-row");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");

    actualizar();
  } else if (vistaActual === "institucion") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    show("filtro-modalidad-group");
    show("filtro-alcaldia-group");
    hide("sidebar-charts-general");
    show("sidebar-charts-inst");
    hide("sidebar-charts-rt");
    hide("sidebar-charts-seguimiento");
    hide("sidebar-charts-mapa");

    show("inst-search-section");
    hide("rt-search-section");
    hide("rt-header");
    hide("seguimiento-search-section");
    hide("seguimiento-header");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");
    syncInstSearch();

    actualizarInst();
  } else if (vistaActual === "rt") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    show("filtro-modalidad-group");
    show("filtro-alcaldia-group");
    hide("sidebar-charts-general");
    hide("sidebar-charts-inst");
    show("sidebar-charts-rt");
    hide("sidebar-charts-seguimiento");
    hide("sidebar-charts-mapa");

    hide("inst-search-section");
    hide("inst-header");
    show("rt-search-section");
    hide("seguimiento-search-section");
    hide("seguimiento-header");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");
    syncRTSearch();

    actualizarRT();
  } else if (vistaActual === "seguimiento") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    show("filtro-modalidad-group");
    show("filtro-alcaldia-group");
    hide("sidebar-charts-general");
    hide("sidebar-charts-inst");
    hide("sidebar-charts-rt");
    show("sidebar-charts-seguimiento");
    hide("sidebar-charts-mapa");

    hide("inst-search-section");
    hide("inst-header");
    hide("rt-search-section");
    hide("rt-header");
    show("seguimiento-search-section");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");
    syncAreaSearch();
    syncSeguimientoPersonSearch();

    actualizarSeguimiento();
  } else if (vistaActual === "mapa") {
    resumenRow.classList.remove("resumen-top-row--inst");
    hide("filtro-inst-group");
    hide("filtro-modalidad-group");
    hide("filtro-alcaldia-group");
    hide("sidebar-charts-general");
    hide("sidebar-charts-inst");
    hide("sidebar-charts-rt");
    hide("sidebar-charts-seguimiento");
    show("sidebar-charts-mapa");

    hide("inst-search-section");  hide("inst-header");
    hide("rt-search-section");    hide("rt-header");
    hide("seguimiento-search-section"); hide("seguimiento-header");
    hide("chart-section-general");
    hide("chart-inst-row");
    hide("resumen-wrapper");
    show("mapa-section");
    show("tabla-section-wrap");

    actualizarMapaVista();
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
    initAreaSearch();
    initSeguimientoPersonSearch();

    bindFiltros(
      () => todosLosDatos,
      () => vistaActual === "institucion"  ? actualizarInst()
           : vistaActual === "rt"          ? actualizarRT()
           : vistaActual === "seguimiento" ? actualizarSeguimiento()
           : vistaActual === "mapa"        ? (limpiarSeleccionIncidencia(), actualizarMapaVista())
           : actualizar()
    );

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

    document.querySelectorAll(".vista-tab:not(.vista-tab--disabled)").forEach(btn => {
      btn.addEventListener("click", () => aplicarVista(btn.dataset.vista));
    });

    document.getElementById("inst-clear").addEventListener("click", () => {
      instSeleccionada = null;
      syncInstSearch();
      resetUnidadFiltro();
      actualizarInst();
    });

    document.getElementById("rt-clear").addEventListener("click", () => {
      rtSeleccionado = null;
      syncRTSearch();
      actualizarRT();
    });

    document.getElementById("seguimiento-clear").addEventListener("click", () => {
      areaSeleccionada = null;
      seguimientoSeleccionado = null;
      syncAreaSearch();
      syncSeguimientoPersonSearch();
      actualizarSeguimiento();
    });

    document.getElementById("incidencia-volver")
      ?.addEventListener("click", () => limpiarSeleccionIncidencia());

    document.getElementById("mapa-volver-todos")
      ?.addEventListener("click", () => limpiarSeleccionIncidencia());

    document.addEventListener("mapaProyectoSeleccionado", e => {
      const id = e.detail;
      const btn    = document.getElementById("incidencia-volver");
      const btnMap = document.getElementById("mapa-volver-todos");
      if (btn)    btn.style.display    = id ? "" : "none";
      if (btnMap) btnMap.style.display = id ? "" : "none";

      const datosMapa = datosFiltradosPorAnio(todosLosDatos);
      if (id) {
        renderTabla(datosMapa.filter(d => String(d.id) === String(id)));
      } else if (geojsonCargado) {
        const idsConGeojson = new Set(geojsonCargado.features.map(f => String(f.properties.ID)));
        renderTabla(datosMapa.filter(d => idsConGeojson.has(String(d.id))));
      } else {
        renderTabla(datosMapa);
      }
    });

    const datosBase = todosLosDatos.filter(d => !d._itesmDup);
    renderChartTendencia(datosBase);
    renderChartMontoAnio(todosLosDatos);

    actualizar();
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
});
