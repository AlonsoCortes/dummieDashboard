/* ============================================================
   data.js — Carga del CSV unificado de proyectos
   Fuente: datos/proyectos_2019-2025.csv
   ============================================================ */

// "Point Z (-99.139 19.435 0)" → { lat, lng } | null
export function parseWKTPoint(wkt) {
  const m = wkt?.match(/Point Z \(([^ ]+) ([^ ]+)/i);
  return m ? { lat: +m[2], lng: +m[1] } : null;
}

export async function cargarDatos() {
  const rawProyectos = await d3.csv("datos/proyectos_2019-2025.csv");

  const mapped = rawProyectos.map(d => {
    // La columna ID puede venir con BOM (﻿) dependiendo del editor
    const idRaw = d["ID"] ?? d["﻿ID"] ?? "";

    return {
      id:          idRaw.trim(),
      folio:       d["folio_usernameRT"]?.trim() || "",
      acronimo:    d.acronimo?.trim() || d.Titulo?.trim() || "Sin título",
      titulo:      d.Titulo?.trim() || "",
      monto:       +d.MontoFinanciamiento || 0,
      anio:        d["año_proyecto"]?.trim() || "",
      estatus:     "",
      statusId:    "",
      institucion: d.InstitucionBuena?.trim() || "Sin institución",
      unidad:      d.UnidadBuena?.trim() || "",
      campo:       d.campo_estudio?.trim() || "",
      tipo:        d.tipo_proyecto?.trim() || "",
      nombreRT:    d["Responsable Técnico"]?.trim() || d["Responsable técnico"]?.trim() || "",
      areaCaptura: d.DireccionCompleta?.trim() || "",
      seguimiento: d["Seguimiento"]?.trim() || "",
      modalidad:   d.Modalidad?.trim() || "",
      geometria:   d.geometria?.trim()  || "",
      alcaldia:    d.alcaldia?.trim()   || "",
      _itesmDup:   false,
    };
  });

  // Marcar la segunda fila de cada par ITESM-IPN (mismo folio_usernameRT).
  // La primera aparición es el proyecto canónico; la segunda se excluye de
  // los conteos globales pero sigue visible al filtrar por institución.
  const foliosVistos = new Set();
  mapped.forEach(d => {
    if (d.modalidad !== "Convocatoria ITESM-IPN" || !d.folio) return;
    if (foliosVistos.has(d.folio)) {
      d._itesmDup = true;
    } else {
      foliosVistos.add(d.folio);
    }
  });

  return mapped;
}
