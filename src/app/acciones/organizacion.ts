"use server";

import { revalidatePath } from "next/cache";
import { leerConfig, type ConfigTabla } from "@/lib/organizacion";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";
import type { ResultadoGuardado } from "./tipos";

/** Mueve una tarea a un cuadrante de la matriz (null = que Orbe lo calcule solo otra vez). */
export async function moverCuadrante(id: string, cuadrante: number | null): Promise<ResultadoGuardado> {
  if (!esquemaId.safeParse(id).success || (cuadrante !== null && ![1, 2, 3, 4].includes(cuadrante))) return { ok: false, error: "Datos no válidos." };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("tareas").update({ cuadrante }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo mover la tarea." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Guarda la tabla actual (orden y filtros) con un nombre, para volver a ella con un toque. */
export async function guardarVista(listaId: string, nombre: string, config: ConfigTabla): Promise<ResultadoGuardado> {
  const limpio = String(nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!esquemaId.safeParse(listaId).success || !limpio) return { ok: false, error: "Ponle un nombre a la vista." };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("vistas_guardadas").insert({ lista_id: listaId, nombre: limpio, config: leerConfig(config) });
  if (error) return { ok: false, error: error.message.includes("máximo") ? "Llegaste al máximo de 50 vistas guardadas." : "No se pudo guardar la vista." };
  revalidatePath("/tareas", "layout");
  return { ok: true };
}

export async function eliminarVista(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("vistas_guardadas").delete().eq("id", id);
  revalidatePath("/tareas", "layout");
}
