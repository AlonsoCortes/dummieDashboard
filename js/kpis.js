/* ============================================================
   kpis.js — Tarjetas de indicadores clave
   ============================================================ */

// datosParaMonto: dataset para calcular montos (puede incluir filas _itesmDup
// cuyo monto es real). Si se omite, se usa el mismo array que para conteos.
export function renderKPIs(datos, datosParaMonto = datos) {
  const conMonto    = datosParaMonto.filter(d => d.monto > 0);
  const montoTotal  = datosParaMonto.reduce((s, d) => s + d.monto, 0);
  const numProyectos    = datos.length;
  const numInstituciones = new Set(datos.map(d => d.institucion)).size;
  const promedio = conMonto.length ? montoTotal / conMonto.length : 0;
  const maximo   = conMonto.length ? Math.max(...conMonto.map(d => d.monto)) : 0;
  const minimo   = conMonto.length ? Math.min(...conMonto.map(d => d.monto)) : 0;

  document.getElementById("kpi-monto").textContent        = formatoMXN(montoTotal);
  document.getElementById("kpi-proyectos").textContent    = numProyectos;
  document.getElementById("kpi-instituciones").textContent = numInstituciones;
  document.getElementById("kpi-promedio").textContent     = formatoMXN(promedio);
  document.getElementById("kpi-maximo").textContent       = formatoMXN(maximo);
  document.getElementById("kpi-minimo").textContent       = formatoMXN(minimo);
}

export function formatoMXN(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}
