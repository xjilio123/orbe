import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limitePapelera, raices } from "@/lib/papelera";
import type { Database } from "@/lib/supabase/tipos";

type Cliente = SupabaseClient<Database>;

export type TareaEnPapelera = { id: string; titulo: string; padre_id: string | null; borrado_en: string };
export type PaginaEnPapelera = { id: string; titulo: string; icono: string; padre_id: string | null; borrado_en: string };

export async function tareasEnPapelera(supabase: Cliente): Promise<TareaEnPapelera[]> {
  const { data } = await supabase.from("tareas").select("id,titulo,padre_id,borrado_en").not("borrado_en", "is", null).limit(3000);
  return (data ?? []) as TareaEnPapelera[];
}

export async function paginasEnPapelera(supabase: Cliente): Promise<PaginaEnPapelera[]> {
  const { data } = await supabase.from("paginas").select("id,titulo,icono,padre_id,borrado_en").not("borrado_en", "is", null).limit(2000);
  return (data ?? []) as PaginaEnPapelera[];
}

/** Lo que muestra la pantalla Papelera: solo lo borrado a mano (sin repetir subtareas ni subpáginas). */
export async function contenidoPapelera(supabase: Cliente) {
  const [tareas, paginas] = await Promise.all([tareasEnPapelera(supabase), paginasEnPapelera(supabase)]);
  return { tareas: raices(tareas), paginas: raices(paginas), total: tareas.length + paginas.length };
}

/** Borra para siempre páginas (con sus fotos y PDF en Storage) y tareas. */
export async function borrarParaSiempre(supabase: Cliente, ids: { tareas: string[]; paginas: string[] }) {
  for (let i = 0; i < ids.paginas.length; i += 100) {
    const lote = ids.paginas.slice(i, i + 100);
    const { data: adjuntos } = await supabase.from("adjuntos").select("ruta").in("pagina_id", lote);
    const rutas = (adjuntos ?? []).map((a) => a.ruta);
    for (let j = 0; j < rutas.length; j += 100) await supabase.storage.from("adjuntos").remove(rutas.slice(j, j + 100));
    await supabase.from("paginas").delete().in("id", lote);
  }
  for (let i = 0; i < ids.tareas.length; i += 200) {
    await supabase.from("tareas").delete().in("id", ids.tareas.slice(i, i + 200));
  }
}

/** Lo que pasó 30 días en la papelera se borra para siempre (se llama al abrir la papelera). */
export async function purgarVencidos(supabase: Cliente) {
  const limite = limitePapelera();
  const [{ data: tareas }, { data: paginas }] = await Promise.all([
    supabase.from("tareas").select("id").lt("borrado_en", limite).limit(2000),
    supabase.from("paginas").select("id").lt("borrado_en", limite).limit(1000),
  ]);
  if (!tareas?.length && !paginas?.length) return;
  await borrarParaSiempre(supabase, { tareas: (tareas ?? []).map((t) => t.id), paginas: (paginas ?? []).map((p) => p.id) });
}
