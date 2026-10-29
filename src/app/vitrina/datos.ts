import type { AccionesAjustes, AccionesApuntes, AccionesColeccion, AccionesEstudio, AccionesIa, AccionesNotas, AccionesOrganizacion, AccionesPapelera, AccionesProgreso, AccionesTareas } from "@/app/acciones/tipos";
import type { FechaImportante, Habito, Meta, SemanaEstadistica } from "@/lib/progreso";
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
  preguntarVitrina,
  resumirVitrina,
  semanaVitrina,
  tarjetasVitrina,
  textoVitrina,
} from "./ia";
import { capturarVitrina, formularioVitrina, guardarVitrina, importarVitrina, nadaVitrina, subirVitrina, subtareaVitrina } from "./acciones";

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
    { id: "bloque-0017", tipo: "p", texto: "Ver también [[Window functions]] y [[Funciones de agregación]]." },
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
  preguntar: preguntarVitrina,
  semana: semanaVitrina,
  tarjetas: tarjetasVitrina,
  foto: fotoVitrina,
  audio: audioVitrina,
};

// ---------- Progreso ficticio (hábitos, metas, fechas y estadísticas) ----------
// HOY es martes 27: la semana empieza el lunes 26.
export const HABITOS: Habito[] = [
  { id: "00000000-0000-4000-8000-0000000000d1", nombre: "Leer 20 min", icono: "📚", color: "naranja", dias_semana: 7, hecho_hoy: true, marcas_semana: ["2026-10-26", HOY], racha: 12 },
  { id: "00000000-0000-4000-8000-0000000000d2", nombre: "Gimnasio", icono: "💪", color: "rojo", dias_semana: 3, hecho_hoy: false, marcas_semana: ["2026-10-26"], racha: 4 },
  { id: "00000000-0000-4000-8000-0000000000d3", nombre: "Tomar 2 L de agua", icono: "💧", color: "celeste", dias_semana: 7, hecho_hoy: false, marcas_semana: ["2026-10-26"], racha: 1 },
  { id: "00000000-0000-4000-8000-0000000000d4", nombre: "Practicar inglés", icono: "🇬🇧", color: "morado", dias_semana: 5, hecho_hoy: true, marcas_semana: ["2026-10-26", HOY], racha: 0 },
];

export const METAS: Meta[] = [
  { id: "00000000-0000-4000-8000-0000000000e1", titulo: "Leer 12 libros", tipo: "numero", lista_id: null, lista: null, objetivo: 12, actual: 9, unidad: "libros", color: "naranja" },
  { id: "00000000-0000-4000-8000-0000000000e2", titulo: "Aprobar el B2 de inglés", tipo: "lista", lista_id: "00000000-0000-4000-8000-0000000000a3", lista: "Inglés", objetivo: 14, actual: 6, unidad: "", color: "morado" },
  { id: "00000000-0000-4000-8000-0000000000e3", titulo: "Correr 300 km", tipo: "numero", lista_id: null, lista: null, objetivo: 300, actual: 212.5, unidad: "km", color: "verde" },
];

export const FECHAS: FechaImportante[] = [
  { id: "00000000-0000-4000-8000-0000000000f1", titulo: "Examen final de SQL", fecha: "2026-11-09", icono: "📝", color: "rojo" },
  { id: "00000000-0000-4000-8000-0000000000f2", titulo: "Viaje a Cusco", fecha: "2026-12-18", icono: "✈️", color: "azul" },
  { id: "00000000-0000-4000-8000-0000000000f3", titulo: "Entrega del portfolio", fecha: "2026-10-30", icono: "🎯", color: "naranja" },
];

export const ESTADISTICAS: SemanaEstadistica[] = [
  { semana: "2026-09-07", tareas: 9, minutos: 75 },
  { semana: "2026-09-14", tareas: 14, minutos: 150 },
  { semana: "2026-09-21", tareas: 11, minutos: 100 },
  { semana: "2026-09-28", tareas: 17, minutos: 225 },
  { semana: "2026-10-05", tareas: 8, minutos: 50 },
  { semana: "2026-10-12", tareas: 15, minutos: 175 },
  { semana: "2026-10-19", tareas: 19, minutos: 250 },
  { semana: "2026-10-26", tareas: 6, minutos: 50 },
];

export const accionesProgresoVitrina: AccionesProgreso = {
  crearHabito: formularioVitrina,
  eliminarHabito: nadaVitrina,
  marcarHabito: guardarVitrina,
  crearMeta: formularioVitrina,
  avanzarMeta: guardarVitrina,
  eliminarMeta: nadaVitrina,
  crearFecha: formularioVitrina,
  eliminarFecha: nadaVitrina,
  guardarFoco: guardarVitrina,
};

export const accionesNotasVitrina: AccionesNotas = { crearEnlazada: nadaVitrina, importar: importarVitrina };

export const accionesEstudioVitrina: AccionesEstudio = {
  alternarCurso: nadaVitrina,
  crearExamen: formularioVitrina,
  marcarAnimo: guardarVitrina,
  abrirDiario: nadaVitrina,
};

// ---------- Modo estudio y diario ficticios ----------
export const CURSOS = [
  {
    id: PAGINAS[0].id,
    titulo: PAGINAS[0].titulo,
    icono: PAGINAS[0].icono,
    temas: 6,
    tarjetas: 12,
    examen: { titulo: "Examen final de SQL", fecha: "2026-11-09" },
  },
  {
    id: PAGINAS[3].id,
    titulo: PAGINAS[3].titulo,
    icono: PAGINAS[3].icono,
    temas: 3,
    tarjetas: 0,
    examen: null,
  },
];

export const TARJETAS = [
  { id: "t1", pregunta: "¿Qué hace ROW_NUMBER()?", respuesta: "Numera las filas dentro de cada grupo, empezando en 1.", pagina: "Tarjetas: SQL" },
  { id: "t2", pregunta: "¿En qué se diferencia una función de ventana de GROUP BY?", respuesta: "Calcula sobre un grupo de filas sin colapsarlas en una sola.", pagina: "Tarjetas: SQL" },
  { id: "t3", pregunta: "¿Qué hacen LAG() y LEAD()?", respuesta: "Traen el valor de la fila anterior (LAG) o siguiente (LEAD).", pagina: "Tarjetas: SQL" },
  { id: "t4", pregunta: "¿Para qué sirve PARTITION BY?", respuesta: "Reinicia el cálculo en cada grupo.", pagina: "Tarjetas: SQL" },
];

export const DIARIO = [1, 2, 3, 5, 6, 8, 9, 10, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 25, 26].map((d, i) => ({
  fecha: `2026-10-${String(d).padStart(2, "0")}`,
  animo: [4, 5, 3, 4, 2, 4, 5, 3, 4, 4, 1, 3, 4, 5, 4, 3, 4, 5, 2, 4][i],
  pagina_id: i % 3 === 0 ? PAGINAS[2].id : null,
}));

export const accionesOrganizacionVitrina: AccionesOrganizacion = { moverCuadrante: guardarVitrina, guardarVista: guardarVitrina, eliminarVista: nadaVitrina };

export const VISTAS_GUARDADAS = [
  { id: "00000000-0000-4000-8000-0000000000e9", nombre: "Urgentes", config: { orden: "prioridad", estado: "pendientes", prioridad: 2 } },
  { id: "00000000-0000-4000-8000-0000000000ea", nombre: "Todo por fecha", config: { orden: "fecha", estado: "todas", prioridad: 0 } },
];

// ---------- Checklists y biblioteca ficticias ----------
export const accionesColeccionVitrina: AccionesColeccion = {
  crearChecklist: formularioVitrina,
  eliminarChecklist: nadaVitrina,
  agregarItem: guardarVitrina,
  alternarItem: nadaVitrina,
  eliminarItem: nadaVitrina,
  desmarcarTodo: nadaVitrina,
  crearObra: formularioVitrina,
  actualizarObra: guardarVitrina,
  eliminarObra: nadaVitrina,
};

export const CHECKLISTS = [
  { id: "00000000-0000-4000-8000-0000000000c5", nombre: "Mercado de la semana", icono: "🛒", color: "verde" as const, hechos: 3, total: 9 },
  { id: "00000000-0000-4000-8000-0000000000c6", nombre: "Maleta de viaje", icono: "🧳", color: "azul" as const, hechos: 0, total: 14 },
  { id: "00000000-0000-4000-8000-0000000000c7", nombre: "Antes de salir de casa", icono: "🔑", color: "naranja" as const, hechos: 2, total: 5 },
];

export const ITEMS = ["Pan", "Leche", "Huevos", "Palta", "Arroz", "Pollo", "Tomates", "Café", "Detergente"].map((texto, i) => ({
  id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, "0")}`,
  texto,
  hecho: i < 3,
  orden: i,
}));

export const OBRAS = [
  { id: "00000000-0000-4000-8000-000000000201", titulo: "Storytelling with Data", autor: "Cole Nussbaumer", tipo: "libro" as const, estado: "en_curso" as const, progreso: 142, total: 260, nota: null, resena: "", terminado_en: null },
  { id: "00000000-0000-4000-8000-000000000202", titulo: "Dark", autor: "Netflix", tipo: "serie" as const, estado: "en_curso" as const, progreso: 14, total: 26, nota: null, resena: "", terminado_en: null },
  { id: "00000000-0000-4000-8000-000000000203", titulo: "Power BI avanzado", autor: "Platzi", tipo: "curso" as const, estado: "en_curso" as const, progreso: 3, total: null, nota: null, resena: "", terminado_en: null },
  { id: "00000000-0000-4000-8000-000000000204", titulo: "Atomic Habits", autor: "James Clear", tipo: "libro" as const, estado: "terminado" as const, progreso: 320, total: 320, nota: 5, resena: "", terminado_en: "2026-09-14" },
  { id: "00000000-0000-4000-8000-000000000205", titulo: "Deep Work", autor: "Cal Newport", tipo: "libro" as const, estado: "quiero" as const, progreso: 0, total: null, nota: null, resena: "", terminado_en: null },
];
