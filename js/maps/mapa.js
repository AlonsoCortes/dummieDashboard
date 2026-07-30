/* ============================================================
   maps/mapa.js — Vista geoespacial del dashboard SECTEI
   Incidencia territorial: overview (centroides) → detalle (geometría completa)
   ============================================================ */

// ── Paleta temática por capa de incidencia ───────────────────
// color afín al tipo de lugar; label en español para la leyenda
const CATEGORIAS_CAPA = {
  "alcaldias":                   { color: "#B03A2E", label: "Alcaldía"              },
  "colonias":                    { color: "#CA6F1E", label: "Colonia"               },
  "p":                           { color: "#1A5276", label: "Sitio específico"      },
  "microcuencas":                { color: "#117A65", label: "Microcuenca"           },
  "sedema_suelo_conservacion":   { color: "#1E8449", label: "Suelo de conservación" },
  "spc_zonificacion_geotecnica": { color: "#6C3483", label: "Zona geotécnica"       },
  "spc_corrientes_agua":         { color: "#1F618D", label: "Corriente de agua"     },
  "pedregal_de_san_ngel":        { color: "#7E5109", label: "Pedregal"              },
};

function _colorPorCapa(capasGeometria) {
  const capa = (capasGeometria || "").split(",")[0].trim();
  return CATEGORIAS_CAPA[capa]?.color || "#888";
}

export function getLabelPorCapa(capasGeometria) {
  const capa = (capasGeometria || "").split(",")[0].trim();
  return CATEGORIAS_CAPA[capa]?.label || capa;
}

// ── Estado del módulo ────────────────────────────────────────
let map                    = null;
let layerIncidencia        = null;
let layerOverview          = null;
let proyectoSeleccionado   = null;
const colorMap             = new Map(); // id_proyecto → color
let _cachedGeoJSON         = null;
let _cachedDatos           = [];

const BOUNDS_CDMX = [[18.9, -99.5], [19.8, -98.7]];

// ── API pública ──────────────────────────────────────────────

export function getColorMap() { return colorMap; }

export function initMapa(datos, geojsonData) {
  _cachedGeoJSON = geojsonData;
  _cachedDatos   = datos;

  if (!map) {
    map = L.map("mapa-contenedor").fitBounds(BOUNDS_CDMX);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '© <a href="https://carto.com/attributions">CartoDB</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    layerIncidencia = L.layerGroup();
    layerOverview   = L.layerGroup();

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => map.invalidateSize()).observe(
        document.getElementById("mapa-contenedor")
      );
    }
  }

  if (geojsonData) _buildColorMap(geojsonData.features);
  _renderCapas(datos, geojsonData);
}

export function actualizarMapa(datos, geojsonData = null) {
  if (!map) return;
  _cachedDatos = datos;
  if (geojsonData) _cachedGeoJSON = geojsonData;
  _renderCapas(datos, _cachedGeoJSON);
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
    f => String(f.properties.ID) === String(idProyecto)
  );
  if (feature) _renderIncidenciaDetalle(feature, _cachedDatos);

  _actualizarLeyenda();
  _actualizarStats(_cachedDatos, _cachedGeoJSON);

  document.dispatchEvent(new CustomEvent("mapaProyectoSeleccionado", { detail: idProyecto }));
}

export function limpiarSeleccionIncidencia() {
  if (!map) return;
  proyectoSeleccionado = null;

  layerIncidencia.clearLayers();
  layerOverview.clearLayers();

  if (_cachedGeoJSON) _renderIncidenciaOverview(_cachedGeoJSON.features, _cachedDatos);

  map.fitBounds(BOUNDS_CDMX);

  _actualizarLeyenda();
  _actualizarStats(_cachedDatos, _cachedGeoJSON);

  document.dispatchEvent(new CustomEvent("mapaProyectoSeleccionado", { detail: null }));
}

// ── Renderizado interno ──────────────────────────────────────

function _buildColorMap(features) {
  if (colorMap.size > 0) return;
  features.forEach(f => {
    const id = String(f.properties.ID);
    colorMap.set(id, _colorPorCapa(f.properties.capas_geometria));
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

function _renderCapas(datos, geojsonData) {
  layerIncidencia.clearLayers();
  layerOverview.clearLayers();

  if (!map.hasLayer(layerIncidencia)) map.addLayer(layerIncidencia);

  if (geojsonData) {
    if (proyectoSeleccionado) {
      const feature = geojsonData.features.find(
        f => String(f.properties.ID) === proyectoSeleccionado
      );
      if (feature) _renderIncidenciaDetalle(feature, datos);
    } else {
      _renderIncidenciaOverview(geojsonData.features, datos);
    }
  }

  _actualizarLeyenda();
  _actualizarStats(datos, geojsonData);
}


function _renderIncidenciaOverview(features, datos) {
  const idMap     = new Map(datos.map(d => [String(d.id), d]));
  const idsEnDatos = new Set(datos.map(d => String(d.id)));

  features
    .filter(f => idsEnDatos.has(String(f.properties.ID)))
    .forEach(f => {
      const center = _getCentroid(f);
      if (!center) return;
      const id     = String(f.properties.ID);
      const proj   = idMap.get(id);
      const titulo = proj ? (proj.titulo || proj.acronimo) : `Proyecto ${id}`;
      const nombres = f.properties.nombres || "";

      const color = colorMap.get(id) || _colorPorCapa(f.properties.capas_geometria);
      const marker = L.circleMarker(center, {
        radius:      8,
        fillColor:   color,
        color:       "#fff",
        weight:      2,
        fillOpacity: 0.85,
      });
      marker.bindTooltip(
        `<span style="font-size:0.8rem"><b>${titulo}</b><br><span style="color:#ccc">${nombres}</span></span>`,
        { permanent: false, direction: "top" }
      );
      marker.on("click", () => seleccionarProyectoIncidencia(id));
      layerOverview.addLayer(marker);
    });

  layerIncidencia.addLayer(layerOverview);
}

function _renderIncidenciaDetalle(feature, datos) {
  const id    = String(feature.properties.ID);
  const color = colorMap.get(id) || "#888";
  const idMap = new Map(datos.map(d => [String(d.id), d]));
  const proj  = idMap.get(id);
  const titulo = proj ? (proj.titulo || proj.acronimo) : `Proyecto ${id}`;
  const capas  = feature.properties.capas_geometria || "—";
  const nGeom  = feature.properties.n_geometrias_gpkg ?? "—";
  const nombres = feature.properties.nombres || "—";

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
        <span style="color:#666">Lugares:</span> ${nombres}<br>
        <span style="color:#666">Capa:</span> ${capas}<br>
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

function _actualizarLeyenda() {
  const el = document.getElementById("mapa-leyenda");
  if (!el) return;
  if (proyectoSeleccionado) {
    const color = colorMap.get(proyectoSeleccionado) || "#888";
    const feature = _cachedGeoJSON?.features.find(
      f => String(f.properties.ID) === proyectoSeleccionado
    );
    const nombres = feature?.properties.nombres || "Incidencia territorial";
    // Cada nombre en la lista separada por coma → un ítem
    const nombresHtml = nombres.split(",").map(n => `
      <div class="mapa-leyenda-item">
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect x="1" y="1" width="12" height="12" rx="2" fill="${color}" fill-opacity="0.8"/>
        </svg>
        <span>${n.trim()}</span>
      </div>`).join("");
    el.innerHTML = `
      <div class="mapa-leyenda-bloque">
        <div class="sidebar-chart-label">Proyecto seleccionado</div>
        ${nombresHtml}
      </div>`;
  } else {
    // Categorías presentes en el GeoJSON actual
    const categoriasPresentes = new Map();
    (_cachedGeoJSON?.features || []).forEach(f => {
      const capa  = (f.properties.capas_geometria || "").split(",")[0].trim();
      const color = CATEGORIAS_CAPA[capa]?.color || "#888";
      const label = CATEGORIAS_CAPA[capa]?.label || capa;
      if (!categoriasPresentes.has(capa)) categoriasPresentes.set(capa, { color, label });
    });

    const itemsHtml = [...categoriasPresentes.values()].map(({ color, label }) => `
      <div class="mapa-leyenda-item">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="5" fill="${color}" fill-opacity="0.9" stroke="#fff" stroke-width="1.5"/>
        </svg>
        <span>${label}</span>
      </div>`).join("");

    el.innerHTML = `
      <div class="mapa-leyenda-bloque">
        <div class="sidebar-chart-label" style="margin-bottom:0.4rem">Tipo de lugar</div>
        ${itemsHtml}
        <div class="sidebar-chart-label" style="margin-top:0.6rem;font-style:italic">Clic en un punto para ver detalle</div>
      </div>`;
  }
}

function _actualizarStats(datos, geojsonData) {
  const el = document.getElementById("mapa-stats");
  if (!el) return;
  if (proyectoSeleccionado && geojsonData) {
    const f = geojsonData.features.find(
      feat => String(feat.properties.ID) === proyectoSeleccionado
    );
    if (f) {
      const capas = f.properties.capas_geometria || "—";
      el.textContent = `${f.properties.n_geometrias_gpkg ?? "—"} geometría(s) · capa: ${capas}`;
    }
  } else if (geojsonData) {
    const idsEnDatos = new Set(datos.map(d => String(d.id)));
    const n = geojsonData.features.filter(
      f => idsEnDatos.has(String(f.properties.ID))
    ).length;
    el.textContent = `${n} proyecto${n !== 1 ? "s" : ""} con incidencia territorial`;
  }
}
