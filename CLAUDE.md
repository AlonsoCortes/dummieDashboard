# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dashboard for SECTEI (Secretaría de Educación, Ciencia, Tecnología e Innovación) to visualize and manage research/innovation projects (convenios) in Mexico City.

**Repository:** https://github.com/AlonsoCortes/dummieDashboard

## Dashboard

### `index_v2.html` — visor principal
Loads two relational CSVs joined at runtime. No map. Script: `js/main_v2.js` (ES modules).

### Vistas

The dashboard has three tabs (`.vista-tab`). State is managed in `main_v2.js` via `vistaActual` and `instSeleccionada`.

| Vista | Estado | Descripción |
|---|---|---|
| **General** | ✅ Activa | KPIs globales, filtros por año/institución, radar de campo de estudio, tabla de proyectos |
| **Institución** | ✅ Activa | Rankings laterales, búsqueda predictiva de institución, filtro por unidad, radar + timeline por institución |
| **Responsable Técnico** | 🚧 Pendiente | Tab deshabilitado (`vista-tab--disabled`). Por implementar. |

### Vista General

- Filtros: año (`filtro-year`) + institución (`filtro-inst`) + unidad (`filtro-unidad`)
- Sidebar: gráficas globales no filtradas — tendencia de proyectos por año y monto por año
- Área principal: KPIs primarios/secundarios + radar de campo de estudio + tabla
- "Sin institución" es una opción válida en el filtro de institución (aparece al final de la lista)

### Vista Institución

- Filtros: año (`filtro-year`) + búsqueda predictiva (`inst-search-input`) + unidad (`filtro-unidad`)
- Sidebar: top instituciones por número de proyectos y por monto total
- Layout de 2 filas: Row 1 = todas las tarjetas KPI en horizontal; Row 2 = radar de campo de estudio + timeline de proyectos por año (ambos side-by-side, full width)
- Sin selección: gráficas muestran datos globales (o filtrados por año)
- Con institución seleccionada: KPI adicional de unidades, gráficas filtradas, encabezado contextual con badge de conteo
- "Sin institución" es seleccionable en la búsqueda predictiva (proyectos sin match en el join)

### Pendiente — Vista Responsable Técnico

- Tab presente en el HTML pero deshabilitado (`disabled` + `vista-tab--disabled`)
- Sin lógica implementada en `main_v2.js`
- Debe mostrar análisis por `nombre_RT` (campo en la tabla principal)
- Patrón a seguir: similar a vista Institución, adaptado a responsable técnico como entidad principal

## Data

### `datos/02_1_tabla_proyecto_limpios_clasificados.csv` — tabla principal (285 filas)

Join key: `id_proyecto`

| Columna | Descripción |
|---|---|
| `id_proyecto` | Identificador del proyecto — **clave de join** |
| `acronimo` | Acrónimo corto del proyecto |
| `_titulo_normalizado` | Título limpio y normalizado (preferido sobre `titulo_proyecto`) |
| `titulo_proyecto` | Título original (fallback) |
| `total_financiamiento` | Presupuesto en MXN |
| `_anio_registro` | Año de convocatoria (usado como filtro) |
| `status_id` | Código de estatus (ver STATUS_MAP en config.js) |
| `campo_estudio` | Área de conocimiento (6 categorías — ver CAMPOS_ESTUDIO en config.js) |
| `tipo_proyecto` | Tipo de proyecto |
| `nombre_RT` | Nombre del responsable técnico del proyecto |
| `_excluir` | `"1"` marca filas duplicadas — se filtran al cargar |

### `datos/03_institucion_normalizada.csv` — instituciones (417 filas, 31 cols)

Join key: `proyecto_id` → `02_1_tabla_proyecto_limpios_clasificados.id_proyecto`

**Cardinalidad: uno a muchos** — un proyecto puede tener múltiples filas. El código actual usa solo la **primera aparición** por `proyecto_id` (`data.js` construye `instMap` con `!instMap.has(pid)`).

| Columna | Descripción |
|---|---|
| `proyecto_id` | FK → `proyectos.id` — **clave de join** |
| `_institucion_raiz` | Nombre raíz de la institución (usado en filtro y tabla) |
| `_unidad` | Unidad académica/administrativa dentro de la institución |
| `razon_social` | Nombre legal (fallback si `_institucion_raiz` está vacío) |

### Estadísticas del join

| | Cantidad |
|---|---|
| Proyectos totales (sin `_excluir = 1`) | 247 |
| Con institución (join exitoso) | 208 (84 %) |
| Sin institución (sin match) | 39 (16 %) — se muestran como "Sin institución" |

## JS Module Structure

```
js/
  main_v2.js          — entry point (DOMContentLoaded, wires everything)
                        vistaActual: "general" | "institucion"
                        instSeleccionada: string | null
  config.js           — constants: GUINDA, DORADO, STATUS_MAP, CAMPOS_ESTUDIO, CAMPO_COLORS
  data.js             — carga 2 CSVs, construye instMap (proyecto_id → _institucion_raiz + _unidad), regresa filas normalizadas
  filters.js          — poblarFiltros, bindFiltros, datosFiltrados, datosFiltradosPorAnio,
                        actualizarOpcionesInst, actualizarOpcionesUnidad, listaInstituciones
  kpis.js             — renderKPIs, formatoMXN
  tabla.js            — renderTabla
  charts/
    tendencia.js      — barY: proyectos por año (global, no filtrado)
    monto.js          — barY: monto total por año (global, no filtrado)
    radar.js          — barX: proyectos por campo de estudio (acepta cualquier dataset)
    inst_ranking.js   — barY horizontal: top instituciones por proyectos (sidebar)
    inst_monto.js     — barY horizontal: top instituciones por monto (sidebar)
    inst_timeline.js  — barY: proyectos por año para una institución (acepta cualquier dataset)
  ui/
    customSelect.js   — custom dropdown wrapper for #filtro-inst
```

## CSS

Todos los estilos en `css/styles.css`. Un solo archivo, sin scoping adicional.

Clases clave de layout:
- `.resumen-top-row` — grid de 3 columnas (vista general)
- `.resumen-top-row--inst` — modifier: 2 columnas KPI + chart full-width segunda fila (vista institución)
- `.chart-inst-row` — grid 2 columnas para radar + timeline en vista institución

## Language & Terminology

All data and domain terminology are in **Spanish**. Key terms: convenio = agreement, homologación = standardization, alcaldía = city district, colonia = neighborhood, eje estratégico = strategic axis, convocatoria = call for proposals, monto = amount/budget.

## Related Projects (sibling directories under SECTEI/)

- **HomologacionConveniosSubSectei** — Python/Jupyter pipeline that cleans and standardizes raw convention data across years into the CSV format consumed here.
- **dashboardProyectosPrueba** — Earlier test dashboard with similar data.
- **webscrapingConveniosSectei** — Data scraping for convention records.
