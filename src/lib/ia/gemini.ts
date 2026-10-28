import "server-only";
import type { z } from "zod";

// Llamadas a Gemini (nivel gratuito, proyecto de Google Cloud propio de Orbe y sin facturación).
// La clave vive solo en Vercel (GEMINI_API_KEY) y nunca llega al teléfono.
// Toda respuesta se pide en JSON con un esquema y se vuelve a validar con Zod antes de usarla.

const URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELO_POR_DEFECTO = "gemini-3.5-flash-lite";

export class ErrorIa extends Error {
  constructor(
    public codigo: "SIN_CLAVE" | "AGOTADA" | "BLOQUEADA" | "RESPUESTA" | "RED",
    mensaje: string,
  ) {
    super(mensaje);
  }
}

/** Esquema de respuesta en el formato de Gemini (subconjunto de OpenAPI). */
export type EsquemaGemini = {
  type: "OBJECT" | "ARRAY" | "STRING" | "INTEGER" | "NUMBER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, EsquemaGemini>;
  required?: string[];
  items?: EsquemaGemini;
  enum?: string[];
  nullable?: boolean;
  maxItems?: number;
};

export type Parte = { text: string } | { inlineData: { mimeType: string; data: string } };

type Opciones<T> = {
  sistema: string;
  partes: Parte[];
  esquema: EsquemaGemini;
  validar: z.ZodType<T>;
  temperatura?: number;
};

export const iaConfigurada = () => Boolean(process.env.GEMINI_API_KEY);

export async function generarJson<T>({ sistema, partes, esquema, validar, temperatura = 0.3 }: Opciones<T>): Promise<T> {
  const clave = process.env.GEMINI_API_KEY;
  if (!clave) throw new ErrorIa("SIN_CLAVE", "La IA aún no está configurada.");
  const modelo = (process.env.GEMINI_MODELO || MODELO_POR_DEFECTO).replace(/[^a-z0-9.-]/gi, "");

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_BASE}/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": clave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: partes }],
        generationConfig: { responseMimeType: "application/json", responseSchema: esquema, temperature: temperatura, maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch {
    throw new ErrorIa("RED", "No se pudo hablar con la IA. Intenta de nuevo.");
  }

  if (respuesta.status === 429) throw new ErrorIa("AGOTADA", "La IA gratis llegó a su límite por ahora. Intenta más tarde.");
  if (!respuesta.ok) {
    // Sin el contenido en el registro (podría incluir tus notas); solo el código.
    console.error("Gemini respondió", respuesta.status);
    throw new ErrorIa("RESPUESTA", "La IA no pudo responder. Intenta de nuevo.");
  }

  const cuerpo = (await respuesta.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  if (cuerpo.promptFeedback?.blockReason) throw new ErrorIa("BLOQUEADA", "La IA no quiso procesar ese contenido.");
  const texto = cuerpo.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new ErrorIa("RESPUESTA", "La IA respondió algo que no se pudo leer. Intenta de nuevo.");
  }
  const validado = validar.safeParse(datos);
  if (!validado.success) throw new ErrorIa("RESPUESTA", "La IA respondió algo incompleto. Intenta de nuevo.");
  return validado.data;
}
