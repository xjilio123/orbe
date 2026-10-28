import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import type { Repetir } from "@/lib/repeticion";
import type { ColorLista, Estado, Lista, Tarea } from "@/lib/tareas";

type Cliente = SupabaseClient<Database>;

const COLUMNAS = "id,titulo,notas,estado,prioridad,fecha,hora,lista_id,padre_id,hecha_en,creado,repetir,aviso";

type FilaTarea = Pick<
  Database["public"]["Tables"]["tareas"]["Row"],
  "id" | "titulo" | "notas" | "estado" | "prioridad" | "fecha" | "hora" | "lista_id" | "padre_id" | "hecha_en" | "creado" | "repetir" | "aviso"
>;

// Lo que está en la papelera (borrado_en) nunca aparece en la app, salvo en la pantalla Papelera.
// La base guarda la hora como "09:00:00"; la app trabaja con "09:00".
const aTarea = (f: FilaTarea): Tarea => ({
  ...f,
  estado: f.estado as Estado,
  hora: f.hora?.slice(0, 5) ?? null,
  repetir: f.repetir as Repetir | null,
});

/** Inicio del día de hoy en Lima, en UTC (Lima es UTC-5 todo el año). */
export const inicioDeHoyUtc = (hoy: string) => `${hoy}T05:00:00Z`;

/** Todo lo pendiente más lo terminado hoy: alcanza para Hoy, el Inbox y los grupos por fecha. */
export async function tareasActivas(supabase: Cliente, hoy: string): Promise<Tarea[]> {
  const { data } = await supabase
    .from("tareas")
    .select(COLUMNAS).is("borrado_en", null)
    .or(`estado.neq.hecha,hecha_en.gte.${inicioDeHoyUtc(hoy)}`)
    .order("creado", { ascending: true })
    .limit(2000);
  return (data ?? []).map(aTarea);
}

export async function listas(supabase: Cliente): Promise<Lista[]> {
  const { data } = await supabase.from("listas").select("id,nombre,color,orden").order("orden").order("creado");
  return (data ?? []).map((l) => ({ ...l, color: l.color as ColorLista }));
}

export async function tareaConSubtareas(supabase: Cliente, id: string) {
  const [{ data: tarea }, { data: subtareas }] = await Promise.all([
    supabase.from("tareas").select(COLUMNAS).is("borrado_en", null).eq("id", id).maybeSingle(),
    supabase.from("tareas").select(COLUMNAS).is("borrado_en", null).eq("padre_id", id).order("creado"),
  ]);
  return { tarea: tarea ? aTarea(tarea) : null, subtareas: (subtareas ?? []).map(aTarea) };
}

/** Tareas de una lista: las abiertas y las terminadas en los últimos 7 días. */
export async function tareasDeLista(supabase: Cliente, listaId: string, hoy: string): Promise<Tarea[]> {
  const hace7 = new Date(Date.parse(inicioDeHoyUtc(hoy)) - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("tareas")
    .select(COLUMNAS).is("borrado_en", null)
    .eq("lista_id", listaId)
    .is("padre_id", null)
    .or(`estado.neq.hecha,hecha_en.gte.${hace7}`)
    .order("creado")
    .limit(1000);
  return (data ?? []).map(aTarea);
}

/** Cuántas subtareas tiene cada tarea y cuántas están hechas (para mostrar "2/3"). */
export async function conteoSubtareas(supabase: Cliente, ids: string[]) {
  const conteo = new Map<string, { hechas: number; total: number }>();
  if (ids.length === 0) return conteo;
  const { data } = await supabase.from("tareas").select("padre_id,estado").is("borrado_en", null).in("padre_id", ids.slice(0, 500));
  for (const s of data ?? []) {
    if (!s.padre_id) continue;
    const c = conteo.get(s.padre_id) ?? { hechas: 0, total: 0 };
    c.total++;
    if (s.estado === "hecha") c.hechas++;
    conteo.set(s.padre_id, c);
  }
  return conteo;
}

/**
 * Lo que muestra la Agenda entre dos fechas: las tareas con fecha en ese rango (también las hechas)
 * y las que se repiten aunque su fecha actual sea anterior, para dibujar sus próximas veces.
 */
export async function tareasDeAgenda(supabase: Cliente, desde: string, hasta: string): Promise<Tarea[]> {
  const [{ data: enRango }, { data: repetidas }] = await Promise.all([
    supabase.from("tareas").select(COLUMNAS).is("borrado_en", null).is("padre_id", null).gte("fecha", desde).lte("fecha", hasta).order("fecha").limit(1500),
    supabase.from("tareas").select(COLUMNAS).is("borrado_en", null).is("padre_id", null).not("repetir", "is", null).lt("fecha", desde).neq("estado", "hecha").limit(300),
  ]);
  return [...(enRango ?? []), ...(repetidas ?? [])].map(aTarea);
}
