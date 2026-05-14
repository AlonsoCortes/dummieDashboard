/* ============================================================
   filters.js — Lógica de filtros (año y institución)
   ============================================================ */

export function poblarFiltros(datos) {
  const anios = [...new Set(datos.map(d => d.anio).filter(Boolean))].sort();
  const insts = [...new Set(datos.map(d => d.institucion).filter(i => i !== "Sin institución"))].sort();

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
}

// Repuebla el select de institución según el año seleccionado
export function actualizarOpcionesInst(todos) {
  const anio      = document.getElementById("filtro-year").value;
  const selInst   = document.getElementById("filtro-inst");
  const valorActual = selInst.value;

  const base  = anio ? todos.filter(d => d.anio === anio) : todos;
  const insts = [...new Set(base.map(d => d.institucion).filter(i => i !== "Sin institución"))].sort();

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

export function datosFiltrados(todos) {
  const anio = document.getElementById("filtro-year").value;
  const inst = document.getElementById("filtro-inst").value;
  return todos.filter(d => {
    if (anio && d.anio !== anio) return false;
    if (inst && d.institucion !== inst) return false;
    return true;
  });
}
