import { lunesDe } from "./agenda";
import { diasEntre, sumarDias } from "./fechas";
import type { ColorLista } from "./tareas";

// Hábitos, metas, fechas importantes, foco y estadísticas: cálculos puros (sin base ni React).

export type Habito = {
  id: string;
  nombre: string;
  icono: string;
  color: ColorLista;
  /** Días por semana que quieres cumplirlo (7 = todos los días). */
  dias_semana: number;
  hecho_hoy: boolean;
  /** Días de esta semana (lunes a hoy) en que lo marcaste. */
  marcas_semana: string[];
  racha: number;
};

export type Meta = {
  id: string;
  titulo: string;
  tipo: "numero" | "lista";
  lista_id: string | null;
  lista: string | null;
  objetivo: number | null;
  actual: number;
  unidad: string;
  color: ColorLista;
};

export type FechaImportante = { id: string; titulo: string; fecha: string; icono: string; color: ColorLista };

export type SemanaEstadistica = { semana: string; tareas: number; minutos: number };

export const esDiario = (h: Pick<Habito, "dias_semana">) => h.dias_semana >= 7;

/** Cuánto del anillo se llena: hoy (si es diario) o lo que llevas de la semana. */
export function fraccionHabito(h: Habito): number {
  if (esDiario(h)) return h.hecho_hoy ? 1 : 0;
  return Math.min(1, h.marcas_semana.length / h.dias_semana);
}

export function frecuenciaHabito(dias: number): string {
  if (dias >= 7) return "Todos los días";
  return dias === 1 ? "1 día por semana" : `${dias} días por semana`;
}

export function textoRacha(h: Habito): string {
  if (esDiario(h)) {
    if (h.racha === 0) return "Empieza hoy";
    return h.racha === 1 ? "1 día seguido" : `${h.racha} días seguidos`;
  }
  if (h.racha === 0) return `${h.marcas_semana.length} de ${h.dias_semana} esta semana`;
  return h.racha === 1 ? "1 semana seguida" : `${h.racha} semanas seguidas`;
}

/** Cambio optimista al tocar el anillo: el mismo cálculo que hará la base, para no esperar al servidor. */
export function alternarHabito(h: Habito, hoy: string): Habito {
  const hecho = !h.hecho_hoy;
  const marcas = hecho ? [...h.marcas_semana, hoy].sort() : h.marcas_semana.filter((f) => f !== hoy);
  let racha = h.racha;
  if (esDiario(h)) racha = Math.max(0, racha + (hecho ? 1 : -1));
  else {
    const antes = h.marcas_semana.length >= h.dias_semana;
    const despues = marcas.length >= h.dias_semana;
    if (!antes && despues) racha += 1;
    if (antes && !despues) racha = Math.max(0, racha - 1);
  }
  return { ...h, hecho_hoy: hecho, marcas_semana: marcas, racha };
}

/** Los 7 días de la semana de `hoy` con su estado: hecho, pendiente o futuro. */
export function semanaDeHabito(h: Habito, hoy: string): { fecha: string; estado: "hecho" | "pendiente" | "futuro" }[] {
  const lunes = lunesDe(hoy);
  const marcadas = new Set(h.marcas_semana);
  return Array.from({ length: 7 }, (_, i) => {
    const fecha = sumarDias(lunes, i);
    return { fecha, estado: marcadas.has(fecha) ? "hecho" : fecha > hoy ? "futuro" : "pendiente" };
  });
}

export function fraccionMeta(m: Meta): number {
  if (!m.objetivo || m.objetivo <= 0) return 0;
  return Math.min(1, Math.max(0, m.actual / m.objetivo));
}

const numero = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ","));

export function textoMeta(m: Meta): string {
  if (m.tipo === "lista") {
    if (!m.lista_id) return "Su lista se borró";
    const total = m.objetivo ?? 0;
    return total === 0 ? `Aún no hay tareas en ${m.lista ?? "la lista"}` : `${numero(m.actual)} de ${numero(total)} tareas hechas`;
  }
  const unidad = m.unidad ? ` ${m.unidad}` : "";
  return `${numero(m.actual)} de ${numero(m.objetivo ?? 0)}${unidad}`;
}

/** "Hoy", "Mañana", "Faltan 12 días", "Pasó hace 3 días". */
export function textoFaltan(fecha: string, hoy: string): string {
  const dif = diasEntre(hoy, fecha);
  if (dif === 0) return "Es hoy";
  if (dif === 1) return "Mañana";
  if (dif > 1) return `Faltan ${dif} días`;
  return dif === -1 ? "Fue ayer" : `Fue hace ${-dif} días`;
}

export const diasQueFaltan = (fecha: string, hoy: string) => diasEntre(hoy, fecha);

/** Próximas fechas (de hoy en adelante), de la más cercana a la más lejana. */
export function proximasFechas(fechas: FechaImportante[], hoy: string, cuantas = 3): FechaImportante[] {
  return fechas
    .filter((f) => f.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, cuantas);
}

/** Milisegundos a "mm:ss" (o "h:mm:ss" desde una hora). */
export function formatoReloj(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mmss = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

/** Minutos de foco a "1 h 25 min", "45 min", "0 min". */
export function formatoMinutos(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Versión corta para cifras grandes: "45 min", "2 h", "17,9 h". */
export function formatoHoras(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.round((minutos / 60) * 10) / 10;
  return `${String(horas).replace(".", ",")} h`;
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
/** "2026-10-26" → "26 oct". */
export const fechaCorta = (fecha: string) => `${Number(fecha.slice(8, 10))} ${MESES[Number(fecha.slice(5, 7)) - 1]}`;

/** Resumen de las estadísticas: esta semana contra el promedio de las anteriores. */
export function resumenEstadisticas(semanas: SemanaEstadistica[]) {
  const actual = semanas.at(-1) ?? { semana: "", tareas: 0, minutos: 0 };
  const anteriores = semanas.slice(0, -1);
  const promedio = anteriores.length ? anteriores.reduce((s, x) => s + x.tareas, 0) / anteriores.length : 0;
  return {
    tareasSemana: actual.tareas,
    minutosSemana: actual.minutos,
    promedioTareas: Math.round(promedio * 10) / 10,
    totalTareas: semanas.reduce((s, x) => s + x.tareas, 0),
    totalMinutos: semanas.reduce((s, x) => s + x.minutos, 0),
    maximoTareas: Math.max(1, ...semanas.map((x) => x.tareas)),
    maximoMinutos: Math.max(1, ...semanas.map((x) => x.minutos)),
  };
}

/** Año de una fecha "AAAA-MM-DD". */
export const anioDe = (fecha: string) => Number(fecha.slice(0, 4));
