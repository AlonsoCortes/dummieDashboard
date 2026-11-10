# Dashboard de Proyectos SECTEI

Visualizador interactivo de proyectos de investigación e innovación financiados por la Secretaría de Educación, Ciencia, Tecnología e Innovación (SECTEI) de la Ciudad de México.

**Stack:** HTML · CSS · JavaScript (ES Modules) · [D3.js v7](https://d3js.org) · [Observable Plot v0.6](https://observablehq.com/plot/) · [Leaflet](https://leafletjs.com)  
Sin framework, sin bundler — corre directamente en el navegador vía servidor HTTP local.

---

## Vistas

El dashboard tiene cinco pestañas. Cada una tiene su propio sidebar con gráficas contextuales.

### General

Vista principal con todos los proyectos.

- **Filtros globales** — búsqueda por título/acrónimo/folio, año de registro, institución y modalidad de convocatoria
- **KPIs** — monto total, número de proyectos, instituciones únicas, promedio, máximo y mínimo por proyecto
- **Sidebar** — tendencia de proyectos por año y monto por año (datos globales, no filtrados)
- **Radar de campo de estudio** — distribución por área de conocimiento con colores por categoría
- **Tabla** — listado con 18 columnas ordenables: ID, folio, convenio, acrónimo/título, institución, unidad, campo de estudio, tipo, modalidad, responsable técnico (nombre, correo, teléfono), dirección general, dirección encargada, enlace de seguimiento, año, monto y estado del proyecto

### Institución

Análisis por institución participante.

- **Búsqueda predictiva** de institución + filtro de unidad
- **KPIs contextuales** — proyectos, monto, unidades (cuando hay institución seleccionada)
- **Sidebar** — ranking de top instituciones por número de proyectos y por monto total
- **Radar de campo de estudio** filtrado por institución
- **Timeline apilado** — proyectos por año, agrupable por campo de estudio o estado del proyecto

### Responsable Técnico

Análisis por responsable técnico (RT).

- **Búsqueda predictiva** de responsable técnico
- **KPIs** — proyectos y monto total a cargo
- **Sidebar** — top responsables técnicos por proyectos y por monto
- **Radar de campo de estudio** filtrado por responsable técnico
- **Timeline apilado** — proyectos por año del responsable seleccionado

### Seguimiento

Vista interna de gestión con datos de seguimiento institucional.

- **Búsqueda** por Dirección General, Dirección Encargada y Responsable de Seguimiento
- **KPIs de estado** — conteo de proyectos Vigentes, No vigentes y Cerrados
- **Gráfica de estado por año** — barras horizontales apiladas con los tres estados
- **Sidebar** — ranking de áreas, direcciones encargadas y responsables de seguimiento
- **Tabla** de proyectos con estado detallado (categoría + descripción)

### Mapa

Geolocalización de proyectos (requiere coordenadas en la columna `geometria` del CSV).

- Mapa interactivo con marcadores por proyecto
- Leyenda por campo de estudio
- Sidebar con estadísticas de cobertura geográfica
- Botón para volver a la vista global desde un proyecto individual

---

## Estructura del proyecto

```
dummieDashboard/
├── index.html                     # Punto de entrada
├── css/
│   └── styles.css                 # Todos los estilos (sin scoping adicional)
├── js/
│   ├── main_v2.js                 # Entry point (DOMContentLoaded, orquesta todo)
│   ├── config.js                  # Constantes: colores, CAMPOS_ESTUDIO, CAMPO_COLORS
│   ├── data.js                    # Carga y normalización del CSV
│   ├── filters.js                 # Lógica de filtros y búsquedas predictivas
│   ├── kpis.js                    # Tarjetas de indicadores (renderKPIs, formatoMXN)
│   ├── tabla.js                   # Tabla con 18 columnas ordenables
│   ├── charts/
│   │   ├── tendencia.js           # Proyectos por año (barras, global)
│   │   ├── monto.js               # Monto por año (barras, global)
│   │   ├── radar.js               # Campo de estudio (barras horizontales)
│   │   ├── inst_ranking.js        # Top instituciones por proyectos (sidebar)
│   │   ├── inst_monto.js          # Top instituciones por monto (sidebar)
│   │   ├── inst_timeline_stacked.js # Proyectos por año apilados (campo/estado)
│   │   ├── estado_proyecto.js     # Estado por año (barras horizontales apiladas)
│   │   ├── tipo_institucion.js    # Distribución por tipo de institución
│   │   ├── area_ranking.js        # Ranking de áreas/direcciones (seguimiento)
│   │   ├── rt_ranking.js          # Top responsables técnicos por proyectos
│   │   ├── rt_monto.js            # Top responsables técnicos por monto
│   │   └── seguimiento_ranking.js # Responsables de seguimiento
│   ├── maps/
│   │   └── mapa.js                # Mapa Leaflet con marcadores por proyecto
│   └── ui/
│       └── customSelect.js        # Dropdown personalizado para filtro institución
├── datos/
│   └── proyectos_2019-2025.csv    # CSV unificado con todos los datos
└── img/
    └── logos/                     # Logos institucionales (CDMX, SECTEI)
```

---

## Datos

Un solo CSV con todas las columnas necesarias. No hay join en tiempo de carga.

### `datos/proyectos_2019-2025.csv`

| Columna | Descripción |
|---|---|
| `ID` | Identificador numérico del proyecto |
| `folioUsernameRT` | Folio / username del responsable técnico |
| `CodigoConvenio` | Código del convenio |
| `AcronimoPRoyecto` | Acrónimo corto del proyecto |
| `TituloProyecto` | Título completo |
| `MontoFinanciamiento` | Presupuesto en MXN |
| `añoConvocatoria` | Año de la convocatoria (2019–2025) |
| `InstitucionApoyo` | Institución participante |
| `UnidadApoyo` | Unidad académica/administrativa |
| `CampoEstudio` | Área de conocimiento (6 categorías) |
| `TipoProyecto` | Tipo de proyecto |
| `TipoConvocatoria` | Modalidad (incluye `Convocatoria ITESM-IPN`) |
| `TipoInstitucion` | Tipo de institución |
| `ResponsableTecnico` | Nombre del responsable técnico |
| `RTCorreoContacto` | Correo electrónico del RT |
| `RTTelefonoContacto` | Teléfono del RT |
| `DirecciónGeneral` | Dirección general de captura (con acento en columna) |
| `DireccionEncargada` | Dirección encargada del proyecto |
| `EnlaceSeguimiento` | Responsable de seguimiento |
| `EstadoProyecto` | Estado general: `Vigente`, `No vigente` o `Cerrado` |
| `EstadoProyecto2` | Descripción del estado (p. ej. `con carta finiquito`) |
| `geometria` | Punto geográfico en formato WKT (`Point Z (lng lat 0)`) |

**Registros activos:** ~439 proyectos (filas con ID, excluyendo vacías y duplicados ITESM-IPN en conteos globales).

### Lógica de duplicados ITESM-IPN

La modalidad `Convocatoria ITESM-IPN` genera dos filas por proyecto (una para cada institución). La primera aparición se toma como proyecto canónico para KPIs y gráficas globales (`_itesmDup = false`). Ambas filas siguen siendo visibles al filtrar por institución.

---

## Cómo ejecutar

El dashboard usa ES Modules y requiere un servidor HTTP local — no funciona abriendo el archivo directamente en el navegador.

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Luego abrir [http://localhost:8080](http://localhost:8080).

---

## Proyectos relacionados

Directorio padre: `SECTEI/`

| Proyecto | Descripción |
|---|---|
| `HomologacionConveniosSubSectei` | Pipeline Python/Jupyter que limpia y estandariza datos crudos de convenios por año, generando el CSV que consume este dashboard |
| `webscrapingConveniosSectei` | Scraping de registros de convenios |
| `dashboardProyectosPrueba` | Dashboard de prueba anterior con datos similares |
