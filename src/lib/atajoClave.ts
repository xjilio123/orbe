// Partes puras del atajo de Siri (sin node:crypto): leer la clave y describir su último uso.

/** "Bearer orbe_xxx" (o la clave sola) → la clave, si tiene el formato correcto. */
export function leerClave(cabecera: string | null): string | null {
  const valor = (cabecera ?? "").replace(/^Bearer\s+/i, "").trim();
  return /^orbe_[A-Za-z0-9_-]{20,90}$/.test(valor) ? valor : null;
}

/** "Aún sin usar", "Usada hace 5 min", "Usada hace 3 días". */
export function textoUso(fecha: string | null, ahora = Date.now()): string {
  if (!fecha) return "Aún sin usar";
  const minutos = Math.round((ahora - Date.parse(fecha)) / 60000);
  if (minutos < 2) return "Usada recién";
  if (minutos < 60) return `Usada hace ${minutos} min`;
  if (minutos < 48 * 60) return `Usada hace ${Math.round(minutos / 60)} h`;
  return `Usada hace ${Math.round(minutos / 1440)} días`;
}
