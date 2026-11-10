/* ============================================================
   main_v2.js â€" Punto de entrada del dashboard SECTEI v2
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
import { renderAreaRanking, renderDireccionEncargadaRanking } from "./charts/area_ranking.js";
import { renderSeguimientoRanking }                 from "./charts/seguimiento_ranking.js";
import { renderEstadoProyecto }                     from "./charts/estado_proyecto.js";
import { renderInstTimelineStacked }                from "./charts/inst_timeline_stacked.js";
import { renderTipoInstitucion }                    from "./charts/tipo_institucion.js";
import { initCustomSelect }                         from "./ui/customSelect.js";
import { initMapa, actualizarMapa, invalidarTamano,
         seleccionarProyectoIncidencia, limpiarSeleccionIncidencia,
         getColorMap, getLabelPorCapa } from "./maps/mapa.js";

let todosLosDatos           = [];
let vistaActual             = "general";
let instSeleccionada        = null;
let rtSeleccionado          = null;
let areaSeleccionada              = null;
let direccionEncargadaSeleccionada = null;
let seguimientoSeleccionado       = null;
let geojsonCargado          = null;
let mapaInicializado        = false;

// â"€â"€ Utilidades DOM â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function show(id) { const el = document.getElementById(id); if (el) el.style.display = ""; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = "none"; }

// â"€â"€ Filtro de unidad (dependiente de instituciÃ³n) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function syncUnidadFiltro(instActual) {
  actualizarOpcionesUnidad(todosLosDatos, instActual);
}

function resetUnidadFiltro() {
  const sel = document.getElementById("filtro-unidad");
  if (sel) { sel.value = ""; sel.innerHTML = '<option value="">Todas</option>'; }
}


// â"€â"€ BÃºsqueda predictiva de instituciÃ³n â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function initInstSearch() {
  const input    = document.getElementById("inst-search-input");
  const dropdown = document.getElementById("inst-search-dropdown");
  if (!input || !dropdown) return;

  function getInsts() {
    const datos = datosFiltradosPorAnio(todosLosDatos);
    const named = [...new Set(datos.filter(d => d.institucion && d.institucion !== "Sin instituciÃ³n").map(d => d.institucion))].sort();
    const hasSin = datos.some(d => d.institucion === "Sin instituciÃ³n");
    return hasSin ? [...named, "Sin instituciÃ³n"] : named;
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

// â"€â"€ BÃºsqueda predictiva de responsable tÃ©cnico â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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

// â"€â"€ BÃºsqueda predictiva de Ã¡rea â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
        direccionEncargadaSeleccionada = null;
        seguimientoSeleccionado = null;
        syncDireccionEncargadaSearch();
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

// ── Búsqueda predictiva de Dirección Encargada ──────────────────
function initDireccionEncargadaSearch() {
  const input    = document.getElementById("dir-encargada-search-input");
  const dropdown = document.getElementById("dir-encargada-search-dropdown");
  if (!input || !dropdown) return;

  function getOpciones() {
    const datos = datosFiltradosPorAnio(todosLosDatos);
    const base = areaSeleccionada
      ? datos.filter(d => d.areaCaptura === areaSeleccionada)
      : datos;
    return [...new Set(base.map(d => d.direccionEncargada).filter(Boolean))].sort();
  }

  function showDropdown(opciones) {
    dropdown.innerHTML = "";
    if (!opciones.length) { dropdown.style.display = "none"; return; }
    opciones.forEach(op => {
      const li = document.createElement("li");
      li.className = "inst-search-option";
      li.textContent = op;
      li.addEventListener("mousedown", e => {
        e.preventDefault();
        direccionEncargadaSeleccionada = op;
        input.value = op;
        dropdown.style.display = "none";
        actualizarSeguimiento();
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = "block";
  }

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    const ops = getOpciones();
    showDropdown(q ? ops.filter(o => o.toLowerCase().includes(q)) : ops);
  });

  input.addEventListener("focus", () => {
    const q = input.value.toLowerCase().trim();
    const ops = getOpciones();
    showDropdown(q ? ops.filter(o => o.toLowerCase().includes(q)) : ops);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 150);
  });
}

function syncDireccionEncargadaSearch() {
  const input = document.getElementById("dir-encargada-search-input");
  if (input) input.value = direccionEncargadaSeleccionada || "";
}

// ── Búsqueda predictiva de responsable de seguimiento ───────────
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

// â"€â"€ Vista Mapa â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function poblarListaIncidencia(geojsonFeatures, datos) {
  const container = document.getElementById("incidencia-lista-items");
  if (!container) return;
  container.innerHTML = "";

  const idMap      = new Map(datos.map(d => [String(d.id), d]));
  const idsEnDatos = new Set(datos.map(d => String(d.id)));
  const colores    = getColorMap();

  const features = geojsonFeatures.filter(f => idsEnDatos.has(String(f.properties.ID)));

  if (features.length === 0) {
    container.innerHTML = '<p style="font-size:0.78rem;color:#999;padding:0.4rem 0.5rem">Sin proyectos para el aÃ±o seleccionado.</p>';
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

// â"€â"€ Vista General â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function actualizar() {
  const datos       = datosFiltrados(todosLosDatos);
  const datosMonto  = datosFiltradosParaMonto(todosLosDatos);
  renderKPIs(datos, datosMonto);
  document.getElementById("kpis-secundarios-wrapper").hidden = false;
  document.getElementById("kpis-estado-wrapper").hidden = true;
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderChartRadar(datos, "chart-radar");
  renderTabla(datos);
}

// â"€â"€ Vista InstituciÃ³n â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
  document.getElementById("kpis-secundarios-wrapper").hidden = false;
  document.getElementById("kpis-estado-wrapper").hidden = true;
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
  const titleInst = document.getElementById("chart-inst-row-title");
  if (titleInst) titleInst.textContent = "Tipo de institución";
  renderTipoInstitucion(datosInst, "chart-inst-stacked");

  if (instSeleccionada) {
    show("inst-header");
    document.getElementById("inst-nombre").textContent = instSeleccionada;
    document.getElementById("inst-badge").textContent =
      `${datosInst.length} proyecto${datosInst.length !== 1 ? "s" : ""}`;
  } else {
    hide("inst-header");
  }
}

// â"€â"€ Vista Responsable TÃ©cnico â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
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
  document.getElementById("kpis-secundarios-wrapper").hidden = false;
  document.getElementById("kpis-estado-wrapper").hidden = true;
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderTabla(datosRT);

  hide("chart-section-general");
  show("chart-inst-row");
  const titleRT = document.getElementById("chart-inst-row-title");
  if (titleRT) titleRT.textContent = "Proyectos por año y campo de estudio";
  renderInstTimelineStacked(datosRT);

  if (rtSeleccionado) {
    show("rt-header");
    document.getElementById("rt-nombre").textContent = rtSeleccionado;
    document.getElementById("rt-badge").textContent =
      `${datosRT.length} proyecto${datosRT.length !== 1 ? "s" : ""}`;

    const correo   = datosRT.find(d => d.rtCorreo)?.rtCorreo || "";
    const telefono = datosRT.find(d => d.rtTelefono)?.rtTelefono || "";
    const correoCard = document.getElementById("rt-contacto-correo-card");
    const telCard    = document.getElementById("rt-contacto-tel-card");
    if (correo) {
      const a = document.getElementById("rt-contacto-correo");
      a.href = `mailto:${correo}`;
      a.textContent = correo;
      correoCard.style.display = "";
    } else {
      correoCard.style.display = "none";
    }
    if (telefono) {
      document.getElementById("rt-contacto-tel").textContent = telefono;
      telCard.style.display = "";
    } else {
      telCard.style.display = "none";
    }
    if (correo || telefono) show("rt-contacto");
    else hide("rt-contacto");
  } else {
    hide("rt-header");
    hide("rt-contacto");
  }
}

// â"€â"€ Vista Seguimiento â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function actualizarSeguimiento() {
  const datosPorAnio = datosFiltradosPorAnio(todosLosDatos);

  syncAreaSearch();
  syncDireccionEncargadaSearch();
  syncSeguimientoPersonSearch();

  // Sidebar usa universo completo (sin filtro de año)
  renderAreaRanking(todosLosDatos, areaSeleccionada, sel => {
    areaSeleccionada = sel;
    direccionEncargadaSeleccionada = null;
    seguimientoSeleccionado = null;
    syncDireccionEncargadaSearch();
    syncSeguimientoPersonSearch();
    actualizarSeguimiento();
  });
  renderDireccionEncargadaRanking(todosLosDatos, direccionEncargadaSeleccionada, sel => {
    direccionEncargadaSeleccionada = sel;
    seguimientoSeleccionado = null;
    syncDireccionEncargadaSearch();
    syncSeguimientoPersonSearch();
    actualizarSeguimiento();
  });
  renderSeguimientoRanking(todosLosDatos, seguimientoSeleccionado, sel => {
    seguimientoSeleccionado = sel;
    actualizarSeguimiento();
  });

  // Panel principal: respeta filtro de año + área + dirección encargada + responsable
  let datosSeg = datosPorAnio;
  if (areaSeleccionada)              datosSeg = datosSeg.filter(d => d.areaCaptura === areaSeleccionada);
  if (direccionEncargadaSeleccionada) datosSeg = datosSeg.filter(d => d.direccionEncargada === direccionEncargadaSeleccionada);
  if (seguimientoSeleccionado)       datosSeg = datosSeg.filter(d => d.seguimiento === seguimientoSeleccionado);

  renderKPIs(datosSeg);
  document.getElementById("kpis-secundarios-wrapper").hidden = true;
  const estadoWrapper = document.getElementById("kpis-estado-wrapper");
  estadoWrapper.hidden = false;
  const vigente   = datosSeg.filter(d => d.estadoProyecto === "Vigente").length;
  const noVigente = datosSeg.filter(d => d.estadoProyecto === "No vigente").length;
  const cerrado   = datosSeg.filter(d => d.estadoProyecto === "Cerrado").length;
  document.getElementById("kpi-vigente").textContent    = vigente;
  document.getElementById("kpi-no-vigente").textContent = noVigente;
  document.getElementById("kpi-cerrado").textContent    = cerrado;
  const unidadesCard = document.getElementById("kpi-unidades-card");
  if (unidadesCard) unidadesCard.style.display = "none";
  renderTabla(datosSeg);

  hide("chart-section-general");
  show("chart-inst-row");
  const titleSeg = document.getElementById("chart-inst-row-title");
  if (titleSeg) titleSeg.textContent = "Estado de los proyectos";
  renderEstadoProyecto(datosSeg, "chart-inst-stacked");


  if (areaSeleccionada || direccionEncargadaSeleccionada || seguimientoSeleccionado) {
    show("seguimiento-header");
    const partes = [areaSeleccionada, direccionEncargadaSeleccionada, seguimientoSeleccionado].filter(Boolean);
    document.getElementById("seguimiento-nombre").textContent = partes.join(" — ");
    document.getElementById("seguimiento-badge").textContent =
      `${datosSeg.length} proyecto${datosSeg.length !== 1 ? "s" : ""}`;
  } else {
    hide("seguimiento-header");
  }
}

// â"€â"€ Cambio de vista â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
function aplicarVista(vista) {
  vistaActual = vista;
  instSeleccionada = null;
  rtSeleccionado = null;
  areaSeleccionada = null;
  direccionEncargadaSeleccionada = null;
  seguimientoSeleccionado = null;

  const elTitulo = document.getElementById("filtro-titulo");
  if (elTitulo) elTitulo.value = "";
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
    show("sidebar-charts-general");
    hide("sidebar-charts-inst");
    hide("sidebar-charts-rt");
    hide("sidebar-charts-seguimiento");
    hide("sidebar-charts-mapa");

    hide("inst-search-section");
    hide("inst-header");
    hide("rt-search-section");
    hide("rt-header");
    hide("rt-contacto");
    hide("seguimiento-search-section");
    hide("seguimiento-header");
    show("chart-section-general");
    hide("chart-inst-row");
    hide("estado-section");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");

    actualizar();
  } else if (vistaActual === "institucion") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    show("filtro-modalidad-group");
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
    hide("estado-section");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");
    syncInstSearch();

    actualizarInst();
  } else if (vistaActual === "rt") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    show("filtro-modalidad-group");
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
    hide("estado-section");
    hide("mapa-section");
    show("resumen-wrapper");
    show("tabla-section-wrap");
    syncRTSearch();

    actualizarRT();
  } else if (vistaActual === "seguimiento") {
    resumenRow.classList.add("resumen-top-row--inst");
    hide("filtro-inst-group");
    show("filtro-modalidad-group");
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
    syncDireccionEncargadaSearch();
    syncSeguimientoPersonSearch();

    actualizarSeguimiento();
  } else if (vistaActual === "mapa") {
    resumenRow.classList.remove("resumen-top-row--inst");
    hide("filtro-inst-group");
    hide("filtro-modalidad-group");
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
    hide("estado-section");
    hide("resumen-wrapper");
    show("mapa-section");
    show("tabla-section-wrap");

    actualizarMapaVista();
  }
}

// â"€â"€ Bootstrap â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
document.addEventListener("DOMContentLoaded", async () => {
  try {
    todosLosDatos = await cargarDatos();
    poblarFiltros(todosLosDatos);
    initCustomSelect("filtro-inst");
    initTablaSort();
    initInstSearch();
    initRTSearch();
    initAreaSearch();
    initDireccionEncargadaSearch();
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
      direccionEncargadaSeleccionada = null;
      seguimientoSeleccionado = null;
      syncAreaSearch();
      syncDireccionEncargadaSearch();
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

