// Fechas siempre en hora de Lima, aunque el servidor (Vercel) corra en UTC.
export const ZONA = "America/Lima";

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
