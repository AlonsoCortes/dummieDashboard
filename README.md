# Dashboard de Proyectos SECTEI

Visualizador interactivo de proyectos de investigación e innovación financiados por la Secretaría de Educación, Ciencia, Tecnología e Innovación (SECTEI) de la Ciudad de México.

## Vista general

El dashboard presenta indicadores clave, distribución por campo de estudio y un listado filtrable de los 247 proyectos registrados.

**Stack:** HTML · CSS · JavaScript (ES Modules) · [D3.js v7](https://d3js.org) · [Observable Plot v0.6](https://observablehq.com/plot/)  
Sin framework, sin bundler — corre directamente en el navegador vía servidor HTTP local.

## Estructura del proyecto

```
dummieDashboard/
├── index_v2.html              # Visor principal
├── css/
│   └── styles.css             # Todos los estilos
├── js/
│   ├── main_v2.js             # Entry point (ES module)
│   ├── config.js              # Constantes: colores, mapas de estatus/campos
│   ├── data.js                # Carga y join de CSVs
│   ├── filters.js             # Lógica de filtros (año, institución)
│   ├── kpis.js                # Tarjetas de indicadores
│   ├── tabla.js               # Tabla de proyectos
│   ├── charts/
│   │   ├── tendencia.js       # Proyectos por año
│   │   ├── monto.js           # Monto por año
│   │   └── radar.js           # Proyectos por campo de estudio (barras)
│   └── ui/
│       └── customSelect.js    # Dropdown personalizado con texto envolvente
└── datos/
    ├── 02_tabla_proyecto_limpios.csv   # Tabla principal de proyectos (285 filas)
    └── 03_institucion_normalizada.csv  # Instituciones por proyecto (417 filas)
```

## Datos

Los CSVs se unen en tiempo de carga mediante:

```
02_tabla_proyecto_limpios.id  ←→  03_institucion_normalizada.proyecto_id
```

| Archivo | Filas | Descripción |
|---|---|---|
| `02_tabla_proyecto_limpios.csv` | 285 | Proyectos con título, monto, año, campo de estudio y tipo |
| `03_institucion_normalizada.csv` | 417 | Instituciones participantes por proyecto |

De los 247 proyectos activos (excluidos duplicados), **208 tienen institución registrada** (84%).

## Cómo ejecutar

El dashboard usa ES Modules, por lo que requiere un servidor HTTP — no funciona abriendo el archivo directamente en el navegador.

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Luego abrir [http://localhost:8080/index_v2.html](http://localhost:8080/index_v2.html).

## Funcionalidades

- **Filtros** — por año de registro e institución (dinámico: las instituciones se actualizan según el año seleccionado)
- **KPIs** — monto total, número de proyectos, instituciones, promedio, máximo y mínimo
- **Gráfica de tendencia** — proyectos y monto por año (vista global, no filtrada)
- **Campo de estudio** — distribución por área de conocimiento en barras horizontales con leyenda de colores
- **Tabla** — listado filtrable con acrónimo, título, institución, campo de estudio, tipo de proyecto, año y monto

## Proyectos relacionados

Directorio padre: `SECTEI/`

| Proyecto | Descripción |
|---|---|
| `HomologacionConveniosSubSectei` | Pipeline Python/Jupyter que limpia y estandariza los datos crudos de convenios por año, generando los CSVs que consume este dashboard |
| `webscrapingConveniosSectei` | Scraping de registros de convenios |
| `dashboardProyectosPrueba` | Dashboard de prueba anterior con datos similares |
