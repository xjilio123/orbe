import type { AccionesApuntes, AccionesTareas } from "@/app/acciones/tipos";
import type { Pagina, PaginaResumen } from "@/lib/datos/paginas";
import type { Lista, Tarea } from "@/lib/tareas";
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

export const accionesApuntesVitrina: AccionesApuntes = {
  crear: nadaVitrina,
  guardar: guardarVitrina,
  favorita: nadaVitrina,
  eliminar: nadaVitrina,
  subir: subirVitrina,
  eliminarAdjunto: nadaVitrina,
};
