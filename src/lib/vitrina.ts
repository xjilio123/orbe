// La vitrina muestra las pantallas reales con datos FICTICIOS para medir la fluidez sin sesión.
// Solo existe si se arranca la app con ORBE_VITRINA=1 y NUNCA en Vercel (producción ni previews).
export function vitrinaActiva(): boolean {
  return process.env.ORBE_VITRINA === "1" && !process.env.VERCEL;
}
