import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Bloque } from "@/lib/bloques";
import { descendientes, type PaginaResumen } from "@/lib/datos/paginas";
import { esPaginaDeTarjetas, moverMesDiario, tarjetasDe, type CursoResumen, type DiaDiario, type Tarjeta } from "@/lib/estudio";
import type { Database } from "@/lib/supabase/tipos";

type Cliente = SupabaseClient<Database>;

/** Páginas de tarjetas que hay dentro de un curso (en cualquier nivel). */
function paginasDeTarjetas(todas: PaginaResumen[], cursoId: string): PaginaResumen[] {
  const dentro = new Set(descendientes(todas, cursoId));
  return todas.filter((p) => p.id !== cursoId && dentro.has(p.id) && esPaginaDeTarjetas(p.titulo));
}

/** Tarjetas de varias páginas (lee su contenido de una sola vez). */
async function tarjetasDePaginas(supabase: Cliente, paginas: PaginaResumen[]): Promise<Tarjeta[]> {
  if (paginas.length === 0) return [];
  const { data } = await supabase
    .from("paginas")
    .select("id,titulo,contenido")
    .in(
      "id",
      paginas.slice(0, 100).map((p) => p.id),
    )
    .is("borrado_en", null);
  return (data ?? []).flatMap((p) => tarjetasDe(Array.isArray(p.contenido) ? (p.contenido as unknown as Bloque[]) : [], p.titulo));
}

/** Tus cursos con sus temas, cuántas tarjetas tienen y el próximo examen. */
export async function misCursos(supabase: Cliente, hoy: string, todas: PaginaResumen[]): Promise<CursoResumen[]> {
  const { data: cursos } = await supabase.from("paginas").select("id,titulo,icono").eq("curso", true).is("borrado_en", null).order("titulo").limit(50);
  if (!cursos?.length) return [];
  const ids = cursos.map((c) => c.id);
  const [{ data: examenes }, tarjetas] = await Promise.all([
    supabase.from("fechas_importantes").select("titulo,fecha,pagina_id").in("pagina_id", ids).gte("fecha", hoy).order("fecha").limit(200),
    Promise.all(cursos.map((c) => tarjetasDePaginas(supabase, paginasDeTarjetas(todas, c.id)))),
  ]);
  return cursos.map((c, i) => {
    const examen = examenes?.find((e) => e.pagina_id === c.id);
    return {
      id: c.id,
      titulo: c.titulo,
      icono: c.icono,
      temas: todas.filter((p) => p.padre_id === c.id && !esPaginaDeTarjetas(p.titulo)).length,
      tarjetas: tarjetas[i].length,
      examen: examen ? { titulo: examen.titulo, fecha: examen.fecha } : null,
    };
  });
}

/** Tarjetas para repasar: las de una página, o todas las de un curso. */
export async function tarjetasParaRepasar(
  supabase: Cliente,
  todas: PaginaResumen[],
  origen: { pagina: string } | { curso: string },
): Promise<{ titulo: string; tarjetas: Tarjeta[] } | null> {
  if ("pagina" in origen) {
    const { data } = await supabase.from("paginas").select("id,titulo,contenido").eq("id", origen.pagina).is("borrado_en", null).maybeSingle();
    if (!data) return null;
    return { titulo: data.titulo || "Sin título", tarjetas: tarjetasDe(Array.isArray(data.contenido) ? (data.contenido as unknown as Bloque[]) : [], data.titulo) };
  }
  const curso = todas.find((p) => p.id === origen.curso);
  if (!curso) return null;
  return { titulo: curso.titulo || "Sin título", tarjetas: await tarjetasDePaginas(supabase, paginasDeTarjetas(todas, curso.id)) };
}

/** Días del diario de un mes ("AAAA-MM"). */
export async function diarioDelMes(supabase: Cliente, mes: string): Promise<DiaDiario[]> {
  const { data } = await supabase
    .from("diario")
    .select("fecha,animo,pagina_id")
    .gte("fecha", `${mes}-01`)
    // Hasta el 1 del mes siguiente (no "-31": el 31 de febrero no existe y la consulta fallaría).
    .lt("fecha", `${moverMesDiario(mes, 1)}-01`)
    .order("fecha")
    .limit(31);
  return data ?? [];
}

