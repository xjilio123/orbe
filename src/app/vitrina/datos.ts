import type { AccionesTareas } from "@/app/acciones/tipos";
import type { Lista, Tarea } from "@/lib/tareas";
import { capturarVitrina, formularioVitrina, nadaVitrina, subtareaVitrina } from "./acciones";

// Datos FICTICIOS para la vitrina: realistas en cantidad y largo de textos, para medir la fluidez.
export const HOY = "2026-10-27";

export const LISTAS: Lista[] = [
  { id: "00000000-0000-4000-8000-0000000000a1", nombre: "Casa", color: "verde", orden: 0 },
  { id: "00000000-0000-4000-8000-0000000000a2", nombre: "Trabajo", color: "azul", orden: 1 },
  { id: "00000000-0000-4000-8000-0000000000a3", nombre: "Inglés", color: "morado", orden: 2 },
];

let n = 0;
const t = (datos: Partial<Tarea>): Tarea => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
  titulo: `Tarea ${n}`,
  notas: "",
  estado: "pendiente",
  prioridad: 0,
  fecha: null,
  hora: null,
  lista_id: null,
  padre_id: null,
  hecha_en: null,
  creado: "2026-10-20T15:00:00Z",
  ...datos,
});

const [CASA, TRABAJO, INGLES] = LISTAS.map((l) => l.id);

export const TAREAS: Tarea[] = [
  t({ titulo: "Enviar informe de ventas a Prediqt", fecha: HOY, hora: "10:00", prioridad: 3, lista_id: TRABAJO }),
  t({ titulo: "Pagar la tarjeta BBVA", fecha: "2026-10-25", prioridad: 2, lista_id: CASA }),
  t({ titulo: "Repasar window functions de SQL", fecha: HOY, lista_id: TRABAJO }),
  t({ titulo: "Clase de inglés", fecha: HOY, hora: "19:00", lista_id: INGLES }),
  t({ titulo: "Llamar a mamá", fecha: HOY, estado: "hecha", hecha_en: `${HOY}T14:00:00Z` }),
  t({ titulo: "Comprar pan y leche", fecha: HOY, estado: "hecha", hecha_en: `${HOY}T13:00:00Z`, lista_id: CASA }),
  t({ titulo: "Renovar el DNI", fecha: "2026-10-28", lista_id: CASA }),
  t({ titulo: "Preparar la presentación del portfolio", fecha: "2026-10-30", prioridad: 1, lista_id: TRABAJO, estado: "en_curso" }),
  t({ titulo: "Leer capítulo 3 de Storytelling with Data", fecha: "2026-11-02" }),
  t({ titulo: "Cumpleaños de Diana", fecha: "2026-11-15" }),
  t({ titulo: "Ideas para el diseño de Orbe" }),
  t({ titulo: "Revisar suscripciones que ya no uso" }),
  t({ titulo: "Buscar curso de Power BI avanzado" }),
  t({ titulo: "Practicar listening 20 minutos", lista_id: INGLES }),
];

export const DETALLE = TAREAS[0];
export const SUBTAREAS: Tarea[] = [
  t({ titulo: "Exportar datos de octubre", padre_id: DETALLE.id, estado: "hecha", hecha_en: `${HOY}T12:00:00Z` }),
  t({ titulo: "Armar gráficos", padre_id: DETALLE.id }),
  t({ titulo: "Escribir conclusiones", padre_id: DETALLE.id }),
];

export const accionesVitrina: AccionesTareas = {
  capturar: capturarVitrina,
  alternar: nadaVitrina,
  mover: nadaVitrina,
  guardar: formularioVitrina,
  eliminar: nadaVitrina,
  crearSubtarea: subtareaVitrina,
  crearLista: formularioVitrina,
  guardarLista: formularioVitrina,
  eliminarLista: nadaVitrina,
};
