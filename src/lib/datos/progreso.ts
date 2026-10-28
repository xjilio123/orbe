import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import type { FechaImportante, Habito, Meta, SemanaEstadistica } from "@/lib/progreso";
import type { ColorLista } from "@/lib/tareas";

type Cliente = SupabaseClient<Database>;

/** Hábitos activos con su racha y lo marcado esta semana (calculado en la base, con RLS). */
export async function misHabitos(supabase: Cliente, hoy: string): Promise<Habito[]> {
  const { data } = await supabase.rpc("mis_habitos", { hoy });
  return (data ?? []).map((h) => ({ ...h, color: h.color as ColorLista, marcas_semana: h.marcas_semana ?? [] }));
}

export async function misMetas(supabase: Cliente, anio: number): Promise<Meta[]> {
  const { data } = await supabase.rpc("mis_metas", { p_anio: anio });
  return (data ?? []).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    tipo: m.tipo === "lista" ? "lista" : "numero",
    lista_id: m.lista_id ?? null,
    lista: m.lista ?? null,
    objetivo: m.objetivo === null ? null : Number(m.objetivo),
    actual: Number(m.actual ?? 0),
    unidad: m.unidad,
    color: m.color as ColorLista,
  }));
}

/** Fechas importantes desde hace 30 días en adelante (las muy viejas ya no interesan). */
export async function misFechas(supabase: Cliente, desde: string): Promise<FechaImportante[]> {
  const { data } = await supabase
    .from("fechas_importantes")
    .select("id,titulo,fecha,icono,color")
    .gte("fecha", desde)
    .order("fecha")
    .limit(100);
  return (data ?? []).map((f) => ({ ...f, color: f.color as ColorLista }));
}

export async function misEstadisticas(supabase: Cliente, semanas = 8): Promise<SemanaEstadistica[]> {
  const { data } = await supabase.rpc("mis_estadisticas", { p_semanas: semanas });
  return data ?? [];
}

/** Minutos de foco de hoy (desde las 00:00 de Lima). */
export async function minutosDeFocoHoy(supabase: Cliente, inicioHoyUtc: string): Promise<number> {
  const { data } = await supabase.from("sesiones_foco").select("minutos").gte("inicio", inicioHoyUtc).limit(200);
  return (data ?? []).reduce((s, x) => s + x.minutos, 0);
}
