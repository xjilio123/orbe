import type { AccionesAjustes, AccionesApuntes, AccionesIa, AccionesPapelera, AccionesTareas } from "@/app/acciones/tipos";
import type { Evento } from "@/lib/agenda";
import type { Pagina, PaginaResumen } from "@/lib/datos/paginas";
import type { Lista, Tarea } from "@/lib/tareas";
import {
  audioVitrina,
  capturaVitrina,
  dividirVitrina,
  fotoVitrina,
  ordenarVitrina,
  planVitrina,
  resumirVitrina,
  semanaVitrina,
  tarjetasVitrina,
  textoVitrina,
} from "./ia";
import { capturarVitrina, formularioVitrina, guardarVitrina, nadaVitrina, subirVitrina, subtareaVitrina } from "./acciones";

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
  repetir: null,
  aviso: 0,
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
  t({ titulo: "Gimnasio", fecha: "2026-10-26", hora: "07:00", repetir: "semanal" }),
  t({ titulo: "Tomar vitaminas", fecha: HOY, hora: "08:00", repetir: "diaria", lista_id: CASA }),
  t({ titulo: "Revisar el correo de Prediqt", fecha: HOY, hora: "09:00", repetir: "laborables", lista_id: TRABAJO }),
];

// Eventos ficticios "de Google Calendar" para la Agenda.
export const EVENTOS: Evento[] = [
  { id: "g1", titulo: "Daily del equipo", fecha: HOY, inicio: "09:30", fin: "10:00", lugar: "Google Meet" },
  { id: "g2", titulo: "Almuerzo con Diana", fecha: HOY, inicio: "13:00", fin: "14:00", lugar: "Barranco" },
  { id: "g3", titulo: "Dentista", fecha: "2026-10-28", inicio: "16:30", fin: "17:15", lugar: "Av. Larco 123, Miraflores" },
  { id: "g4", titulo: "Llamada con Prediqt", fecha: "2026-10-29", inicio: "09:00", fin: "10:00", lugar: null },
  { id: "g5", titulo: "Puente de Todos los Santos", fecha: "2026-11-01", inicio: null, fin: null, lugar: null },
  { id: "g5", titulo: "Puente de Todos los Santos", fecha: "2026-11-02", inicio: null, fin: null, lugar: null },
  { id: "g6", titulo: "Webinar de Power BI", fecha: "2026-11-05", inicio: "19:00", fin: "20:30", lugar: null },
  { id: "g7", titulo: "Cierre de mes", fecha: "2026-10-30", inicio: "15:00", fin: "16:00", lugar: "Oficina" },
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

// ---------- Apuntes ficticios ----------
export const PAGINAS: PaginaResumen[] = [
  { id: "00000000-0000-4000-8000-0000000000b1", titulo: "SQL para Data Analytics", icono: "📊", favorita: true, padre_id: null, actualizado: `${HOY}T15:00:00Z` },
  { id: "00000000-0000-4000-8000-0000000000b2", titulo: "Window functions", icono: "🪟", favorita: false, padre_id: "00000000-0000-4000-8000-0000000000b1", actualizado: `${HOY}T14:00:00Z` },
  { id: "00000000-0000-4000-8000-0000000000b3", titulo: "Ideas para Orbe", icono: "💡", favorita: true, padre_id: null, actualizado: "2026-10-25T20:00:00Z" },
  { id: "00000000-0000-4000-8000-0000000000b4", titulo: "Clases de inglés ICPNA", icono: "🇬🇧", favorita: false, padre_id: null, actualizado: "2026-10-20T20:00:00Z" },
];

const FOTO = "00000000-0000-4000-8000-0000000000c1";
export const PAGINA: Pagina = {
  ...PAGINAS[0],
  contenido: [
    { id: "bloque-0001", tipo: "h2", texto: "Funciones de ventana" },
    { id: "bloque-0002", tipo: "p", texto: "Calculan sobre un grupo de filas sin colapsarlas, a diferencia de GROUP BY. Muy usadas en reportes de ventas." },
    { id: "bloque-0003", tipo: "lista", texto: "ROW_NUMBER() para numerar dentro de cada grupo" },
    { id: "bloque-0004", tipo: "lista", texto: "LAG() y LEAD() para comparar con la fila anterior o siguiente" },
    { id: "bloque-0005", tipo: "lista", texto: "SUM() OVER (...) para acumulados" },
    { id: "bloque-0006", tipo: "codigo", texto: "SELECT mes, ventas,\n  SUM(ventas) OVER (ORDER BY mes) AS acumulado\nFROM ventas_mensuales;" },
    { id: "bloque-0007", tipo: "aviso", texto: "PARTITION BY reinicia el cálculo en cada grupo." },
    { id: "bloque-0008", tipo: "separador", texto: "" },
    { id: "bloque-0009", tipo: "h3", texto: "Para repasar" },
    { id: "bloque-0010", tipo: "todo", texto: "Hacer los ejercicios del capítulo 3", hecho: true },
    { id: "bloque-0011", tipo: "todo", texto: "Probar RANK() vs DENSE_RANK()", hecho: false },
    { id: "bloque-0012", tipo: "num", texto: "Leer la documentación" },
    { id: "bloque-0013", tipo: "num", texto: "Resolver 5 ejercicios en LeetCode" },
    { id: "bloque-0014", tipo: "imagen", texto: "Diagrama de la ventana", adjunto: FOTO, ancho: 512, alto: 512 },
    { id: "bloque-0015", tipo: "cita", texto: "Los datos cuentan historias si sabes preguntarles." },
    { id: "bloque-0016", tipo: "p", texto: "" },
  ],
};
export const URLS_PAGINA = { [FOTO]: "/iconos/icono-512.png" };

export const VERSIONES = [0, 1, 2].map((i) => ({
  hueco: i,
  titulo: PAGINA.titulo,
  icono: PAGINA.icono,
  contenido: PAGINA.contenido.slice(0, 12 - i * 3),
  creado: `2026-10-2${6 - i}T1${4 + i}:30:00Z`,
}));

export const PAPELERA = {
  tareas: [
    { id: "00000000-0000-4000-8000-0000000000d1", titulo: "Llamar al banco por la tarjeta", borrado_en: `${HOY}T15:00:00Z` },
    { id: "00000000-0000-4000-8000-0000000000d2", titulo: "Comprar regalo de Diana", borrado_en: "2026-10-01T15:00:00Z" },
  ],
  paginas: [{ id: "00000000-0000-4000-8000-0000000000d3", titulo: "Borrador de ideas viejas", icono: "🗒️", borrado_en: "2026-10-20T15:00:00Z" }],
};

export const accionesApuntesVitrina: AccionesApuntes = {
  crear: nadaVitrina,
  guardar: guardarVitrina,
  favorita: nadaVitrina,
  eliminar: nadaVitrina,
  subir: subirVitrina,
  eliminarAdjunto: nadaVitrina,
  plantilla: nadaVitrina,
  restaurarVersion: nadaVitrina,
};

export const accionesPapeleraVitrina: AccionesPapelera = { restaurar: nadaVitrina, eliminar: nadaVitrina, vaciar: nadaVitrina };

export const accionesAjustesVitrina: AccionesAjustes = {
  guardarSuscripcion: guardarVitrina,
  quitarSuscripcion: nadaVitrina,
  probarAvisos: guardarVitrina,
  guardarCalendario: formularioVitrina,
  quitarCalendario: nadaVitrina,
  invitar: formularioVitrina,
  quitarInvitado: nadaVitrina,
};

export const accionesIaVitrina: AccionesIa = {
  captura: capturaVitrina,
  dividir: dividirVitrina,
  ordenarInbox: ordenarVitrina,
  texto: textoVitrina,
  resumir: resumirVitrina,
  plan: planVitrina,
  semana: semanaVitrina,
  tarjetas: tarjetasVitrina,
  foto: fotoVitrina,
  audio: audioVitrina,
};
