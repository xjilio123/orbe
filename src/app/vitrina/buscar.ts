"use server";

import type { ResultadoBusqueda } from "@/app/acciones/tipos";
import { vitrinaActiva } from "@/lib/vitrina";
import { PAGINAS, TAREAS } from "./datos";

const normal = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Búsqueda de la vitrina: sobre los datos ficticios, sin base de datos. */
export async function buscarVitrina(consulta: string): Promise<ResultadoBusqueda[]> {
  if (!vitrinaActiva()) throw new Error("No disponible");
  const palabras = normal(String(consulta)).split(/[^a-z0-9]+/).filter(Boolean);
  if (palabras.length === 0 || consulta.trim().length < 2) return [];
  const coincide = (texto: string) => palabras.every((p) => normal(texto).split(/[^a-z0-9]+/).some((w) => w.startsWith(p)));
  return [
    ...PAGINAS.filter((p) => coincide(p.titulo)).map((p) => ({ tipo: "pagina" as const, id: p.id, titulo: p.titulo, icono: p.icono, detalle: "" })),
    ...TAREAS.filter((t) => coincide(t.titulo)).map((t) => ({ tipo: "tarea" as const, id: t.id, titulo: t.titulo, icono: "", detalle: t.notas })),
  ];
}
