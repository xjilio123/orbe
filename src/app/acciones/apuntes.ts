"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EXTENSION, MAX_ARCHIVO, detectarTipo, nombreSeguro } from "@/lib/archivos";
import { esquemaPagina, type DatosPagina } from "@/lib/bloques";
import { descendientes, pagina, todasLasPaginas } from "@/lib/datos/paginas";
import { copiarComoPlantilla, desdePlantilla } from "@/lib/plantillas";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";
import type { ResultadoGuardado, ResultadoSubida } from "./tipos";

function mensajeBase(error: { code?: string; message: string }): string {
  if (error.message.startsWith("Sin espacio") || error.message.startsWith("Llegaste") || error.message.startsWith("Máximo")) {
    return error.message;
  }
  return "No se pudo guardar. Revisa tu conexión e intenta de nuevo.";
}

/**
 * Crea una página en blanco o desde una plantilla: de Orbe ("clase", "reunion"…) o una página tuya
 * marcada como plantilla (su id). Las plantillas tuyas se copian sin fotos ni PDF.
 */
export async function crearPagina(padreId: string | null, plantilla?: string): Promise<void> {
  const padre = padreId && esquemaId.safeParse(padreId).success ? padreId : null;
  const { supabase, usuario } = await requerirUsuario();

  let datos: DatosPagina | null = plantilla ? desdePlantilla(plantilla) : null;
  if (!datos && plantilla && esquemaId.safeParse(plantilla).success) {
    const origen = await pagina(supabase, plantilla);
    if (origen?.plantilla) datos = copiarComoPlantilla(origen);
  }

  const { data, error } = await supabase
    .from("paginas")
    .insert({ user_id: usuario.id, padre_id: padre, ...(datos ?? {}) })
    .select("id")
    .single();
  if (error) redirect(padre ? `/apuntes/${padre}?error=1` : "/apuntes?error=1");
  revalidatePath("/apuntes", "layout");
  redirect(`/apuntes/${data.id}`);
}

/** Guardado automático del editor (título, ícono y bloques). La base pone el candado de 8 MB. */
export async function guardarPagina(id: string, datos: DatosPagina): Promise<ResultadoGuardado> {
  if (!esquemaId.safeParse(id).success) return { ok: false, error: "Página no válida." };
  const validado = esquemaPagina.safeParse(datos);
  if (!validado.success) return { ok: false, error: "Hay un bloque con datos no válidos." };

  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("paginas").update(validado.data).eq("id", id);
  if (error) return { ok: false, error: mensajeBase(error) };
  revalidatePath("/apuntes", "layout");
  return { ok: true };
}

export async function alternarFavorita(id: string, favorita: boolean): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("paginas").update({ favorita }).eq("id", id);
  revalidatePath("/apuntes", "layout");
}

/** Manda la página y sus páginas internas a la papelera (30 días). Sus archivos se borran al vaciarla. */
export async function eliminarPagina(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  const todas = await todasLasPaginas(supabase);
  const actual = todas.find((p) => p.id === id);
  if (!actual) redirect("/apuntes");

  const ids = descendientes(todas, id);
  const ahora = new Date().toISOString();
  for (let i = 0; i < ids.length; i += 200) {
    await supabase.from("paginas").update({ borrado_en: ahora }).in("id", ids.slice(i, i + 200));
  }
  revalidatePath("/", "layout");
  redirect(actual.padre_id ? `/apuntes/${actual.padre_id}` : "/apuntes");
}

/**
 * Sube una foto (ya comprimida en el teléfono) o un PDF. El tipo se comprueba por sus bytes, no por el nombre.
 * Primero se registra en la base (candado de 30 MB) y recién después se sube a la carpeta privada.
 */
export async function subirAdjunto(paginaId: string, formData: FormData): Promise<ResultadoSubida> {
  if (!esquemaId.safeParse(paginaId).success) return { ok: false, error: "Página no válida." };
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, error: "No llegó ningún archivo." };
  if (archivo.size > MAX_ARCHIVO) return { ok: false, error: "El archivo pesa más de 4 MB." };

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = detectarTipo(bytes);
  if (!tipo) return { ok: false, error: "Solo se aceptan fotos (JPG, PNG, WebP) y PDF." };

  const { supabase, usuario } = await requerirUsuario();
  const id = crypto.randomUUID();
  const ruta = `${usuario.id}/${id}.${EXTENSION[tipo]}`;
  const nombre = nombreSeguro(archivo.name);

  const { error: errorRegistro } = await supabase
    .from("adjuntos")
    .insert({ id, user_id: usuario.id, pagina_id: paginaId, ruta, tipo, tamano: bytes.length, nombre });
  if (errorRegistro) return { ok: false, error: mensajeBase(errorRegistro) };

  const { error: errorSubida } = await supabase.storage.from("adjuntos").upload(ruta, bytes, { contentType: tipo, upsert: false });
  if (errorSubida) {
    await supabase.from("adjuntos").delete().eq("id", id);
    return { ok: false, error: "No se pudo subir el archivo. Intenta de nuevo." };
  }

  const { data: firmado } = await supabase.storage.from("adjuntos").createSignedUrl(ruta, 3600);
  return { ok: true, adjunto: { id, tipo, nombre, tamano: bytes.length, url: firmado?.signedUrl ?? "" } };
}

export async function eliminarAdjunto(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  const { data } = await supabase.from("adjuntos").select("ruta").eq("id", id).maybeSingle();
  if (!data) return;
  await supabase.storage.from("adjuntos").remove([data.ruta]);
  await supabase.from("adjuntos").delete().eq("id", id);
}

/** Marca o desmarca una página como plantilla (aparece al crear una página nueva). */
export async function alternarPlantilla(id: string, plantilla: boolean): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("paginas").update({ plantilla }).eq("id", id);
  revalidatePath("/apuntes", "layout");
}

/** Vuelve a una versión anterior. La versión actual queda guardada en el historial (se puede deshacer). */
export async function restaurarVersion(paginaId: string, hueco: number): Promise<void> {
  if (!esquemaId.safeParse(paginaId).success || !Number.isInteger(hueco) || hueco < 0 || hueco > 9) return;
  const { supabase } = await requerirUsuario();
  const { data: version } = await supabase
    .from("versiones_pagina")
    .select("titulo,icono,contenido")
    .eq("pagina_id", paginaId)
    .eq("hueco", hueco)
    .maybeSingle();
  if (!version) return;
  await supabase.from("paginas").update(version).eq("id", paginaId);
  revalidatePath("/apuntes", "layout");
  redirect(`/apuntes/${paginaId}`);
}
