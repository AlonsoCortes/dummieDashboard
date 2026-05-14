/* ============================================================
   filters.js — Lógica de filtros (año, institución, unidad)
   ============================================================ */

function listaInstituciones(datos) {
  const named = [...new Set(datos.map(d => d.institucion).filter(i => i && i !== "Sin institución"))].sort();
  const hasSin = datos.some(d => d.institucion === "Sin institución");
  return hasSin ? [...named, "Sin institución"] : named;
}

export function poblarFiltros(datos) {
  const anios = [...new Set(datos.map(d => d.anio).filter(Boolean))].sort();
  const insts = listaInstituciones(datos);

  const selYear = document.getElementById("filtro-year");
  anios.forEach(a => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
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

// getTodos: función que devuelve el array completo (para el filtro encadenado)
// onCambio: callback que se llama cuando cambia cualquier filtro
export function bindFiltros(getTodos, onCambio) {
  document.getElementById("filtro-year").addEventListener("change", () => {
    actualizarOpcionesInst(getTodos());
    onCambio();
  });
  document.getElementById("filtro-inst").addEventListener("change", onCambio);
  document.getElementById("filtro-unidad")?.addEventListener("change", onCambio);
}

// Repuebla el select de institución según el año seleccionado
export function actualizarOpcionesInst(todos) {
  const anio      = document.getElementById("filtro-year").value;
  const selInst   = document.getElementById("filtro-inst");
  const valorActual = selInst.value;

  const base  = anio ? todos.filter(d => d.anio === anio) : todos;
  const insts = listaInstituciones(base);

  selInst.innerHTML = '<option value="">Todas</option>';
  insts.forEach(i => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    selInst.appendChild(opt);
  });

  // Conservar la selección si sigue disponible
  selInst.value = insts.includes(valorActual) ? valorActual : "";

  // Sincronizar el dropdown personalizado si existe
  if (typeof selInst._syncCustomSelect === "function") {
    selInst._syncCustomSelect();
  }
}

// Repuebla el select de unidad según el año e institución activos.
// Devuelve el número de opciones disponibles (0 = ocultar el grupo).
export function actualizarOpcionesUnidad(todos, instActual) {
  const sel = document.getElementById("filtro-unidad");
  if (!sel) return 0;

  if (!instActual) {
    sel.innerHTML = '<option value="">Todas</option>';
    sel.value = "";
    return 0;
  }

  const anio = document.getElementById("filtro-year").value;
  const base = todos
    .filter(d => !anio || d.anio === anio)
    .filter(d => d.institucion === instActual);

  const unidades = [...new Set(base.map(d => d.unidad).filter(Boolean))].sort();
  const valorActual = sel.value;

  sel.innerHTML = '<option value="">Todas</option>';
  unidades.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    sel.appendChild(opt);
  });

  sel.value = unidades.includes(valorActual) ? valorActual : "";

  return unidades.length;
}

export function datosFiltrados(todos) {
  const anio   = document.getElementById("filtro-year").value;
  const inst   = document.getElementById("filtro-inst").value;
  const unidad = document.getElementById("filtro-unidad")?.value || "";
  return todos.filter(d => {
    if (anio   && d.anio        !== anio)   return false;
    if (inst   && d.institucion !== inst)   return false;
    if (unidad && d.unidad      !== unidad) return false;
    return true;
  });
}

export function datosFiltradosPorAnio(todos) {
  const anio = document.getElementById("filtro-year").value;
  return anio ? todos.filter(d => d.anio === anio) : todos;
}
