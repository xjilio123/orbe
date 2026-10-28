// Fechas siempre en hora de Lima, aunque el servidor (Vercel) corra en UTC.
// Las fechas sin hora se manejan como texto "AAAA-MM-DD" para no mezclar zonas horarias.
export const ZONA = "America/Lima";

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] as const;
const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"] as const;

/** "martes 27 oct" → encabezado de la pantalla Hoy. */
export function fechaEncabezado(fecha: Date): string {
  return new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, weekday: "long", day: "numeric", month: "short" })
    .format(fecha)
    .replace(",", "")
    .replace(".", "");
}

/** Saludo según la hora en Lima. */
export function saludo(fecha: Date): string {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: ZONA, hour: "numeric", hourCycle: "h23" }).format(fecha));
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Fecha de hoy en Lima como "AAAA-MM-DD". */
export function hoyLima(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(ahora);
}

/** Suma (o resta) días a una fecha "AAAA-MM-DD" sin pasar por zonas horarias. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Día de la semana (0 = domingo) de una fecha "AAAA-MM-DD". */
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** Días entre dos fechas "AAAA-MM-DD" (positivo si `hasta` es posterior). */
export function diasEntre(desde: string, hasta: string): number {
  const ms = (f: string) => {
    const [a, m, d] = f.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((ms(hasta) - ms(desde)) / 86_400_000);
}

/** Etiqueta corta y humana para una fecha de entrega: "Hoy", "Mañana", "Ayer", "vie 31 oct". */
export function etiquetaFecha(fecha: string, hoy: string): string {
  const dif = diasEntre(hoy, fecha);
  if (dif === 0) return "Hoy";
  if (dif === 1) return "Mañana";
  if (dif === -1) return "Ayer";
  const [a, m, d] = fecha.split("-").map(Number);
  const base = `${DIAS_CORTOS[diaSemana(fecha)]} ${d} ${MESES_CORTOS[m - 1]}`;
  return a === Number(hoy.slice(0, 4)) ? base : `${base} ${a}`;
}

/** "17:30" → "5:30 p. m." (formato de Perú). */
export function etiquetaHora(hora: string): string {
  const [h, min] = hora.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, "0")} ${sufijo}`;
}

export { DIAS };
