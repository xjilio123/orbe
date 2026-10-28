import { MAX_BLOQUES, MAX_TEXTO, nuevoBloque, type Bloque, type TipoBloque } from "./bloques";

// Markdown ⇄ bloques de Orbe, para exportar tus notas y para traer tu bóveda de Obsidian.
// Los [[enlaces]] se conservan tal cual: siguen funcionando como backlinks al importar.

/** Una página como Markdown. Las fotos y PDF quedan como una línea de texto (los archivos no se exportan). */
export function aMarkdown(titulo: string, bloques: Bloque[]): string {
  const lineas: string[] = [`# ${titulo || "Sin título"}`, ""];
  let n = 0;
  let anterior: TipoBloque | null = null;
  const esLista = (t: TipoBloque | null) => t === "lista" || t === "num" || t === "todo";
  for (const b of bloques) {
    n = b.tipo === "num" ? n + 1 : 0;
    // Las listas van juntas; todo lo demás, separado por una línea en blanco.
    if (anterior !== null && !(esLista(anterior) && esLista(b.tipo) && anterior === b.tipo)) lineas.push("");
    anterior = b.tipo;
    const texto = b.texto;
    switch (b.tipo) {
      case "h1":
        lineas.push(`## ${texto}`);
        break;
      case "h2":
        lineas.push(`### ${texto}`);
        break;
      case "h3":
        lineas.push(`#### ${texto}`);
        break;
      case "lista":
        lineas.push(`- ${texto}`);
        break;
      case "num":
        lineas.push(`${n}. ${texto}`);
        break;
      case "todo":
        lineas.push(`- [${b.hecho ? "x" : " "}] ${texto}`);
        break;
      case "cita":
        lineas.push(...texto.split("\n").map((l) => `> ${l}`));
        break;
      case "codigo":
        lineas.push("```", texto, "```");
        break;
      case "aviso":
        lineas.push(...`[!note] ${texto}`.split("\n").map((l) => `> ${l}`));
        break;
      case "separador":
        lineas.push("---");
        break;
      case "imagen":
        lineas.push(`*(Foto${texto ? `: ${texto}` : ""})*`);
        break;
      case "archivo":
        lineas.push(`*(PDF${texto ? `: ${texto}` : ""})*`);
        break;
      default:
        lineas.push(texto);
    }
  }
  return `${lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

/** Quita el encabezado YAML de Obsidian (--- … ---) si lo hay. */
function sinFrontmatter(texto: string): string {
  if (!texto.startsWith("---")) return texto;
  const fin = texto.indexOf("\n---", 3);
  return fin === -1 ? texto : texto.slice(texto.indexOf("\n", fin + 4) + 1 || texto.length);
}

const limpiar = (s: string) => s.slice(0, MAX_TEXTO);

/**
 * Markdown → bloques. Entiende títulos, listas, casillas, citas, avisos de Obsidian, código y separadores.
 * Un "# Título" en la primera línea se usa como título de la página.
 */
export function deMarkdown(texto: string): { titulo: string | null; bloques: Bloque[] } {
  const lineas = sinFrontmatter(texto.replace(/\r\n?/g, "\n")).split("\n");
  const bloques: Bloque[] = [];
  let titulo: string | null = null;
  let parrafo: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length) bloques.push(nuevoBloque("p", limpiar(parrafo.join("\n").trim())));
    parrafo = [];
  };
  const agregar = (tipo: TipoBloque, contenido = "", hecho?: boolean) => {
    cerrarParrafo();
    const bloque = nuevoBloque(tipo, limpiar(contenido));
    if (tipo === "todo") bloque.hecho = Boolean(hecho);
    bloques.push(bloque);
  };

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    const recortada = linea.trim();
    let m: RegExpMatchArray | null;

    if (recortada.startsWith("```")) {
      const codigo: string[] = [];
      for (i++; i < lineas.length && !lineas[i].trim().startsWith("```"); i++) codigo.push(lineas[i]);
      agregar("codigo", codigo.join("\n"));
    } else if (!recortada) {
      cerrarParrafo();
    } else if ((m = recortada.match(/^(#{1,6})\s+(.*)$/))) {
      const nivel = m[1].length;
      if (nivel === 1 && titulo === null && bloques.length === 0 && parrafo.length === 0) titulo = m[2].trim();
      else agregar(nivel <= 2 ? "h1" : nivel === 3 ? "h2" : "h3", m[2].trim());
    } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(recortada)) {
      agregar("separador");
    } else if ((m = recortada.match(/^[-*+]\s+\[([ xX])\]\s*(.*)$/))) {
      agregar("todo", m[2], m[1].toLowerCase() === "x");
    } else if ((m = recortada.match(/^[-*+]\s+(.*)$/))) {
      agregar("lista", m[1]);
    } else if ((m = recortada.match(/^\d+[.)]\s+(.*)$/))) {
      agregar("num", m[1]);
    } else if (recortada.startsWith(">")) {
      const cita: string[] = [];
      for (; i < lineas.length && lineas[i].trim().startsWith(">"); i++) cita.push(lineas[i].trim().replace(/^>\s?/, ""));
      i--;
      const aviso = cita[0]?.match(/^\[!(\w+)\][+-]?\s*(.*)$/);
      if (aviso) agregar("aviso", [aviso[2], ...cita.slice(1)].filter(Boolean).join("\n"));
      else agregar("cita", cita.join("\n"));
    } else {
      // Los archivos incrustados de Obsidian (![[foto.png]]) no se importan: quedan como texto.
      parrafo.push(linea.replace(/!\[\[([^\]]+)\]\]/g, "📎 $1"));
    }
    if (bloques.length >= MAX_BLOQUES) break;
  }
  cerrarParrafo();
  return { titulo, bloques: bloques.slice(0, MAX_BLOQUES) };
}

/** "Carpeta/Mi nota.md" → "Mi nota". */
export const tituloDeArchivo = (nombre: string) => (nombre.split(/[\\/]/).pop() ?? nombre).replace(/\.(md|markdown|txt)$/i, "").trim().slice(0, 200);

/** Nombre de archivo seguro para cualquier sistema (sin / \ : * ? " < > |). */
export function nombreArchivo(titulo: string): string {
  const limpio = (titulo || "Sin título").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, " ").trim().slice(0, 100);
  return limpio.replace(/^\.+/, "") || "Sin título";
}
