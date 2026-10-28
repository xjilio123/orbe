import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bloque } from "@/lib/bloques";
import type { Database } from "@/lib/supabase/tipos";

type Cliente = SupabaseClient<Database>;

export type PaginaResumen = { id: string; titulo: string; icono: string; favorita: boolean; padre_id: string | null; actualizado: string };
export type Pagina = PaginaResumen & { contenido: Bloque[]; plantilla?: boolean };
export type Adjunto = { id: string; ruta: string; tipo: string; tamano: number; nombre: string };

/** Todas las páginas sin su contenido (liviano): alcanza para el árbol, las migas y los contadores. */
export async function todasLasPaginas(supabase: Cliente): Promise<PaginaResumen[]> {
  const { data } = await supabase
    .from("paginas")
    .select("id,titulo,icono,favorita,padre_id,actualizado")
    .is("borrado_en", null)
    .order("actualizado", { ascending: false })
    .limit(2000);
  return data ?? [];
}

export async function pagina(supabase: Cliente, id: string): Promise<Pagina | null> {
  const { data } = await supabase.from("paginas").select("id,titulo,icono,favorita,padre_id,actualizado,contenido,plantilla")
    .eq("id", id)
    .is("borrado_en", null)
    .maybeSingle();
  return data ? { ...data, contenido: Array.isArray(data.contenido) ? (data.contenido as unknown as Bloque[]) : [] } : null;
}

export async function adjuntosDePagina(supabase: Cliente, paginaId: string): Promise<Adjunto[]> {
  const { data } = await supabase.from("adjuntos").select("id,ruta,tipo,tamano,nombre").eq("pagina_id", paginaId).limit(500);
  return data ?? [];
}

/** Enlaces firmados (1 hora) para ver los archivos privados: nadie más puede abrirlos. */
export async function enlacesFirmados(supabase: Cliente, adjuntos: Adjunto[]): Promise<Record<string, string>> {
  if (adjuntos.length === 0) return {};
  const { data } = await supabase.storage.from("adjuntos").createSignedUrls(
    adjuntos.map((a) => a.ruta),
    3600,
  );
  const porRuta = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return Object.fromEntries(adjuntos.flatMap((a) => (porRuta.get(a.ruta) ? [[a.id, porRuta.get(a.ruta)!]] : [])));
}

/** Camino desde la raíz hasta la página (para las migas: Apuntes › Estudios › SQL). */
export function ancestros(todas: PaginaResumen[], id: string): PaginaResumen[] {
  const porId = new Map(todas.map((p) => [p.id, p]));
  const camino: PaginaResumen[] = [];
  let actual = porId.get(id)?.padre_id ?? null;
  for (let i = 0; actual && i < 10; i++) {
    const p = porId.get(actual);
    if (!p) break;
    camino.unshift(p);
    actual = p.padre_id;
  }
  return camino;
}

/** La página y todas sus descendientes (para borrar sus archivos antes de borrarlas). */
export function descendientes(todas: PaginaResumen[], id: string): string[] {
  const hijos = new Map<string, string[]>();
  for (const p of todas) if (p.padre_id) hijos.set(p.padre_id, [...(hijos.get(p.padre_id) ?? []), p.id]);
  const resultado: string[] = [];
  const pendientes = [id];
  while (pendientes.length) {
    const actual = pendientes.pop()!;
    resultado.push(actual);
    pendientes.push(...(hijos.get(actual) ?? []));
  }
  return resultado;
}

export async function miEspacio(supabase: Cliente) {
  const { data } = await supabase.rpc("mi_espacio");
  const fila = data?.[0];
  return {
    archivos: Number(fila?.archivos ?? 0),
    archivosMax: Number(fila?.archivos_max ?? 30 * 1024 * 1024),
    texto: Number(fila?.texto ?? 0),
    textoMax: Number(fila?.texto_max ?? 8 * 1024 * 1024),
  };
}

/** Backlinks: tus páginas que enlazan a esta con [[su título]]. */
export async function paginasQueEnlazan(supabase: Cliente, id: string): Promise<{ id: string; titulo: string; icono: string }[]> {
  const { data } = await supabase.rpc("paginas_que_enlazan", { p_id: id });
  return data ?? [];
}

/** Todas tus conexiones por [[enlace]] (origen → destino), para el mapa de notas. */
export async function misEnlaces(supabase: Cliente): Promise<{ origen: string; destino: string }[]> {
  const { data } = await supabase.rpc("mis_enlaces");
  return data ?? [];
}
