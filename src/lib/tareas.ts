import { diasEntre } from "./fechas";
import type { Repetir } from "./repeticion";

export const ESTADOS = ["pendiente", "en_curso", "hecha"] as const;
export type Estado = (typeof ESTADOS)[number];
export const NOMBRE_ESTADO: Record<Estado, string> = { pendiente: "Por hacer", en_curso: "En curso", hecha: "Hecha" };

export const COLORES_LISTA = ["indigo", "azul", "rojo", "morado", "naranja", "verde", "celeste"] as const;
export type ColorLista = (typeof COLORES_LISTA)[number];

export type Tarea = {
  id: string;
  titulo: string;
  notas: string;
  estado: Estado;
  prioridad: number;
  fecha: string | null;
  hora: string | null;
  lista_id: string | null;
  padre_id: string | null;
  hecha_en: string | null;
  creado: string;
  repetir: Repetir | null;
  /** Minutos antes de la hora para avisar; null = sin aviso. */
  aviso: number | null;
  /** Cuadrante de la matriz elegido a mano (1-4); vacío = se calcula solo. */
  cuadrante?: number | null;
};

export type Lista = { id: string; nombre: string; color: ColorLista; orden: number };

/** Inbox: lo capturado que todavía no tiene lista ni fecha. */
export const esInbox = (t: Tarea) => t.estado !== "hecha" && !t.padre_id && !t.lista_id && !t.fecha;

/** Orden de trabajo: primero lo vencido y lo de hoy, luego prioridad, hora y antigüedad. */
export function compararTareas(a: Tarea, b: Tarea): number {
  if ((a.fecha ?? "9999") !== (b.fecha ?? "9999")) return (a.fecha ?? "9999") < (b.fecha ?? "9999") ? -1 : 1;
  if (a.prioridad !== b.prioridad) return b.prioridad - a.prioridad;
  if ((a.hora ?? "99") !== (b.hora ?? "99")) return (a.hora ?? "99") < (b.hora ?? "99") ? -1 : 1;
  return a.creado < b.creado ? -1 : 1;
}

export type Grupo = { clave: string; titulo: string; tareas: Tarea[]; alerta?: boolean };

/** Pendientes con fecha agrupadas como en Recordatorios de iOS. */
export function agruparPorFecha(tareas: Tarea[], hoy: string): Grupo[] {
  const grupos: Grupo[] = [
    { clave: "vencidas", titulo: "Vencidas", tareas: [], alerta: true },
    { clave: "hoy", titulo: "Hoy", tareas: [] },
    { clave: "manana", titulo: "Mañana", tareas: [] },
    { clave: "semana", titulo: "Próximos 7 días", tareas: [] },
    { clave: "despues", titulo: "Más adelante", tareas: [] },
  ];
  for (const t of [...tareas].sort(compararTareas)) {
    if (t.estado === "hecha" || t.padre_id || !t.fecha) continue;
    const dif = diasEntre(hoy, t.fecha);
    const i = dif < 0 ? 0 : dif === 0 ? 1 : dif === 1 ? 2 : dif <= 7 ? 3 : 4;
    grupos[i].tareas.push(t);
  }
  return grupos.filter((g) => g.tareas.length > 0);
}

/** Lo que toca hoy (incluye lo vencido) y cuánto ya se terminó hoy. */
export function resumenDelDia(tareas: Tarea[], hoy: string, hechaHoy: (t: Tarea) => boolean) {
  const pendientes = tareas
    .filter((t) => t.estado !== "hecha" && !t.padre_id && t.fecha !== null && t.fecha <= hoy)
    .sort(compararTareas);
  const hechas = tareas.filter((t) => t.estado === "hecha" && !t.padre_id && hechaHoy(t)).length;
  const total = pendientes.length + hechas;
  return { pendientes, hechas, total, fraccion: total === 0 ? 0 : hechas / total };
}

/** "3 de 5 subtareas": progreso de una tarea con subtareas. */
export function progresoSubtareas(subtareas: Tarea[]): { hechas: number; total: number } {
  return { hechas: subtareas.filter((s) => s.estado === "hecha").length, total: subtareas.length };
}
