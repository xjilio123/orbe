"use server";

import { buscarPorSignificado, paginasParecidas } from "@/lib/datos/significado";
import { datos } from "@/lib/ia/funciones";
import { ErrorIa, generarJson } from "@/lib/ia/gemini";
import { preguntar, type Respuesta } from "@/lib/ia/preguntar";
import { conTope } from "@/lib/ia/tope";
import { requerirSesion } from "@/lib/supabase/servidor";
import type { ResultadoBusqueda, ResultadoIa } from "./tipos";

/** Búsqueda por significado (gratis: no usa Gemini). Para la barra ⌘K. */
export async function buscarSignificado(consulta: string): Promise<ResultadoBusqueda[]> {
  if (typeof consulta !== "string" || consulta.trim().length < 4) return [];
  const { supabase } = await requerirSesion();
  const trozos = await buscarPorSignificado(supabase, consulta.trim(), 12);
  return paginasParecidas(trozos).map((t) => ({
    tipo: "pagina" as const,
    id: t.pagina_id,
    titulo: t.titulo,
    icono: t.icono,
    detalle: t.texto.split("\n").slice(1).join(" ").slice(0, 140),
  }));
}

/** Pregunta a tus notas: busca los trozos más parecidos y la IA responde solo con ellos. */
export async function preguntarIa(pregunta: string): Promise<ResultadoIa<Respuesta>> {
  const limpia = typeof pregunta === "string" ? pregunta.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  if (limpia.length < 5) return { ok: false, error: "Escribe una pregunta un poco más larga." };
  return conTope("preguntar", async (supabase) => {
    const trozos = (await buscarPorSignificado(supabase, limpia, 8)).filter((t) => t.similitud >= 0.75);
    if (trozos.length === 0) throw new ErrorIa("RESPUESTA", "No encontré nada sobre eso en tus notas (las páginas nuevas tardan unos minutos en aparecer).");
    const r = await generarJson({
      sistema: preguntar.sistema,
      partes: [datos(preguntar.contexto(limpia, trozos))],
      esquema: preguntar.esquema,
      validar: preguntar.validar,
    });
    return preguntar.limpiar(r, trozos);
  });
}
