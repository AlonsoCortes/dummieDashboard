/* ============================================================
   maps/mapa.js — Vista geoespacial del dashboard SECTEI
   Sub-vistas: "instituciones" (puntos WKT) | "incidencia" (GeoJSON)
   Incidencia: overview (29 centroides) → detalle (geometría completa)
   ============================================================ */

import { DORADO } from "../config.js";
import { parseWKTPoint } from "../data.js";
import { formatoMXN }   from "../kpis.js";

// ── Paleta categórica de 29 colores ─────────────────────────
const PALETA_INCIDENCIA = [
  "#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f",
  "#edc948","#b07aa1","#ff9da7","#9c755f","#bab0ac",
  "#e41a1c","#377eb8","#4daf4a","#984ea3","#ff7f00",
  "#a65628","#f781bf","#999999","#66c2a5",
  "#8dd3c7","#fdb462","#bebada","#fb8072","#80b1d3",
  "#bc80bd","#b3de69","#fccde5","#d9d9d9","#ccebc5",
];

// ── Estado del módulo ────────────────────────────────────────
let map                    = null;
let layerInstituciones     = null;
let layerIncidencia        = null;
let layerOverview          = null;
let subvistaActual         = "instituciones";
let proyectoSeleccionado   = null;   // id_proyecto string | null
const colorMap             = new Map(); // id_proyecto → color
let _cachedGeoJSON         = null;
let _cachedDatos           = [];
let _lastAlcaldiaFiltro    = null; // null = inicial, "" = sin filtro, otro = filtro activo

const BOUNDS_CDMX = [[18.9, -99.5], [19.8, -98.7]];

// ── API pública ──────────────────────────────────────────────

export function getColorMap() { return colorMap; }

export function initMapa(datos, geojsonData, subvista = "instituciones", alcaldiaFiltro = "") {
  subvistaActual  = subvista;
  _cachedGeoJSON  = geojsonData;
  _cachedDatos    = datos;

  if (!map) {
    map = L.map("mapa-contenedor").fitBounds(BOUNDS_CDMX);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '© <a href="https://carto.com/attributions">CartoDB</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    layerInstituciones = L.layerGroup();
    layerIncidencia    = L.layerGroup();
    layerOverview      = L.layerGroup();

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => map.invalidateSize()).observe(
        document.getElementById("mapa-contenedor")
      );
    }
  }

  if (geojsonData) _buildColorMap(geojsonData.features);
  _renderCapas(datos, geojsonData, subvista, alcaldiaFiltro);
}

export function actualizarMapa(datos, subvista, alcaldiaFiltro = "", geojsonData = null) {
  if (!map) return;
  subvistaActual = subvista;
  _cachedDatos   = datos;
  if (geojsonData) _cachedGeoJSON = geojsonData;
  _renderCapas(datos, _cachedGeoJSON, subvista, alcaldiaFiltro);
}

export function invalidarTamano() {
  if (map) setTimeout(() => map.invalidateSize(), 150);
}

export function seleccionarProyectoIncidencia(idProyecto) {
  if (!map || !_cachedGeoJSON) return;
  proyectoSeleccionado = idProyecto;

  // Limpiar capa incidencia y reconstruir en modo detalle
  layerIncidencia.clearLayers();
  layerOverview.clearLayers();

  const feature = _cachedGeoJSON.features.find(
    f => String(f.properties.id_proyecto) === String(idProyecto)
  );
  if (feature) _renderIncidenciaDetalle(feature, _cachedDatos);

  _actualizarLeyenda(subvistaActual);
  _actualizarStats(_cachedDatos, subvistaActual, _cachedGeoJSON, "");

  document.dispatchEvent(new CustomEvent("mapaProyectoSeleccionado", { detail: idProyecto }));
}

export function limpiarSeleccionIncidencia() {
  if (!map) return;
  proyectoSeleccionado = null;

  layerIncidencia.clearLayers();
  layerOverview.clearLayers();

  if (_cachedGeoJSON) _renderIncidenciaOverview(_cachedGeoJSON.features, _cachedDatos);

  map.fitBounds(BOUNDS_CDMX);

  _actualizarLeyenda(subvistaActual);
  _actualizarStats(_cachedDatos, subvistaActual, _cachedGeoJSON, "");

  document.dispatchEvent(new CustomEvent("mapaProyectoSeleccionado", { detail: null }));
}

// ── Renderizado interno ──────────────────────────────────────

function _buildColorMap(features) {
  if (colorMap.size > 0) return;
  features.forEach((f, i) => {
    const id = String(f.properties.id_proyecto);
    colorMap.set(id, PALETA_INCIDENCIA[i % PALETA_INCIDENCIA.length]);
  });
}

function _getCentroid(feature) {
  try {
    const layer = L.geoJSON(feature);
    const b = layer.getBounds();
    return b.isValid() ? b.getCenter() : null;
  } catch {
    return null;
  }
}

function _renderCapas(datos, geojsonData, subvista, alcaldiaFiltro) {
  layerInstituciones.clearLayers();
  layerIncidencia.clearLayers();
  layerOverview.clearLayers();

  if (subvista === "instituciones") {
    if (map.hasLayer(layerIncidencia))    map.removeLayer(layerIncidencia);
    if (!map.hasLayer(layerInstituciones)) map.addLayer(layerInstituciones);
    _renderInstituciones(datos);
    // Solo ajusta el extent cuando el filtro de alcaldía cambia de valor
    const alcaldiaChanged = _lastAlcaldiaFiltro !== null && _lastAlcaldiaFiltro !== alcaldiaFiltro;
    _lastAlcaldiaFiltro = alcaldiaFiltro;
    if (alcaldiaChanged) {
      if (alcaldiaFiltro) {
        const bounds = layerInstituciones.getBounds();
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
      } else {
        map.fitBounds(BOUNDS_CDMX);
      }
    }
  } else {
    if (map.hasLayer(layerInstituciones)) map.removeLayer(layerInstituciones);
    if (!map.hasLayer(layerIncidencia))   map.addLayer(layerIncidencia);
    if (geojsonData) {
      if (proyectoSeleccionado) {
        const feature = geojsonData.features.find(
          f => String(f.properties.id_proyecto) === proyectoSeleccionado
        );
        if (feature) _renderIncidenciaDetalle(feature, datos);
      } else {
        _renderIncidenciaOverview(geojsonData.features, datos);
      }
    }
  }

  _actualizarLeyenda(subvista);
  _actualizarStats(datos, subvista, geojsonData, alcaldiaFiltro);
}

function _renderInstituciones(datos) {
  const instMap = new Map();
  datos.forEach(d => {
    if (!d.geometria) return;
    const coords = parseWKTPoint(d.geometria);
    if (!coords) return;
    if (!instMap.has(d.institucion)) {
      instMap.set(d.institucion, { ...coords, institucion: d.institucion, proyectos: [], monto: 0 });
    }
    const entry = instMap.get(d.institucion);
    entry.proyectos.push(d);
    entry.monto += d.monto;
  });

  if (instMap.size === 0) return;

  const counts = [...instMap.values()].map(v => v.proyectos.length);
  const minC   = Math.min(...counts);
  const maxC   = Math.max(...counts);
  const rScale = maxC === minC
    ? () => 12
    : n => 8 + ((n - minC) / (maxC - minC)) * 16;

  instMap.forEach(entry => {
    const n = entry.proyectos.length;
    const marker = L.circleMarker([entry.lat, entry.lng], {
      radius:      rScale(n),
      fillColor:   DORADO,
      color:       "#fff",
      weight:      1.5,
      fillOpacity: 0.85,
    });
    marker.bindPopup(`
      <b style="font-size:0.9rem">${entry.institucion}</b><br>
      <span style="color:#666">${n} proyecto${n !== 1 ? "s" : ""}</span><br>
      ${formatoMXN(entry.monto)}
    `);
    layerInstituciones.addLayer(marker);
  });
}

function _renderIncidenciaOverview(features, datos) {
  const idMap     = new Map(datos.map(d => [String(d.id), d]));
  const idsEnDatos = new Set(datos.map(d => String(d.id)));

  features
    .filter(f => idsEnDatos.has(String(f.properties.id_proyecto)))
    .forEach(f => {
      const center = _getCentroid(f);
      if (!center) return;
      const id     = String(f.properties.id_proyecto);
      const color  = colorMap.get(id) || "#888";
      const proj   = idMap.get(id);
      const titulo = proj ? (proj.titulo || proj.acronimo) : `Proyecto ${id}`;
      const nivel  = f.properties.posible_incidencia || "";

      const marker = L.circleMarker(center, {
        radius:      8,
        fillColor:   color,
        color:       "#fff",
        weight:      2,
        fillOpacity: 0.9,
      });
      marker.bindTooltip(
        `<span style="font-size:0.8rem"><b>${titulo}</b><br>Incidencia ${nivel}</span>`,
        { permanent: false, direction: "top" }
      );
      marker.on("click", () => seleccionarProyectoIncidencia(id));
      layerOverview.addLayer(marker);
    });

  layerIncidencia.addLayer(layerOverview);
}

function _renderIncidenciaDetalle(feature, datos) {
  const id    = String(feature.properties.id_proyecto);
  const color = colorMap.get(id) || "#888";
  const idMap = new Map(datos.map(d => [String(d.id), d]));
  const proj  = idMap.get(id);
  const titulo = proj ? (proj.titulo || proj.acronimo) : `Proyecto ${id}`;
  const score  = feature.properties.score_incidencia ?? "—";
  const nivel  = feature.properties.posible_incidencia || "—";
  const capas  = feature.properties.capas_fuente || "—";
  const nGeom  = feature.properties.n_geometrias ?? "—";

  const geoLayer = L.geoJSON(feature, {
    style: () => ({
      fillColor:   color,
      color:       color,
      weight:      2,
      fillOpacity: 0.45,
      opacity:     0.9,
    }),
    pointToLayer: (f, latlng) => L.circleMarker(latlng, {
      radius:      9,
      fillColor:   color,
      color:       "#fff",
      weight:      2,
      fillOpacity: 0.9,
    }),
    onEachFeature: (f, layer) => {
      layer.bindPopup(`
        <b style="font-size:0.9rem;display:block;margin-bottom:4px">${titulo}</b>
        <span style="color:#666">Incidencia:</span> ${nivel} &nbsp;(score: ${score})<br>
        <span style="color:#666">Capa fuente:</span> ${capas}<br>
        <span style="color:#666">Geometrías:</span> ${nGeom}
      `);
    },
  });

  layerIncidencia.addLayer(geoLayer);

  try {
    const bounds = geoLayer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  } catch { /* GeometryCollection edge case */ }
}

// ── Sidebar: leyenda y estadísticas ─────────────────────────

function _actualizarLeyenda(subvista) {
  const el = document.getElementById("mapa-leyenda");
  if (!el) return;
  if (subvista === "instituciones") {
    el.innerHTML = `
      <div class="mapa-leyenda-bloque">
        <div class="sidebar-chart-label">Leyenda</div>
        <div class="mapa-leyenda-item">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="7" r="6" fill="${DORADO}" fill-opacity="0.85" stroke="#fff" stroke-width="1.5"/>
          </svg>
          <span>Institución · tamaño = proyectos</span>
        </div>
      </div>`;
  } else if (proyectoSeleccionado) {
    const color = colorMap.get(proyectoSeleccionado) || "#888";
    el.innerHTML = `
      <div class="mapa-leyenda-bloque">
        <div class="sidebar-chart-label">Proyecto seleccionado</div>
        <div class="mapa-leyenda-item">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="1" y="1" width="12" height="12" rx="2" fill="${color}" fill-opacity="0.8"/>
          </svg>
          <span>Incidencia territorial</span>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <div class="mapa-leyenda-bloque">
        <div class="sidebar-chart-label">Clic en un punto para ver detalle</div>
      </div>`;
  }
}

function _actualizarStats(datos, subvista, geojsonData, alcaldiaFiltro) {
  const el = document.getElementById("mapa-stats");
  if (!el) return;
  if (subvista === "instituciones") {
    const datosCon = datos.filter(d => d.geometria);
    const numInst  = new Set(datosCon.map(d => d.institucion)).size;
    el.textContent = `${numInst} institución${numInst !== 1 ? "es" : ""} · ${datosCon.length} proyectos`;
  } else if (proyectoSeleccionado && geojsonData) {
    const f = geojsonData.features.find(
      feat => String(feat.properties.id_proyecto) === proyectoSeleccionado
    );
    if (f) {
      const score = f.properties.score_incidencia ?? "—";
      el.textContent = `Score incidencia: ${score} · ${f.properties.n_geometrias ?? "—"} geometría(s)`;
    }
  } else if (geojsonData) {
    const idsEnDatos = new Set(datos.map(d => String(d.id)));
    const n = geojsonData.features.filter(
      f => idsEnDatos.has(String(f.properties.id_proyecto))
    ).length;
    el.textContent = `${n} proyecto${n !== 1 ? "s" : ""} con incidencia territorial`;
  }
}
