import { esDeTexto, nuevoBloque, type Bloque, type DatosPagina, type TipoBloque } from "./bloques";

// Plantillas de páginas: las de Orbe (aquí) y las tuyas (páginas marcadas como plantilla).

type Linea = [TipoBloque, string] | [TipoBloque, string, boolean];

export type Plantilla = { id: string; nombre: string; icono: string; descripcion: string; lineas: Linea[] };

export const PLANTILLAS: Plantilla[] = [
  {
    id: "clase",
    nombre: "Apuntes de clase",
    icono: "🎓",
    descripcion: "Tema, ideas clave, ejemplos y dudas para repasar.",
    lineas: [
      ["h2", "Tema de hoy"],
      ["p", ""],
      ["h3", "Ideas clave"],
      ["lista", ""],
      ["h3", "Ejemplos"],
      ["codigo", ""],
      ["h3", "Dudas para preguntar"],
      ["todo", ""],
      ["aviso", "Repasar antes del examen."],
    ],
  },
  {
    id: "reunion",
    nombre: "Reunión",
    icono: "🗣️",
    descripcion: "Asistentes, temas, decisiones y pendientes con responsable.",
    lineas: [
      ["h3", "Asistentes"],
      ["lista", ""],
      ["h3", "Temas"],
      ["num", ""],
      ["h3", "Decisiones"],
      ["lista", ""],
      ["h3", "Pendientes"],
      ["todo", "Responsable · tarea · fecha"],
    ],
  },
  {
    id: "proyecto",
    nombre: "Proyecto",
    icono: "🚀",
    descripcion: "Objetivo, entregables, próximos pasos y recursos.",
    lineas: [
      ["aviso", "Objetivo: qué problema resuelve y para cuándo."],
      ["h3", "Entregables"],
      ["todo", ""],
      ["h3", "Próximos pasos"],
      ["num", ""],
      ["h3", "Recursos y enlaces"],
      ["lista", ""],
    ],
  },
  {
    id: "diario",
    nombre: "Diario",
    icono: "📔",
    descripcion: "Cómo te fue, qué aprendiste y por qué estás agradecido.",
    lineas: [
      ["h3", "¿Cómo me fue hoy?"],
      ["p", ""],
      ["h3", "Lo que aprendí"],
      ["lista", ""],
      ["h3", "Agradezco"],
      ["lista", ""],
    ],
  },
  {
    id: "lectura",
    nombre: "Libro o curso",
    icono: "📚",
    descripcion: "Resumen, citas y lo que vas a aplicar.",
    lineas: [
      ["h3", "Resumen"],
      ["p", ""],
      ["h3", "Citas"],
      ["cita", ""],
      ["h3", "Para aplicar"],
      ["todo", ""],
    ],
  },
  {
    id: "semana",
    nombre: "Plan semanal",
    icono: "🗓️",
    descripcion: "Prioridades de la semana, día por día.",
    lineas: [
      ["h3", "3 prioridades"],
      ["num", ""],
      ["separador", ""],
      ...(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].flatMap((d) => [
        ["h3", d],
        ["todo", ""],
      ]) as Linea[]),
    ],
  },
];

/** Página nueva a partir de una plantilla de Orbe (con ids de bloque nuevos). */
export function desdePlantilla(id: string): DatosPagina | null {
  const p = PLANTILLAS.find((x) => x.id === id);
  if (!p) return null;
  return {
    titulo: "",
    icono: p.icono,
    contenido: p.lineas.map(([tipo, texto, hecho]) => ({ ...nuevoBloque(tipo, texto), ...(hecho !== undefined ? { hecho } : {}) })),
  };
}

/**
 * Copia una página tuya como base de otra: bloques con ids nuevos, casillas sin marcar y SIN fotos ni PDF
 * (los archivos pertenecen a la página original y no se duplican, para no gastar espacio).
 */
export function copiarComoPlantilla(origen: { titulo: string; icono: string; contenido: Bloque[] }): DatosPagina {
  return {
    titulo: origen.titulo,
    icono: origen.icono,
    contenido: origen.contenido
      .filter((b) => esDeTexto(b.tipo) || b.tipo === "separador")
      .map((b) => ({ ...nuevoBloque(b.tipo, b.texto), ...(b.tipo === "todo" ? { hecho: false } : {}) })),
  };
}
