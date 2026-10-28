import { DIAS, diaSemana, sumarDias } from "./fechas";

// Repetición de tareas. La base crea la siguiente al marcar la actual (private.siguiente_fecha);
// aquí está la misma regla para mostrar las próximas veces en la Agenda y en las pistas de la captura.

export const REPETICIONES = ["diaria", "laborables", "semanal", "mensual", "anual"] as const;
export type Repetir = (typeof REPETICIONES)[number];

export const NOMBRE_REPETIR: Record<Repetir, string> = {
  diaria: "Cada día",
  laborables: "De lunes a viernes",
  semanal: "Cada semana",
  mensual: "Cada mes",
  anual: "Cada año",
};

/** Minutos antes de la hora de la tarea. null = sin aviso. */
export const AVISOS = [
  { valor: null, nombre: "Sin aviso" },
  { valor: 0, nombre: "A la hora" },
  { valor: 5, nombre: "5 min antes" },
  { valor: 15, nombre: "15 min antes" },
  { valor: 30, nombre: "30 min antes" },
  { valor: 60, nombre: "1 hora antes" },
  { valor: 1440, nombre: "1 día antes" },
] as const;
export const VALORES_AVISO = [0, 5, 15, 30, 60, 1440] as const;

const dos = (n: number) => String(n).padStart(2, "0");

/** Suma meses o años a una fecha; si el día no existe (31 de febrero), queda en el último del mes. */
function sumarMeses(fecha: string, meses: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const total = a * 12 + (m - 1) + meses;
  const anio = Math.floor(total / 12);
  const mes = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${dos(mes)}-${dos(Math.min(d, ultimo))}`;
}

/** La vez número `i` (1 = la siguiente) después de `fecha`. Igual que la regla de la base. */
function vez(fecha: string, repetir: Repetir, anterior: string, i: number): string {
  switch (repetir) {
    case "diaria":
      return sumarDias(anterior, 1);
    case "laborables": {
      const dia = diaSemana(anterior); // 5 = viernes, 6 = sábado
      return sumarDias(anterior, dia === 5 ? 3 : dia === 6 ? 2 : 1);
    }
    case "semanal":
      return sumarDias(anterior, 7);
    case "mensual":
      return sumarMeses(fecha, i);
    case "anual":
      return sumarMeses(fecha, i * 12);
  }
}

/** Fecha de la próxima tarea al marcar esta como hecha: siempre después de hoy. */
export function siguienteFecha(fecha: string, repetir: Repetir, hoy: string): string {
  let f = fecha;
  for (let i = 1; i <= 5000; i++) {
    f = vez(fecha, repetir, f, i);
    if (f > hoy) break;
  }
  return f;
}

/** Las próximas veces de una tarea que se repite dentro de [desde, hasta] (sin contar la fecha actual). */
export function proximasVeces(fecha: string, repetir: Repetir, desde: string, hasta: string, maximo = 400): string[] {
  const veces: string[] = [];
  let f = fecha;
  for (let i = 1; i <= 5000 && veces.length < maximo; i++) {
    f = vez(fecha, repetir, f, i);
    if (f > hasta) break;
    if (f >= desde) veces.push(f);
  }
  return veces;
}

/** "Cada lunes", "Cada mes, el día 15", "De lunes a viernes". */
export function etiquetaRepetir(repetir: Repetir, fecha: string | null): string {
  if (!fecha) return NOMBRE_REPETIR[repetir];
  if (repetir === "semanal") return `Cada ${DIAS[diaSemana(fecha)]}`;
  if (repetir === "mensual") return `Cada mes, el día ${Number(fecha.slice(8))}`;
  return NOMBRE_REPETIR[repetir];
}
