"use server";

import { requerirSesion } from "@/lib/supabase/servidor";
import type { ResultadoBusqueda } from "./tipos";

/** Busca en tus tareas y páginas (la base filtra por tu usuario y entiende prefijos sin tildes). */
export async function buscar(consulta: string): Promise<ResultadoBusqueda[]> {
  if (typeof consulta !== "string") return [];
  const q = consulta.trim().slice(0, 100);
  if (q.length < 2) return [];
  const { supabase } = await requerirSesion();
  const { data } = await supabase.rpc("buscar", { consulta: q });
  return (data ?? []).map((r) => ({
    tipo: r.tipo === "tarea" ? "tarea" : "pagina",
    id: r.id,
    titulo: r.titulo,
    icono: r.icono,
    detalle: r.detalle,
  }));
}
