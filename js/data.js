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
      id:                  idRaw.trim(),
      folio:               d["folioUsernameRT"]?.trim() || "",
      convenio:            d["CodigoConvenio"]?.trim() || "",
      acronimo:            d.AcronimoPRoyecto?.trim() || d.TituloProyecto?.trim() || "Sin título",
      titulo:              d.TituloProyecto?.trim() || "",
      monto:               +d.MontoFinanciamiento || 0,
      anio:                d["añoConvocatoria"]?.trim() || "",
      estatus:             "",
      statusId:            "",
      institucion:         d.InstitucionApoyo?.trim() || "Sin institución",
      unidad:              d.UnidadApoyo?.trim() || "",
      campo:               d.CampoEstudio?.trim() || "",
      tipo:                d.TipoProyecto?.trim() || "",
      nombreRT:            d.ResponsableTecnico?.trim() || "",
      rtCorreo:            d.RTCorreoContacto?.trim() || "",
      rtTelefono:          d.RTTelefonoContacto?.trim() || "",
      areaCaptura:         d["DirecciónGeneral"]?.trim() || "",
      direccionEncargada:  d.DireccionEncargada?.trim() || "",
      seguimiento:         d.EnlaceSeguimiento?.trim() || "",
      modalidad:           d.TipoConvocatoria?.trim() || "",
      tipoInstitucion:     d.TipoInstitucion?.trim() || "",
      estadoProyecto:      d.EstadoProyecto?.trim()  || "",
      estadoProyecto2:     d.EstadoProyecto2?.trim() || "",
      geometria:           d.geometria?.trim() || "",
      _itesmDup:           false,
    };
  });

  // Excluir filas sin ID (filas vacías o de metadatos en el CSV).
  const conId = mapped.filter(d => d.id !== "");

  // Marcar la segunda fila de cada par ITESM-IPN (mismo folio_usernameRT).
  // La primera aparición es el proyecto canónico; la segunda se excluye de
  // los conteos globales pero sigue visible al filtrar por institución.
  const foliosVistos = new Set();
  conId.forEach(d => {
    if (d.modalidad !== "Convocatoria ITESM-IPN" || !d.folio) return;
    if (foliosVistos.has(d.folio)) {
      d._itesmDup = true;
    } else {
      foliosVistos.add(d.folio);
    }
  });

  return conId;
}
