"use server";

import type { ResultadoIa } from "@/app/acciones/tipos";
import { nuevoBloque, type Bloque } from "@/lib/bloques";
import type { Plan, ResumenSemana } from "@/lib/ia/contenido";
import type { Respuesta } from "@/lib/ia/preguntar";
import { vitrinaActiva } from "@/lib/vitrina";
import { PLAN_VITRINA, SEMANA_VITRINA } from "./ejemplosIa";

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
export async function planVitrina(): Promise<ResultadoIa<Plan>> {
  exigirVitrina();
  return { ok: true, datos: PLAN_VITRINA };
}
export async function semanaVitrina(): Promise<ResultadoIa<ResumenSemana>> {
  exigirVitrina();
  return { ok: true, datos: SEMANA_VITRINA };
}
export async function tarjetasVitrina(paginaId: string): Promise<ResultadoIa<{ id: string }>> {
  exigirVitrina();
  return { ok: true, datos: { id: paginaId } };
}
export async function fotoVitrina(): Promise<ResultadoIa<{ titulo: string; bloques: Bloque[] }>> {
  exigirVitrina();
  return { ok: true, datos: { titulo: "Pizarra", bloques: [nuevoBloque("h3", "Desde la foto"), nuevoBloque("todo", "Repasar la clase 4")] } };
}
export async function audioVitrina(): Promise<ResultadoIa<{ titulo: string; bloques: Bloque[] }>> {
  exigirVitrina();
  return { ok: true, datos: { titulo: "Nota de voz", bloques: [nuevoBloque("p", "Idea dictada: probar Orbe en el iPad.")] } };
}
export async function preguntarVitrina(): Promise<ResultadoIa<Respuesta>> {
  exigirVitrina();
  return {
    ok: true,
    datos: {
      respuesta: "Anotaste que las funciones de ventana calculan sobre grupos de filas sin colapsarlas, como ROW_NUMBER, LAG y LEAD.",
      fuentes: [{ id: "00000000-0000-4000-8000-0000000000b1", titulo: "SQL para Data Analytics", icono: "📊" }],
    },
  };
}
