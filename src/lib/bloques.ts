import { z } from "zod";

/**
 * Apuntes por bloques, como Notion: cada página es una lista de bloques simples.
 * Se guarda como JSON en `paginas.contenido`; este esquema es el mismo en el teléfono y en el servidor.
 */

export const TIPOS_TEXTO = ["p", "h1", "h2", "h3", "lista", "num", "todo", "cita", "codigo", "aviso"] as const;
export const TIPOS = [...TIPOS_TEXTO, "separador", "imagen", "archivo"] as const;
export type TipoBloque = (typeof TIPOS)[number];

export type Bloque = {
  id: string;
  tipo: TipoBloque;
  texto: string;
  hecho?: boolean;
  adjunto?: string;
  ancho?: number;
  alto?: number;
};

export const MAX_BLOQUES = 2000;
export const MAX_TEXTO = 10_000;

export const NOMBRE_TIPO: Record<TipoBloque, string> = {
  p: "Texto",
  h1: "Título 1",
  h2: "Título 2",
  h3: "Título 3",
  lista: "Viñetas",
  num: "Numerada",
  todo: "Casilla",
  cita: "Cita",
  codigo: "Código",
  aviso: "Aviso",
  separador: "Separador",
  imagen: "Imagen",
  archivo: "PDF",
};

const esquemaBloque = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{6,24}$/),
  tipo: z.enum(TIPOS),
  texto: z.string().max(MAX_TEXTO),
  hecho: z.boolean().optional(),
  adjunto: z.uuid().optional(),
  ancho: z.number().int().min(1).max(10_000).optional(),
  alto: z.number().int().min(1).max(10_000).optional(),
});

export const esquemaPagina = z.object({
  titulo: z.string().max(200).transform((s) => s.replace(/\s+/g, " ").trim()),
  icono: z.string().max(16).transform((s) => s.trim()),
  contenido: z.array(esquemaBloque).max(MAX_BLOQUES),
});

export type DatosPagina = z.infer<typeof esquemaPagina>;

/** Id corto y aleatorio para un bloque (no necesita ser un UUID). */
export function nuevoId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_");
}

export const nuevoBloque = (tipo: TipoBloque = "p", texto = ""): Bloque => ({ id: nuevoId(), tipo, texto, ...(tipo === "todo" ? { hecho: false } : {}) });

export const esDeTexto = (tipo: TipoBloque) => (TIPOS_TEXTO as readonly string[]).includes(tipo);

/** Las listas continúan al presionar Enter; los títulos y lo demás vuelven a texto normal. */
export const tipoSiguiente = (tipo: TipoBloque): TipoBloque => (tipo === "lista" || tipo === "num" || tipo === "todo" ? tipo : "p");

/** Atajos al escribir al inicio de un bloque de texto: "# " → Título 1, "- " → viñeta, "[] " → casilla… */
const ATAJOS: [RegExp, TipoBloque][] = [
  [/^### $/, "h3"],
  [/^## $/, "h2"],
  [/^# $/, "h1"],
  [/^[-*•] $/, "lista"],
  [/^1[.)] $/, "num"],
  [/^\[ ?\] $/, "todo"],
  [/^> $/, "cita"],
  [/^```$/, "codigo"],
  [/^!! $/, "aviso"],
  [/^---$/, "separador"],
];

export function atajo(texto: string, tipoActual: TipoBloque): TipoBloque | null {
  if (tipoActual !== "p") return null;
  for (const [patron, tipo] of ATAJOS) if (patron.test(texto)) return tipo;
  return null;
}

/** Número que muestra cada ítem de una lista numerada (se reinicia tras cualquier otro bloque). */
export function numeracion(bloques: Bloque[]): Map<string, number> {
  const numeros = new Map<string, number>();
  let n = 0;
  for (const b of bloques) {
    n = b.tipo === "num" ? n + 1 : 0;
    if (b.tipo === "num") numeros.set(b.id, n);
  }
  return numeros;
}

/** Ids de los adjuntos que usa la página (para firmar sus enlaces y limpiar los que ya no se usan). */
export const adjuntosDe = (bloques: Bloque[]) => [...new Set(bloques.flatMap((b) => (b.adjunto ? [b.adjunto] : [])))];

/** Texto plano de la página (vista previa en la lista de apuntes y, más adelante, la búsqueda). */
export function resumen(bloques: Bloque[], largo = 120): string {
  const texto = bloques
    .filter((b) => esDeTexto(b.tipo) && b.texto.trim())
    .map((b) => b.texto.trim())
    .join(" · ");
  return texto.length > largo ? `${texto.slice(0, largo - 1)}…` : texto;
}
