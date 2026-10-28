import { lunesDe } from "./agenda";
import { diasEntre, sumarDias } from "./fechas";
import { compararTareas, ESTADOS, type Tarea } from "./tareas";

// Matriz urgente/importante, revisión semanal y vista de tabla: cálculos puros.

export type Cuadrante = 1 | 2 | 3 | 4;

export const CUADRANTES: { n: Cuadrante; nombre: string; accion: string; clase: string; texto: string }[] = [
  { n: 1, nombre: "Hacer ya", accion: "Urgente e importante", clase: "bg-rojo-relleno/12", texto: "text-rojo" },
  { n: 2, nombre: "Planificar", accion: "Importante, no urgente", clase: "bg-azul-relleno/12", texto: "text-azul" },
  { n: 3, nombre: "Delegar o acotar", accion: "Urgente, no importante", clase: "bg-naranja-relleno/15", texto: "text-naranja" },
  { n: 4, nombre: "Soltar", accion: "Ni urgente ni importante", clase: "bg-control", texto: "text-texto-2" },
];

/** Días hasta la fecha para considerar una tarea urgente (incluye las atrasadas). */
export const DIAS_URGENTE = 2;

export const esUrgente = (t: Pick<Tarea, "fecha">, hoy: string) => t.fecha !== null && diasEntre(hoy, t.fecha) <= DIAS_URGENTE;
export const esImportante = (t: Pick<Tarea, "prioridad">) => t.prioridad >= 2;

/** El cuadrante elegido a mano, o el que corresponde por prioridad (!! o más) y fecha (hasta 2 días). */
export function cuadranteDe(t: Pick<Tarea, "fecha" | "prioridad"> & { cuadrante?: number | null }, hoy: string): Cuadrante {
  if (t.cuadrante && t.cuadrante >= 1 && t.cuadrante <= 4) return t.cuadrante as Cuadrante;
  const urgente = esUrgente(t, hoy);
  const importante = esImportante(t);
  return urgente && importante ? 1 : importante ? 2 : urgente ? 3 : 4;
}

/** Tareas pendientes (sin subtareas) repartidas en los 4 cuadrantes, cada uno ordenado. */
export function matriz(tareas: Tarea[], hoy: string): Record<Cuadrante, Tarea[]> {
  const grupos: Record<Cuadrante, Tarea[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const t of tareas) {
    if (t.estado === "hecha" || t.padre_id) continue;
    grupos[cuadranteDe(t, hoy)].push(t);
  }
  for (const n of [1, 2, 3, 4] as const) grupos[n].sort(compararTareas);
  return grupos;
}

// ---------- Revisión semanal ----------

export function revisionSemanal(pendientes: Tarea[], hechasSemana: Tarea[], hoy: string) {
  const abiertas = pendientes.filter((t) => t.estado !== "hecha" && !t.padre_id);
  const hasta = sumarDias(hoy, 7);
  return {
    lunes: lunesDe(hoy),
    hechas: [...hechasSemana].filter((t) => !t.padre_id).sort((a, b) => (b.hecha_en ?? "").localeCompare(a.hecha_en ?? "")),
    atrasadas: abiertas.filter((t) => t.fecha !== null && t.fecha < hoy).sort(compararTareas),
    // Sin fecha y creadas hace 14 días o más: probablemente se quedaron olvidadas.
    estancadas: abiertas.filter((t) => t.fecha === null && diasEntre(t.creado.slice(0, 10), hoy) >= 14).sort((a, b) => a.creado.localeCompare(b.creado)),
    proximas: abiertas.filter((t) => t.fecha !== null && t.fecha >= hoy && t.fecha <= hasta).sort(compararTareas),
    inbox: abiertas.filter((t) => !t.lista_id && !t.fecha).length,
  };
}

// ---------- Vista de tabla ----------

export const ORDENES = ["fecha", "prioridad", "titulo", "estado", "creado"] as const;
export type Orden = (typeof ORDENES)[number];
export const FILTROS_ESTADO = ["pendientes", "todas", "hechas"] as const;
export type FiltroEstado = (typeof FILTROS_ESTADO)[number];
export type ConfigTabla = { orden: Orden; estado: FiltroEstado; prioridad: number };

export const CONFIG_INICIAL: ConfigTabla = { orden: "fecha", estado: "pendientes", prioridad: 0 };

/** Valida una configuración que viene de la URL o de la base (lo desconocido vuelve al valor por defecto). */
export function leerConfig(datos: Record<string, unknown> | null | undefined): ConfigTabla {
  const d = datos ?? {};
  const orden = (ORDENES as readonly string[]).includes(String(d.orden)) ? (d.orden as Orden) : CONFIG_INICIAL.orden;
  const estado = (FILTROS_ESTADO as readonly string[]).includes(String(d.estado)) ? (d.estado as FiltroEstado) : CONFIG_INICIAL.estado;
  const n = Number(d.prioridad);
  const prioridad = Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
  return { orden, estado, prioridad };
}

/** Configuración → parámetros de la URL (solo lo que cambia). */
export function aParametros(c: ConfigTabla): string {
  const p = new URLSearchParams({ vista: "tabla" });
  if (c.orden !== CONFIG_INICIAL.orden) p.set("orden", c.orden);
  if (c.estado !== CONFIG_INICIAL.estado) p.set("estado", c.estado);
  if (c.prioridad > 0) p.set("prioridad", String(c.prioridad));
  return p.toString();
}

const PESO_ESTADO = Object.fromEntries(ESTADOS.map((e, i) => [e, i]));

export function aplicarTabla(tareas: Tarea[], c: ConfigTabla): Tarea[] {
  const filtradas = tareas.filter(
    (t) =>
      !t.padre_id &&
      t.prioridad >= c.prioridad &&
      (c.estado === "todas" || (c.estado === "hechas" ? t.estado === "hecha" : t.estado !== "hecha")),
  );
  const porFecha = (a: Tarea, b: Tarea) => (a.fecha ?? "9999").localeCompare(b.fecha ?? "9999") || (a.hora ?? "99").localeCompare(b.hora ?? "99");
  const comparar: Record<Orden, (a: Tarea, b: Tarea) => number> = {
    fecha: (a, b) => porFecha(a, b) || b.prioridad - a.prioridad,
    prioridad: (a, b) => b.prioridad - a.prioridad || porFecha(a, b),
    titulo: (a, b) => a.titulo.localeCompare(b.titulo, "es"),
    estado: (a, b) => PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado] || porFecha(a, b),
    creado: (a, b) => b.creado.localeCompare(a.creado),
  };
  return [...filtradas].sort((a, b) => comparar[c.orden](a, b) || a.id.localeCompare(b.id));
}
