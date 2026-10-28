import type { Bloque } from "@/lib/bloques";
import { hoyLima } from "@/lib/fechas";
import { aMarkdown, nombreArchivo } from "@/lib/markdown";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { crearZip } from "@/lib/zip";

/**
 * Exporta todas tus páginas como un .zip de archivos Markdown, con carpetas según cómo están anidadas.
 * Se abre directo como bóveda de Obsidian. Las fotos y PDF no van (solo su nombre).
 */
export async function GET() {
  const { supabase } = await requerirUsuario();
  const { data } = await supabase
    .from("paginas")
    .select("id,titulo,padre_id,contenido")
    .is("borrado_en", null)
    .order("creado")
    .limit(2000);
  const paginas = data ?? [];
  const porId = new Map(paginas.map((p) => [p.id, p]));
  const usados = new Set<string>();

  const archivos = paginas.map((p) => {
    // Carpeta = títulos de las páginas que la contienen (hasta 10 niveles).
    const carpetas: string[] = [];
    let padre = p.padre_id ? porId.get(p.padre_id) : undefined;
    for (let i = 0; padre && i < 10; i++) {
      carpetas.unshift(nombreArchivo(padre.titulo));
      padre = padre.padre_id ? porId.get(padre.padre_id) : undefined;
    }
    const base = [...carpetas, nombreArchivo(p.titulo)].join("/");
    // Dos páginas con el mismo nombre en la misma carpeta: la segunda lleva un número.
    let ruta = `${base}.md`;
    for (let n = 2; usados.has(ruta.toLowerCase()); n++) ruta = `${base} (${n}).md`;
    usados.add(ruta.toLowerCase());
    const bloques = Array.isArray(p.contenido) ? (p.contenido as unknown as Bloque[]) : [];
    return { nombre: `Orbe/${ruta}`, contenido: aMarkdown(p.titulo, bloques) };
  });

  const zip = crearZip(archivos);
  return new Response(zip.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="orbe-notas-${hoyLima()}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
