# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dashboard for SECTEI (Secretaría de Educación, Ciencia, Tecnología e Innovación) to visualize and manage research/innovation projects (convenios) in Mexico City.

**Repository:** https://github.com/AlonsoCortes/dummieDashboard

## Dashboard

### `index_v2.html` — visor principal
Loads two relational CSVs joined at runtime. No map. Script: `js/main_v2.js` (ES modules).

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
| `_excluir` | `"1"` marca filas duplicadas — se filtran al cargar |

### `datos/03_institucion_normalizada.csv` — instituciones (417 filas, 31 cols)

Join key: `proyecto_id` → `02_1_tabla_proyecto_limpios_clasificados.id_proyecto`

| Columna | Descripción |
|---|---|
| `proyecto_id` | FK → `proyectos.id` — **clave de join** |
| `_institucion_raiz` | Nombre raíz de la institución (usado en filtro y tabla) |
| `razon_social` | Nombre legal (fallback) |

Un proyecto puede tener múltiples filas. Se usa la **primera aparición** por `proyecto_id`.

### Estadísticas del join

| | Cantidad |
|---|---|
| Proyectos totales (sin `_excluir = 1`) | 247 |
| Con institución (join exitoso) | 208 (84 %) |
| Sin institución (sin match) | 39 (16 %) |

## JS Module Structure

```
js/
  main_v2.js          — entry point (DOMContentLoaded, wires everything)
  config.js           — constants: GUINDA, DORADO, STATUS_MAP, CAMPOS_ESTUDIO, CAMPO_COLORS
  data.js             — carga 2 CSVs, construye instMap (proyecto_id → _institucion_raiz), regresa filas normalizadas
  filters.js          — poblarFiltros, bindFiltros, datosFiltrados, actualizarOpcionesInst
  kpis.js             — renderKPIs, formatoMXN
  tabla.js            — renderTabla
  charts/
    tendencia.js      — barY: proyectos por año (global, no filtrado)
    monto.js          — barY: monto total por año (global, no filtrado)
    radar.js          — barX: proyectos por campo de estudio (filtrado)
  ui/
    customSelect.js   — custom dropdown wrapper for #filtro-inst
```

## CSS

Todos los estilos en `css/styles.css`. Un solo dashboard, sin scoping adicional.

## Language & Terminology

All data and domain terminology are in **Spanish**. Key terms: convenio = agreement, homologación = standardization, alcaldía = city district, colonia = neighborhood, eje estratégico = strategic axis, convocatoria = call for proposals, monto = amount/budget.

## Related Projects (sibling directories under SECTEI/)

- **HomologacionConveniosSubSectei** — Python/Jupyter pipeline that cleans and standardizes raw convention data across years into the CSV format consumed here.
- **dashboardProyectosPrueba** — Earlier test dashboard with similar data.
- **webscrapingConveniosSectei** — Data scraping for convention records.
