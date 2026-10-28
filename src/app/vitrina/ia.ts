"use server";

import type { ResultadoIa } from "@/app/acciones/tipos";
import type { Bloque } from "@/lib/bloques";
import { vitrinaActiva } from "@/lib/vitrina";

// IA de mentira para la vitrina: responde al instante y sin Gemini, para medir la fluidez de las pantallas.
function exigirVitrina() {
  if (!vitrinaActiva()) throw new Error("No disponible");
}

export async function capturaVitrina(texto: string): Promise<ResultadoIa<{ titulos: string[] }>> {
  exigirVitrina();
  return { ok: true, datos: { titulos: [texto.slice(0, 40)] } };
}
export async function dividirVitrina(): Promise<ResultadoIa<{ pasos: number }>> {
  exigirVitrina();
  return { ok: true, datos: { pasos: 4 } };
}
export async function ordenarVitrina(): Promise<ResultadoIa<{ ordenadas: number }>> {
  exigirVitrina();
  return { ok: true, datos: { ordenadas: 3 } };
}
export async function textoVitrina(_modo: string, bloques: Bloque[]): Promise<ResultadoIa<{ id: string; texto: string }[]>> {
  exigirVitrina();
  return { ok: true, datos: bloques.filter((b) => b.tipo === "p" && b.texto).map((b) => ({ id: b.id, texto: `${b.texto} (mejorado)` })) };
}
export async function resumirVitrina(): Promise<ResultadoIa<{ resumen: string; puntos: string[] }>> {
  exigirVitrina();
  return { ok: true, datos: { resumen: "Las funciones de ventana calculan sobre grupos de filas sin colapsarlas.", puntos: ["ROW_NUMBER numera", "LAG y LEAD comparan filas"] } };
}
