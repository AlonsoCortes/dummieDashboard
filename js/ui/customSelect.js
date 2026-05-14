/* ============================================================
   ui/customSelect.js — Dropdown personalizado con texto envolvente
   Envuelve un <select> nativo (que queda oculto) y lo sincroniza
   para que toda la lógica de filtros existente siga funcionando.
   ============================================================ */

export function initCustomSelect(selectId) {
  const nativeSelect = document.getElementById(selectId);
  if (!nativeSelect) return;

  // Ocultar el select nativo pero mantenerlo en el DOM
  nativeSelect.style.display = "none";

  // Crear estructura del dropdown personalizado
  const wrapper = document.createElement("div");
  wrapper.className = "cselect";
  wrapper.setAttribute("data-for", selectId);

  const trigger = document.createElement("div");
  trigger.className = "cselect__trigger";
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const triggerText = document.createElement("span");
  triggerText.className = "cselect__trigger-text";

  const arrow = document.createElement("span");
  arrow.className = "cselect__arrow";
  arrow.innerHTML = "&#9660;";

  trigger.appendChild(triggerText);
  trigger.appendChild(arrow);

  const panel = document.createElement("ul");
  panel.className = "cselect__panel";
  panel.setAttribute("role", "listbox");

  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);

  // Insertar el wrapper justo antes del select oculto
  nativeSelect.parentNode.insertBefore(wrapper, nativeSelect);

  // Sincroniza el panel con las opciones del select nativo
  function syncOpciones() {
    panel.innerHTML = "";
    Array.from(nativeSelect.options).forEach(opt => {
      const li = document.createElement("li");
      li.className = "cselect__option";
      li.setAttribute("role", "option");
      li.dataset.value = opt.value;
      li.textContent = opt.text;
      if (opt.value === nativeSelect.value) {
        li.classList.add("cselect__option--selected");
        triggerText.textContent = opt.text;
      }
      li.addEventListener("click", () => seleccionar(opt.value));
      panel.appendChild(li);
    });
  }

  function seleccionar(value) {
    nativeSelect.value = value;
    // Disparar el evento change para que los filtros reaccionen
    nativeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    cerrar();
  }

  function abrir() {
    wrapper.classList.add("cselect--open");
    trigger.setAttribute("aria-expanded", "true");
    // Resaltar la opción actualmente seleccionada
    panel.querySelectorAll(".cselect__option").forEach(li => {
      li.classList.toggle("cselect__option--selected", li.dataset.value === nativeSelect.value);
    });
  }

  function cerrar() {
    wrapper.classList.remove("cselect--open");
    trigger.setAttribute("aria-expanded", "false");
    // Actualizar texto del trigger con la selección actual
    const selected = nativeSelect.options[nativeSelect.selectedIndex];
    if (selected) triggerText.textContent = selected.text;
  }

  // Toggle al hacer click en el trigger
  trigger.addEventListener("click", () => {
    wrapper.classList.contains("cselect--open") ? cerrar() : abrir();
  });

  // Cerrar con teclado (Escape)
  trigger.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrar();
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      wrapper.classList.contains("cselect--open") ? cerrar() : abrir();
    }
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", e => {
    if (!wrapper.contains(e.target)) cerrar();
  });

  // Exponer método para que filters.js pueda actualizar las opciones
  // cuando cambia el filtro de año (el nativeSelect ya habrá sido actualizado)
  nativeSelect._syncCustomSelect = syncOpciones;

  // Inicializar con las opciones actuales
  syncOpciones();
}
