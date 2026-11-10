/* ============================================================
   charts/tipo_institucion.js — Barras horizontales: proyectos por tipo de institución
   ============================================================ */

// Colores por tipo — temáticos: academia=azul, salud=rosa, empresa=ámbar,
// OSC=verde, investigación=guinda institucional, gobierno=gris-azul, otro=gris
const TIPO_COLOR_MAP = {
  "Institución de educación superior": "#2563EB",  // azul académico
  "Institución de salud":              "#BE185D",  // rosa/salud
  "Empresa privada":                   "#D97706",  // ámbar/negocio
  "Asociación civil / OSC":            "#16A34A",  // verde/sociedad civil
  "Instituto / centro de investigación":"#7C1D35", // guinda SECTEI
  "Dependencia gubernamental":         "#4B5563",  // gris-azul/gobierno
  "Persona física":                    "#9CA3AF",  // gris neutro
};

function colorTipo(tipo) {
  return TIPO_COLOR_MAP[tipo] ?? "#6B7280";
}

export function renderTipoInstitucion(datos, containerId = "chart-inst-stacked") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const conteos = d3.rollups(
    datos.filter(d => d.tipoInstitucion),
    v => v.length,
    d => d.tipoInstitucion
  )
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  if (!conteos.length) {
    container.innerHTML = '<p style="color:#999;font-size:0.8rem">Sin datos.</p>';
    return;
  }

  const total = d3.sum(conteos, d => d.count);

  const chart = Plot.plot({
    width:  container.clientWidth || 520,
    height: Math.max(conteos.length * 38 + 40, 80),
    marginLeft: 230,
    marginRight: 70,
    x: { label: "Proyectos", grid: true, type: "sqrt" },
    y: { label: null, domain: conteos.map(d => d.tipo) },
    marks: [
      Plot.barX(conteos, {
        x: "count",
        y: "tipo",
        fill: d => colorTipo(d.tipo),
        rx: 3,
        tip: true,
        title: d => `${d.tipo}\n${d.count} proyectos (${((d.count / total) * 100).toFixed(1)}%)`,
      }),
      Plot.text(conteos, {
        x: "count",
        y: "tipo",
        text: d => `${d.count} (${((d.count / total) * 100).toFixed(0)}%)`,
        dx: 6,
        textAnchor: "start",
        fill: "#444",
        fontSize: 13,
      }),
    ],
  });

  container.appendChild(chart);
}
