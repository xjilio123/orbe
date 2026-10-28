import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Checklist, EstadoBiblioteca, ItemChecklist, Obra, TipoBiblioteca } from "@/lib/coleccion";
import type { Database } from "@/lib/supabase/tipos";
import type { ColorLista } from "@/lib/tareas";

type Cliente = SupabaseClient<Database>;

/** Tus checklists con cuántos ítems tienen marcados. */
export async function misChecklists(supabase: Cliente): Promise<Checklist[]> {
  const [{ data: listas }, { data: items }] = await Promise.all([
    supabase.from("checklists").select("id,nombre,icono,color").order("orden").order("creado").limit(50),
    supabase.from("checklist_items").select("checklist_id,hecho").limit(3000),
  ]);
  return (listas ?? []).map((l) => {
    const suyos = (items ?? []).filter((i) => i.checklist_id === l.id);
    return { ...l, color: l.color as ColorLista, hechos: suyos.filter((i) => i.hecho).length, total: suyos.length };
  });
}

export async function checklistConItems(supabase: Cliente, id: string): Promise<{ checklist: Checklist; items: ItemChecklist[] } | null> {
  const [{ data: lista }, { data: items }] = await Promise.all([
    supabase.from("checklists").select("id,nombre,icono,color").eq("id", id).maybeSingle(),
    supabase.from("checklist_items").select("id,texto,hecho,orden").eq("checklist_id", id).order("orden").limit(500),
  ]);
  if (!lista) return null;
  const todos = items ?? [];
  return {
    checklist: { ...lista, color: lista.color as ColorLista, hechos: todos.filter((i) => i.hecho).length, total: todos.length },
    items: todos,
  };
}

export async function miBiblioteca(supabase: Cliente): Promise<Obra[]> {
  const { data } = await supabase
    .from("biblioteca")
    .select("id,titulo,autor,tipo,estado,progreso,total,nota,resena,terminado_en")
    .order("actualizado", { ascending: false })
    .limit(2000);
  return (data ?? []).map((o) => ({ ...o, tipo: o.tipo as TipoBiblioteca, estado: o.estado as EstadoBiblioteca }));
}
