/* ============================================================
   data.js — Carga y join de los CSVs
   Fuentes:
     - 02_1_tabla_proyecto_limpios_clasificados.csv  (tabla principal, join key: id_proyecto)
     - 03_institucion_normalizada.csv                (join por proyecto_id → id_proyecto)
   ============================================================ */

import { STATUS_MAP } from "./config.js";

export async function cargarDatos() {
  const [rawProyectos, rawInst] = await Promise.all([
    d3.csv("datos/02_1_tabla_proyecto_limpios_clasificados.csv"),
    d3.csv("datos/03_institucion_normalizada.csv"),
  ]);

  // id_proyecto → { institucion, unidad }  (primera aparición por proyecto)
  const instMap = new Map();
  rawInst.forEach(r => {
    const pid = r.proyecto_id?.trim();
    if (pid && !instMap.has(pid)) {
      instMap.set(pid, {
        institucion: r._institucion_raiz?.trim() || r.razon_social?.trim() || "Sin institución",
        unidad: r._unidad?.trim() || "",
      });
    }
  });

  return rawProyectos
    .filter(d => d._excluir !== "1")
    .map(d => {
      const id          = d.id_proyecto?.trim();
      const monto       = +d.total_financiamiento || 0;
      const anio        = d._anio_registro?.trim() || "";
      const statusId    = d.status_id?.trim() || "";
      const instData    = instMap.get(id) || {};
      const institucion = instData.institucion || "Sin institución";
      const unidad      = instData.unidad || "";
      const acronimo    = d.acronimo?.trim() || d._titulo_normalizado?.trim() || d.titulo_proyecto?.trim() || "Sin título";
      const campo       = d.campo_estudio?.trim() || "";
      const tipo        = d.tipo_proyecto?.trim()  || "";
      const folio       = d.folio?.trim() || "";
      const nombreRT    = d.nombre_RT?.trim() || "";

      return {
        id,
        folio,
        acronimo,
        titulo: d._titulo_normalizado?.trim() || d.titulo_proyecto?.trim() || "",
        monto,
        anio,
        estatus: STATUS_MAP[statusId] ?? (statusId ? `Estatus ${statusId}` : "Sin estatus"),
        statusId,
        institucion,
        unidad,
        campo,
        tipo,
        nombreRT,
      };
    });
}
