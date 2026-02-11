/* ============================================================
   Dashboard SECTEI — main.js
   Carga CSV, filtros, KPIs, gráfica, mapa y tabla
   ============================================================ */

// Coordenadas aproximadas por alcaldía (placeholder)
const COORDS_ALCALDIA = {
  "Iztapalapa":         [19.3586, -99.0931],
  "Azcapotzalco":       [19.4869, -99.1837],
  "Cuauhtémoc":          [19.4326, -99.1332],
  "Tlalpan":             [19.2847, -99.1684],
  "Gustavo A. Madero":   [19.4748, -99.1134],
  "Santa Fe":            [19.3574, -99.2714],   // Cuajimalpa / Santa Fe
  "Cuajimalpa":          [19.3574, -99.2714],
  "Xochimilco":          [19.2618, -99.1036],
  "Coyoacán":            [19.3437, -99.1562],
  "Miguel Hidalgo":      [19.4326, -99.1916],
  "Álvaro Obregón":      [19.3551, -99.2095],
};

const GUINDA = "#9D2449";
const DORADO = "#B38E5D";

// Colores para las barras por eje (un degradado guinda→dorado)
const COLORES_EJES = [
  "#9D2449", "#A83C5C", "#B3546F", "#BD6D82",
  "#B38E5D", "#C4A577", "#8B1A3A",
];

let todosLosDatos = [];
let map = null;
let markersLayer = null;

/* ---- Inicialización ---- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    todosLosDatos = await cargarCSV();
    poblarFiltros(todosLosDatos);
    bindFiltros();
    initMapa();
    actualizar();
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
});

/* ---- Carga y parseo de CSV ---- */
async function cargarCSV() {
  const raw = await d3.csv("datos/proyectos_dummie.csv");
  return raw.map(d => ({
    ...d,
    monto: +d.monto_asignado_mxn,
    convocatorio: d.convocatorio.trim(),
  }));
}

/* ---- Filtros ---- */
function poblarFiltros(datos) {
  const years = [...new Set(datos.map(d => d.convocatorio))].sort();
  const insts = [...new Set(datos.map(d => d.institucion))].sort();

  const selYear = document.getElementById("filtro-year");
  years.forEach(y => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    selYear.appendChild(opt);
  });

  const selInst = document.getElementById("filtro-inst");
  insts.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selInst.appendChild(opt);
  });
}

function bindFiltros() {
  document.getElementById("filtro-year").addEventListener("change", actualizar);
  document.getElementById("filtro-inst").addEventListener("change", actualizar);
}

function datosFiltrados() {
  const year = document.getElementById("filtro-year").value;
  const inst = document.getElementById("filtro-inst").value;
  return todosLosDatos.filter(d => {
    if (year && d.convocatorio !== year) return false;
    if (inst && d.institucion !== inst) return false;
    return true;
  });
}

/* ---- Actualizar todo ---- */
function actualizar() {
  const datos = datosFiltrados();
  renderKPIs(datos);
  renderChart(datos);
  renderMapa(datos);
  renderTabla(datos);
}

/* ---- KPIs ---- */
function renderKPIs(datos) {
  const montoTotal = datos.reduce((s, d) => s + d.monto, 0);
  const numProyectos = datos.length;
  const numInstituciones = new Set(datos.map(d => d.institucion)).size;

  document.getElementById("kpi-monto").textContent = formatoMXN(montoTotal);
  document.getElementById("kpi-proyectos").textContent = numProyectos;
  document.getElementById("kpi-instituciones").textContent = numInstituciones;
}

function formatoMXN(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ---- Gráfica de barras (Observable Plot) ---- */
function renderChart(datos) {
  const container = document.getElementById("chart-barras");
  container.innerHTML = "";

  // Agrupar monto por eje estratégico
  const porEje = d3.rollups(
    datos,
    v => d3.sum(v, d => d.monto),
    d => d.eje_estrategico
  ).map(([eje, monto]) => ({ eje, monto }))
   .sort((a, b) => b.monto - a.monto);

  if (porEje.length === 0) {
    container.innerHTML = "<p style='padding:2rem;color:#999'>Sin datos para mostrar</p>";
    return;
  }

  const chart = Plot.plot({
    marginLeft: 200,
    marginRight: 60,
    width: container.clientWidth || 550,
    height: Math.max(250, porEje.length * 48),
    x: {
      label: "Monto asignado (MXN)",
      tickFormat: d => formatoMXN(d),
      grid: true,
    },
    y: {
      label: null,
      domain: porEje.map(d => d.eje),
    },
    marks: [
      Plot.barX(porEje, {
        x: "monto",
        y: "eje",
        fill: GUINDA,
        tip: true,
        title: d => `${d.eje}\n${formatoMXN(d.monto)}`,
      }),
      Plot.ruleX([0]),
    ],
    style: {
      fontSize: 12,
    },
  });

  container.appendChild(chart);
}

/* ---- Mapa (Leaflet) ---- */
function initMapa() {
  map = L.map("mapa").setView([19.38, -99.14], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function renderMapa(datos) {
  markersLayer.clearLayers();

  const markerIcon = L.divIcon({
    className: "custom-marker",
    html: `<svg width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${GUINDA}"/>
      <circle cx="12" cy="11" r="5" fill="white"/>
    </svg>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
  });

  datos.forEach(d => {
    const coords = COORDS_ALCALDIA[d.alcaldia];
    if (!coords) return;
    // Pequeño jitter para que no se apilen exactamente
    const lat = coords[0] + (Math.random() - 0.5) * 0.012;
    const lng = coords[1] + (Math.random() - 0.5) * 0.012;

    L.marker([lat, lng], { icon: markerIcon })
      .bindPopup(`
        <strong>${d.titulo_corto}</strong><br>
        ${d.institucion}<br>
        ${formatoMXN(d.monto)}<br>
        <em>${d.estatus_proyecto}</em>
      `)
      .addTo(markersLayer);
  });
}

/* ---- Tabla ---- */
function renderTabla(datos) {
  const tbody = document.getElementById("tabla-body");
  tbody.innerHTML = "";

  datos.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.titulo_corto}</td>
      <td>${d.institucion}</td>
      <td>${d.eje_estrategico}</td>
      <td style="text-align:right">${formatoMXN(d.monto)}</td>
      <td>${estatusBadge(d.estatus_proyecto)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function estatusBadge(estatus) {
  let cls = "";
  if (estatus === "En ejecución")  cls = "estatus--ejecucion";
  else if (estatus === "Finalizado") cls = "estatus--finalizado";
  else if (estatus === "Planeación") cls = "estatus--planeacion";
  return `<span class="estatus ${cls}">${estatus}</span>`;
}
