# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dashboard for SECTEI (Secretaría de Educación, Ciencia, Tecnología e Innovación) to visualize and manage research/innovation projects (convenios) in Mexico City. The project is in early stage — no framework or build system has been chosen yet.

**Repository:** https://github.com/AlonsoCortes/dummieDashboard

## Data

Sample data lives in `datos/proyectos_dummie.csv` (20 dummy records). CSV schema:

| Column | Description |
|---|---|
| `id` | Project identifier |
| `numero_convenio` | Agreement number (e.g., CDMX-2025-001) |
| `convocatorio` | Call year (2023–2025) |
| `titulo_proyecto` / `titulo_corto` | Full and short project titles |
| `eje_estrategico` | Strategic axis (7 categories — see below) |
| `tematica` | Thematic area |
| `palabras_clave` | Comma-separated keywords |
| `titular_proyecto` | Project lead |
| `institucion` | Parent institution (UNAM, IPN, UAM, CentroGeo) |
| `institucion_adjudicada` | Specific institute/department |
| `alcaldia` / `colonia` | Mexico City administrative division / neighborhood |
| `monto_asignado_mxn` | Budget in MXN (range: 950K–5M) |
| `fecha_inicio` / `fecha_fin` | Start/end dates (DD/MM/YYYY format) |
| `estatus_proyecto` | Status: "En ejecución", "Finalizado", or "Planeación" |

**Strategic axes (ejes estratégicos):** Agua y Sustentabilidad, Medio Ambiente, Movilidad y Espacio Público, Gestión de Riesgos, Transición Energética, Innovación y Tecnología, Desarrollo Económico.

## Language & Terminology

All data and domain terminology are in **Spanish**. Key terms: convenio = agreement, homologación = standardization, alcaldía = city district, colonia = neighborhood, eje estratégico = strategic axis, convocatoria = call for proposals, monto = amount/budget.

## Related Projects (sibling directories under SECTEI/)

- **HomologacionConveniosSubSectei** — Python/Jupyter pipeline that cleans and standardizes raw convention data across years into the CSV format consumed here.
- **dashboardProyectosPrueba** — Earlier test dashboard with similar data.
- **webscrapingConveniosSectei** — Data scraping for convention records.
