import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";

type Cliente = SupabaseClient<Database>;

export type Trozo = { pagina_id: string; titulo: string; icono: string; texto: string; similitud: number };

/**
 * Busca por significado en TUS páginas: la Edge Function "vectores" valida tu sesión, convierte la frase
 * en un vector con gte-small (dentro de Supabase) y devuelve los trozos más parecidos.
 */
export async function buscarPorSignificado(supabase: Cliente, consulta: string, limite = 10): Promise<Trozo[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];
  try {
    const respuesta = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vectores`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ consulta: consulta.slice(0, 300), limite }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!respuesta.ok) return [];
    const { resultados } = (await respuesta.json()) as { resultados?: Trozo[] };
    return (resultados ?? []).map((r) => ({ ...r, similitud: Number(r.similitud) }));
  } catch {
    return [];
  }
}

/** Una entrada por página (la de su trozo más parecido), solo si se parece de verdad. */
export function paginasParecidas(trozos: Trozo[], minimo = 0.8, maximo = 5): Trozo[] {
  const vistas = new Set<string>();
  return trozos
    .filter((t) => t.similitud >= minimo)
    .sort((a, b) => b.similitud - a.similitud)
    .filter((t) => (vistas.has(t.pagina_id) ? false : (vistas.add(t.pagina_id), true)))
    .slice(0, maximo);
}
