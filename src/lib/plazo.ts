import { etiquetaFecha, etiquetaHora } from "./fechas";

// Inicio y fin de algo con fecha (tareas, fechas importantes, exámenes). Cálculos puros.
// Fecha de fin vacía = termina el mismo día que empieza. Hora de fin vacía = sin hora de término.

export type Plazo = { fecha: string | null; hora: string | null; fecha_fin: string | null; hora_fin: string | null };

/** El último día: la fecha de fin o, si no hay, la de inicio. Es el plazo real (para "vencida" y "urgente"). */
export const finDe = (p: Pick<Plazo, "fecha" | "fecha_fin">): string | null => p.fecha_fin ?? p.fecha;

/** ¿Ocurre ese día? Entre el inicio y el fin, ambos incluidos. */
export const ocurreEn = (p: Pick<Plazo, "fecha" | "fecha_fin">, dia: string): boolean =>
  p.fecha !== null && p.fecha <= dia && (finDe(p) as string) >= dia;

export type ErrorPlazo = { campo: "hora" | "fecha_fin" | "hora_fin"; mensaje: string };

/** Lo que no tiene sentido en un plazo, en palabras y junto al campo que hay que corregir. */
export function revisarPlazo(p: Plazo): ErrorPlazo | null {
  if (p.hora && !p.fecha) return { campo: "hora", mensaje: "Para poner hora, elige también una fecha" };
  if (p.fecha_fin && !p.fecha) return { campo: "fecha_fin", mensaje: "Para poner fecha de fin, elige también la de inicio" };
  if (p.fecha_fin && p.fecha && p.fecha_fin < p.fecha) return { campo: "fecha_fin", mensaje: "La fecha de fin no puede ser antes del inicio" };
  if (p.hora_fin && !p.hora) return { campo: "hora_fin", mensaje: "Para poner hora de fin, elige también la de inicio" };
  const mismoDia = !p.fecha_fin || p.fecha_fin === p.fecha;
  if (p.hora_fin && p.hora && mismoDia && p.hora_fin <= p.hora) return { campo: "hora_fin", mensaje: "La hora de fin debe ser después de la de inicio" };
  return null;
}

/**
 * Deja el plazo como lo guarda la base: el fin igual al inicio va vacío y lo que no tiene sentido se quita
 * (para la captura rápida, la IA y Siri: mejor guardar sin fin que perder lo anotado).
 */
export function limpiarPlazo<T extends Plazo>(p: T): T {
  const hora = p.fecha ? p.hora : null;
  const fecha_fin = p.fecha && p.fecha_fin && p.fecha_fin > p.fecha ? p.fecha_fin : null;
  const hora_fin = hora && p.hora_fin && (fecha_fin || p.hora_fin > hora) ? p.hora_fin : null;
  return { ...p, hora, fecha_fin, hora_fin };
}

/** "3:00 – 5:00 p. m." (el "a. m."/"p. m." una sola vez si coincide) o solo "3:00 p. m.". */
export function rangoHoras(inicio: string, fin: string | null): string {
  const a = etiquetaHora(inicio);
  if (!fin) return a;
  const b = etiquetaHora(fin);
  return a.slice(-5) === b.slice(-5) ? `${a.slice(0, -6)} – ${b}` : `${a} – ${b}`;
}

/** "Hoy · 3:00 – 5:00 p. m." o, si dura varios días, "Hoy 10:00 p. m. – jue 5 nov 8:00 a. m.". */
export function etiquetaPlazo(p: Plazo, hoy: string): string {
  if (!p.fecha) return "";
  const inicio = etiquetaFecha(p.fecha, hoy);
  if (!p.fecha_fin || p.fecha_fin === p.fecha) return p.hora ? `${inicio} · ${rangoHoras(p.hora, p.hora_fin)}` : inicio;
  const conHora = (fecha: string, hora: string | null) => (hora ? `${fecha} ${etiquetaHora(hora)}` : fecha);
  return `${conHora(inicio, p.hora)} – ${conHora(etiquetaFecha(p.fecha_fin, hoy), p.hora_fin)}`;
}

/** Solo las fechas: "Hoy" o "lun 9 nov – vie 13 nov" (para columnas angostas). */
export function etiquetaDias(p: Pick<Plazo, "fecha" | "fecha_fin">, hoy: string): string {
  if (!p.fecha) return "";
  const inicio = etiquetaFecha(p.fecha, hoy);
  return p.fecha_fin && p.fecha_fin !== p.fecha ? `${inicio} – ${etiquetaFecha(p.fecha_fin, hoy)}` : inicio;
}
