/* ============================================================
   config.js — Constantes globales del dashboard
   ============================================================ */

export const GUINDA = "#9D2449";
export const DORADO  = "#B38E5D";

// status_id → etiqueta legible
export const STATUS_MAP = {
  "1": "En ejecución",
  "2": "Finalizado",
  "3": "Planeación",
  "4": "Cancelado",
};

// Orden canónico de los ejes del radar
export const CAMPOS_ESTUDIO = [
  "Ciencias médicas y de la salud",
  "Ciencias sociales",
  "Ciencias ambientales",
  "Ingeniería y tecnología",
  "Ciencias naturales y exactas",
  "Ciencias agrícolas y veterinarias",
];

// Color por campo de estudio
export const CAMPO_COLORS = {
  "Ciencias médicas y de la salud":     "#9D2449",
  "Ciencias sociales":                  "#C0762A",
  "Ciencias ambientales":               "#3A7D44",
  "Ingeniería y tecnología":            "#1B5E8F",
  "Ciencias naturales y exactas":       "#6B3FA0",
  "Ciencias agrícolas y veterinarias":  "#B38E5D",
};

// Etiquetas cortas (multilínea) para el gráfico radar
export const CAMPOS_LABELS = {
  "Ciencias médicas y de la salud":     ["C. Médicas", "y Salud"],
  "Ciencias sociales":                  ["C. Sociales"],
  "Ciencias ambientales":               ["C. Ambientales"],
  "Ingeniería y tecnología":            ["Ing. y", "Tecnología"],
  "Ciencias naturales y exactas":       ["C. Naturales", "y Exactas"],
  "Ciencias agrícolas y veterinarias":  ["C. Agrícolas", "y Vet."],
};
