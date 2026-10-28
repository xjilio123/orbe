import type { Bloque } from "./bloques";

// Enlaces entre notas al estilo Obsidian: [[Título]] o [[Título|texto visible]].
// La base calcula lo mismo al guardar (private.enlaces_de_bloques) para los backlinks y el mapa.

const PATRON = /\[\[([^[\]|]{1,200})(?:\|[^[\]]*)?\]\]/g;

/** Igual que private.normalizar_titulo: sin tildes, en minúsculas y con espacios simples. */
export function normalizarTitulo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Títulos enlazados en la página (tal como se escribieron, sin repetir y en orden de aparición). */
export function enlacesDe(bloques: Bloque[]): string[] {
  const vistos = new Map<string, string>();
  for (const b of bloques) {
    if (b.tipo === "codigo" || !b.texto.includes("[[")) continue;
    for (const m of b.texto.matchAll(PATRON)) {
      const titulo = m[1].replace(/\s+/g, " ").trim();
      const clave = normalizarTitulo(titulo);
      if (clave && !vistos.has(clave)) vistos.set(clave, titulo);
    }
  }
  return [...vistos.values()];
}

export type PaginaEnlazable = { id: string; titulo: string; icono: string };

/** Cada enlace con su página (si existe) o pendiente de crear. */
export function resolverEnlaces(titulos: string[], paginas: PaginaEnlazable[], propia?: string) {
  const porTitulo = new Map<string, PaginaEnlazable>();
  for (const p of paginas) {
    const clave = normalizarTitulo(p.titulo);
    if (clave && p.id !== propia && !porTitulo.has(clave)) porTitulo.set(clave, p);
  }
  return titulos.map((titulo) => ({ titulo, pagina: porTitulo.get(normalizarTitulo(titulo)) ?? null }));
}

/** Si el cursor está justo después de "[[algo", devuelve lo que se está buscando y dónde empieza. */
export function consultaEnlace(texto: string, cursor: number): { consulta: string; desde: number } | null {
  const antes = texto.slice(0, cursor);
  const m = antes.match(/\[\[([^[\]|\n]{0,60})$/);
  if (!m || m.index === undefined) return null;
  return { consulta: m[1], desde: m.index };
}

/** Reemplaza "[[algo" (hasta el cursor) por "[[Título]]" y devuelve el texto y la nueva posición del cursor. */
export function completarEnlace(texto: string, cursor: number, desde: number, titulo: string): { texto: string; cursor: number } {
  let despues = texto.slice(cursor);
  // Si ya estaban los "]]" de cierre (o parte del título escrito), no se duplican.
  const cierre = despues.match(/^[^[\]\n]{0,60}\]\]/);
  if (cierre) despues = despues.slice(cierre[0].length);
  const enlace = `[[${titulo}]]`;
  return { texto: texto.slice(0, desde) + enlace + despues, cursor: desde + enlace.length };
}

/** Sugerencias para lo que se escribe tras "[[": primero las que empiezan igual, después las que lo contienen. */
export function sugerirPaginas(consulta: string, paginas: PaginaEnlazable[], propia?: string, cuantas = 6): PaginaEnlazable[] {
  const q = normalizarTitulo(consulta);
  const candidatas = paginas.filter((p) => p.id !== propia && p.titulo.trim());
  if (!q) return candidatas.slice(0, cuantas);
  const empiezan: PaginaEnlazable[] = [];
  const contienen: PaginaEnlazable[] = [];
  for (const p of candidatas) {
    const t = normalizarTitulo(p.titulo);
    if (t.startsWith(q)) empiezan.push(p);
    else if (t.includes(q)) contienen.push(p);
  }
  return [...empiezan, ...contienen].slice(0, cuantas);
}
