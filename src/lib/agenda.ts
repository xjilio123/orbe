import { diaSemana, sumarDias } from "./fechas";
import { proximasVeces } from "./repeticion";
import type { Tarea } from "./tareas";

// Agenda: qué hay cada día (tareas, sus próximas repeticiones y eventos de Google Calendar).
// Todo en hora de Lima y con fechas "AAAA-MM-DD". La semana empieza el lunes, como en Perú.

export type Evento = {
  id: string;
  titulo: string;
  fecha: string;
  /** "HH:MM" en Lima; null = todo el día. */
  inicio: string | null;
  fin: string | null;
  lugar: string | null;
};

export type ItemAgenda =
  | { tipo: "tarea"; clave: string; tarea: Tarea; /** Una vez futura de una tarea que se repite (aún no existe). */ proyectada: boolean }
  | { tipo: "evento"; clave: string; evento: Evento };

export const VISTAS = ["mes", "semana", "dia"] as const;
export type VistaAgenda = (typeof VISTAS)[number];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const INICIALES_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

/** Lunes de la semana de una fecha. */
export const lunesDe = (fecha: string) => sumarDias(fecha, -((diaSemana(fecha) + 6) % 7));

/** Las 6 semanas (42 días) que muestra la cuadrícula del mes: siempre la misma altura, nada salta al cambiar de mes. */
export function cuadriculaMes(fecha: string): string[] {
  const inicio = lunesDe(`${fecha.slice(0, 7)}-01`);
  return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
}

export const diasDeSemana = (fecha: string) => Array.from({ length: 7 }, (_, i) => sumarDias(lunesDe(fecha), i));

/** Mismo día en otro mes (el 31 pasa al último día si no existe). */
export function moverMes(fecha: string, meses: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** "noviembre 2026" */
export const nombreMes = (fecha: string) => `${MESES[Number(fecha.slice(5, 7)) - 1]} ${fecha.slice(0, 4)}`;

/** "martes 27 de octubre" */
export const fechaLarga = (fecha: string) => `${DIAS[diaSemana(fecha)]} ${Number(fecha.slice(8))} de ${MESES[Number(fecha.slice(5, 7)) - 1]}`;

/** "27 oct – 2 nov" */
export function rangoCorto(desde: string, hasta: string): string {
  const corto = (f: string) => `${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1].slice(0, 3)}`;
  return `${corto(desde)} – ${corto(hasta)}`;
}

const minutos = (hora: string | null) => (hora ? Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5)) : -1);

/** Primero lo de todo el día, luego por hora. */
function ordenar(a: ItemAgenda, b: ItemAgenda): number {
  const hora = (i: ItemAgenda) => (i.tipo === "evento" ? i.evento.inicio : i.tarea.hora);
  const dif = minutos(hora(a)) - minutos(hora(b));
  if (dif !== 0) return dif;
  if (a.tipo !== b.tipo) return a.tipo === "evento" ? -1 : 1;
  return a.clave < b.clave ? -1 : 1;
}

/** Agrupa tareas (y sus próximas repeticiones) y eventos por día dentro de [desde, hasta]. */
export function itemsPorDia(tareas: Tarea[], eventos: Evento[], desde: string, hasta: string): Record<string, ItemAgenda[]> {
  const dias: Record<string, ItemAgenda[]> = {};
  const poner = (fecha: string, item: ItemAgenda) => {
    if (fecha < desde || fecha > hasta) return;
    (dias[fecha] ??= []).push(item);
  };

  const vistas = new Set<string>();
  for (const t of tareas) {
    if (!t.fecha || t.padre_id || vistas.has(t.id)) continue;
    vistas.add(t.id);
    poner(t.fecha, { tipo: "tarea", clave: t.id, tarea: t, proyectada: false });
    if (t.repetir && t.estado !== "hecha") {
      for (const f of proximasVeces(t.fecha, t.repetir, desde, hasta, 60)) {
        poner(f, { tipo: "tarea", clave: `${t.id}:${f}`, tarea: { ...t, fecha: f, estado: "pendiente" }, proyectada: true });
      }
    }
  }
  for (const e of eventos) poner(e.fecha, { tipo: "evento", clave: `${e.id}:${e.fecha}`, evento: e });

  for (const lista of Object.values(dias)) lista.sort(ordenar);
  return dias;
}

/** Colores de los puntos de un día en el mes (máximo 3): eventos, tareas pendientes y hechas. */
export function puntosDelDia(items: ItemAgenda[] | undefined): ("evento" | "tarea" | "hecha")[] {
  if (!items) return [];
  const tipos = new Set(items.map((i) => (i.tipo === "evento" ? "evento" : i.tarea.estado === "hecha" ? "hecha" : "tarea")));
  return (["evento", "tarea", "hecha"] as const).filter((t) => tipos.has(t));
}

/** Posición de cada bloque en la vista de día: columnas para los que se cruzan. */
export type Bloque = { item: ItemAgenda; inicio: number; fin: number; columna: number; columnas: number };

export function bloquesDelDia(items: ItemAgenda[]): Bloque[] {
  const conHora = items
    .map((item) => {
      const [ini, fin] = item.tipo === "evento" ? [item.evento.inicio, item.evento.fin] : [item.tarea.hora, null];
      if (!ini) return null;
      const inicio = minutos(ini);
      const final = fin ? Math.max(minutos(fin), inicio + 15) : inicio + 30;
      return { item, inicio, fin: Math.min(final, 24 * 60), columna: 0, columnas: 1 };
    })
    .filter((b): b is Bloque => b !== null)
    .sort((a, b) => a.inicio - b.inicio || b.fin - a.fin);

  // Grupos de bloques que se cruzan; dentro de cada grupo, la primera columna libre.
  let grupo: Bloque[] = [];
  let finGrupo = -1;
  const cerrar = () => {
    const n = Math.max(1, ...grupo.map((b) => b.columna + 1));
    for (const b of grupo) b.columnas = n;
    grupo = [];
  };
  for (const b of conHora) {
    if (b.inicio >= finGrupo) cerrar();
    const ocupadas = new Set(grupo.filter((o) => o.fin > b.inicio).map((o) => o.columna));
    while (ocupadas.has(b.columna)) b.columna++;
    grupo.push(b);
    finGrupo = Math.max(finGrupo, b.fin);
  }
  cerrar();
  return conHora;
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Lee ?vista= y ?dia= sin confiar en ellos: lo que no sea válido vuelve a "mes" y a hoy. */
export function leerParametros(vista: unknown, dia: unknown, hoy: string): { vista: VistaAgenda; dia: string } {
  const v = VISTAS.includes(vista as VistaAgenda) ? (vista as VistaAgenda) : "mes";
  const valido = typeof dia === "string" && FECHA.test(dia) && dia >= "2000-01-01" && dia <= "2100-12-31" && sumarDias(dia, 0) === dia;
  return { vista: v, dia: valido ? dia : hoy };
}

/** Primer y último día que muestra cada vista. */
export function rangoDeVista(vista: VistaAgenda, dia: string): [string, string] {
  if (vista === "mes") {
    const dias = cuadriculaMes(dia);
    return [dias[0], dias[41]];
  }
  if (vista === "semana") {
    const dias = diasDeSemana(dia);
    return [dias[0], dias[6]];
  }
  return [dia, dia];
}
