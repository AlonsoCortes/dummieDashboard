/* ============================================================
   data.js — Carga del CSV unificado de proyectos
   Fuente: datos/proyectos_2019-2025.csv
   (proyectos + instituciones + responsables técnicos en una sola tabla)
   ============================================================ */

export async function cargarDatos() {
  const rawProyectos = await d3.csv("datos/proyectos_2019-2025.csv");

  return rawProyectos.map(d => {
    // La columna ID puede venir con BOM (﻿) dependiendo del editor
    const idRaw = d["ID"] ?? d["﻿ID"] ?? "";

    return {
      id:          idRaw.trim(),
      folio:       d["folio_usernameRT"]?.trim() || "",
      acronimo:    d.acronimo?.trim() || d.titulo?.trim() || "Sin título",
      titulo:      d.titulo?.trim() || "",
      monto:       +d.montoFinanciamiento || 0,
      anio:        d["año_proyecto"]?.trim() || "",
      estatus:     "",
      statusId:    "",
      institucion: d.IntitucionApoyo?.trim() || "Sin institución",
      unidad:      d.Insti_UnidadApoyo?.trim() || "",
      campo:       d.campo_estudio?.trim() || "",
      tipo:        d.tipo_proyecto?.trim() || "",
      nombreRT:    d["Responsable técnico"]?.trim() || "",
    };
  });
}
