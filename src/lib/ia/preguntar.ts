import { z } from "zod";
import { REGLA_DATOS, texto } from "./funciones";
import type { EsquemaGemini } from "./gemini";

// "Pregunta a tus notas": responde SOLO con los trozos de tus páginas que más se parecen a la pregunta.

export type Fuente = { id: string; titulo: string; icono: string };
export type Respuesta = { respuesta: string; fuentes: Fuente[] };

export const preguntar = {
  sistema: [
    "Eres el asistente de Orbe. Responde la pregunta en español usando SOLO los fragmentos de las notas de la persona.",
    "Cada fragmento tiene un número. Si los fragmentos no alcanzan para responder, dilo con honestidad y no inventes.",
    "Respuesta breve y clara (máximo 120 palabras). Indica los números de los fragmentos que usaste.",
    REGLA_DATOS,
  ].join("\n"),
  esquema: {
    type: "OBJECT",
    properties: { respuesta: { type: "STRING" }, fuentes: { type: "ARRAY", items: { type: "INTEGER" } } },
    required: ["respuesta", "fuentes"],
  } satisfies EsquemaGemini,
  validar: z.object({ respuesta: texto(1500), fuentes: z.array(z.number()).max(20) }),

  /** Texto que se manda a la IA: la pregunta y los fragmentos numerados. */
  contexto(pregunta: string, trozos: { titulo: string; texto: string }[]): string {
    return [`Pregunta: ${pregunta}`, ...trozos.map((t, i) => `[${i + 1}] (${t.titulo || "Sin título"}) ${t.texto}`)].join("\n\n");
  },

  /** Solo fuentes que existen, una vez cada página. */
  limpiar(r: { respuesta: string; fuentes: number[] }, trozos: { pagina_id: string; titulo: string; icono: string }[]): Respuesta {
    const vistas = new Set<string>();
    const fuentes = r.fuentes.flatMap((n) => {
      const t = Number.isInteger(n) ? trozos[n - 1] : undefined;
      if (!t || vistas.has(t.pagina_id)) return [];
      vistas.add(t.pagina_id);
      return [{ id: t.pagina_id, titulo: t.titulo || "Sin título", icono: t.icono }];
    });
    return { respuesta: r.respuesta, fuentes };
  },
};
