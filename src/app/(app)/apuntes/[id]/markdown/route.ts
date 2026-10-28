import { notFound } from "next/navigation";
import { pagina as leerPagina } from "@/lib/datos/paginas";
import { aMarkdown, nombreArchivo } from "@/lib/markdown";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

/** Descarga una página como archivo .md (RLS: solo las tuyas). */
export async function GET(_req: Request, { params }: RouteContext<"/apuntes/[id]/markdown">) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirUsuario();
  const p = await leerPagina(supabase, id);
  if (!p) notFound();
  const nombre = `${nombreArchivo(p.titulo)}.md`;
  return new Response(aMarkdown(p.titulo, p.contenido), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="nota.md"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
