"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Json } from "@/lib/supabase/tipos";
import { deMarkdown, tituloDeArchivo } from "@/lib/markdown";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";
import type { ResultadoImportacion } from "./tipos";

/** Crea la página de un [[enlace]] que todavía no existe y la abre. */
export async function crearPaginaEnlazada(titulo: string, padreId: string | null): Promise<void> {
  const limpio = String(titulo ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!limpio) return;
  const padre = padreId && esquemaId.safeParse(padreId).success ? padreId : null;
  const { supabase, usuario } = await requerirUsuario();
  const { data, error } = await supabase.from("paginas").insert({ user_id: usuario.id, padre_id: padre, titulo: limpio }).select("id").single();
  if (error) redirect(padre ? `/apuntes/${padre}?error=1` : "/apuntes?error=1");
  revalidatePath("/apuntes", "layout");
  redirect(`/apuntes/${data.id}`);
}

// Llegan de a tandas (el teléfono las arma bajo 3 MB por envío).
const esquemaArchivos = z
  .array(z.object({ nombre: z.string().min(1).max(300), texto: z.string().max(1_000_000) }))
  .min(1)
  .max(40);

/**
 * Trae notas en Markdown (por ejemplo, de Obsidian) como páginas nuevas, todas dentro de una carpeta
 * "Importado". Los [[enlaces]] se conservan, así los backlinks funcionan solos. La base cuida el espacio.
 */
export async function importarMarkdown(archivos: { nombre: string; texto: string }[], carpetaId: string | null): Promise<ResultadoImportacion> {
  const validado = esquemaArchivos.safeParse(archivos);
  if (!validado.success) return { ok: false, error: "Elige archivos .md de hasta 1 MB cada uno." };
  const { supabase, usuario } = await requerirUsuario();

  let carpeta = carpetaId && esquemaId.safeParse(carpetaId).success ? carpetaId : null;
  if (!carpeta) {
    const fecha = new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", day: "numeric", month: "short", year: "numeric" }).format(new Date());
    const { data, error } = await supabase
      .from("paginas")
      .insert({ user_id: usuario.id, titulo: `Importado · ${fecha}`, icono: "📥" })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message.startsWith("Llegaste") ? error.message : "No se pudo crear la carpeta de importación." };
    carpeta = data.id;
  }

  const filas = validado.data.map((a) => {
    const { titulo, bloques } = deMarkdown(a.texto);
    return {
      user_id: usuario.id,
      padre_id: carpeta,
      titulo: (tituloDeArchivo(a.nombre) || titulo || "Sin título").slice(0, 200),
      icono: "📄",
      contenido: bloques as unknown as Json,
    };
  });
  const { error } = await supabase.from("paginas").insert(filas);
  if (error) {
    const texto = error.message.startsWith("Sin espacio") || error.message.startsWith("Llegaste") ? error.message : "No se pudieron guardar algunas notas.";
    return { ok: false, error: texto, carpetaId: carpeta };
  }
  revalidatePath("/apuntes", "layout");
  return { ok: true, creadas: filas.length, carpetaId: carpeta };
}
