import type { NombreIcono } from "@/components/Icono";

// Atajos de la barra ⌘K: ir a cualquier pantalla escribiendo un par de letras.

export type Comando = { id: string; nombre: string; ruta: string; icono: NombreIcono; palabras: string };

export const COMANDOS: Comando[] = [
  { id: "hoy", nombre: "Hoy", ruta: "/", icono: "hoy", palabras: "inicio dia resumen nueva tarea capturar" },
  { id: "tareas", nombre: "Tareas", ruta: "/tareas", icono: "tareas", palabras: "pendientes inbox listas" },
  { id: "nueva-pagina", nombre: "Nueva página", ruta: "/apuntes/nueva", icono: "mas", palabras: "apunte nota crear plantilla" },
  { id: "preguntar", nombre: "Pregunta a tus notas", ruta: "/preguntar", icono: "chispa", palabras: "ia preguntar respuesta buscar significado" },
  { id: "progreso", nombre: "Progreso", ruta: "/progreso", icono: "llama", palabras: "habitos metas racha fechas cuenta regresiva estadisticas numeros" },
  { id: "foco", nombre: "Modo foco", ruta: "/foco", icono: "foco", palabras: "pomodoro temporizador concentracion enfocarme" },
  { id: "estudio", nombre: "Modo estudio", ruta: "/estudio", icono: "estudio", palabras: "cursos examenes tarjetas repasar universidad" },
  { id: "diario", nombre: "Diario", ruta: "/diario", icono: "diario", palabras: "animo estado como me siento dia journal" },
  { id: "mapa", nombre: "Mapa de notas", ruta: "/apuntes/mapa", icono: "mapa", palabras: "grafo enlaces conexiones backlinks" },
  { id: "apuntes", nombre: "Apuntes", ruta: "/apuntes", icono: "apuntes", palabras: "notas paginas" },
  { id: "agenda", nombre: "Agenda", ruta: "/agenda", icono: "agenda", palabras: "calendario mes semana google" },
  { id: "ajustes", nombre: "Ajustes", ruta: "/ajustes", icono: "ajustes", palabras: "avisos tema oscuro claro espacio calendario" },
  { id: "papelera", nombre: "Papelera", ruta: "/papelera", icono: "papelera", palabras: "borrado restaurar recuperar eliminar" },
];

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Comandos cuyo nombre o palabras clave empiezan con lo escrito (todas las palabras deben coincidir). */
export function filtrarComandos(consulta: string): Comando[] {
  const palabras = normal(consulta).split(/[^a-z0-9]+/).filter(Boolean);
  if (palabras.length === 0) return COMANDOS;
  return COMANDOS.filter((c) => {
    const texto = normal(`${c.nombre} ${c.palabras}`).split(/[^a-z0-9]+/);
    return palabras.every((p) => texto.some((w) => w.startsWith(p)));
  });
}
