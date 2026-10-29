import { nuevoBloque, type Bloque } from "./bloques";

// Lo que llega al compartir algo hacia Orbe (desde el menú Compartir de Android): título, texto y enlace.

export type Compartido = { titulo: string; texto: string; url: string };

const limpio = (valor: unknown, max: number) => (typeof valor === "string" ? valor.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");

/** Solo enlaces http(s): nada de javascript: ni otras sorpresas. */
export function enlaceSeguro(valor: string): string {
  try {
    const u = new URL(valor);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString().slice(0, 2000) : "";
  } catch {
    return "";
  }
}

/** Lee los parámetros que manda Android. Muchas apps ponen el enlace dentro del texto: se separa. */
export function leerCompartido(params: Record<string, string | string[] | undefined>): Compartido {
  const uno = (k: string) => (Array.isArray(params[k]) ? params[k][0] : params[k]);
  let texto = limpio(uno("texto"), 5000);
  let url = enlaceSeguro(limpio(uno("url"), 2000));
  if (!url) {
    const m = texto.match(/https?:\/\/\S+/);
    if (m) {
      url = enlaceSeguro(m[0]);
      if (url) texto = texto.replace(m[0], "").trim();
    }
  }
  return { titulo: limpio(uno("titulo"), 200), texto, url };
}

/** Título para la tarea o la nota: el título compartido, o la primera línea del texto, o el sitio del enlace. */
export function tituloDe(c: Compartido): string {
  const primeraLinea = c.texto.split("\n")[0]?.trim() ?? "";
  let sitio = "";
  try {
    sitio = c.url ? new URL(c.url).hostname.replace(/^www\./, "") : "";
  } catch {
    sitio = "";
  }
  return (c.titulo || primeraLinea || sitio || "Compartido").slice(0, 200);
}

/** Notas de la tarea: el texto (si no es igual al título) y el enlace. */
export function notasDe(c: Compartido): string {
  const titulo = tituloDe(c);
  return [c.texto && c.texto !== titulo ? c.texto : "", c.url].filter(Boolean).join("\n\n").slice(0, 2000);
}

/** Bloques de la nota: cada párrafo del texto y, al final, el enlace. */
export function bloquesDe(c: Compartido): Bloque[] {
  const parrafos = c.texto
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => nuevoBloque("p", p.slice(0, 10_000)));
  return [...parrafos, ...(c.url ? [nuevoBloque("p", `🔗 ${c.url}`)] : [])];
}
