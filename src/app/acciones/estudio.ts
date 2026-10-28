"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tituloDiario } from "@/lib/estudio";
import { hoyLima } from "@/lib/fechas";
import { desdePlantilla } from "@/lib/plantillas";
import type { Json } from "@/lib/supabase/tipos";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { datosDe, erroresDe, esquemaFecha, esquemaFechaImportante, esquemaId } from "@/lib/validacion";
import type { EstadoFormulario, ResultadoGuardado } from "./tipos";

function refrescar() {
  revalidatePath("/", "layout");
}

/** Marca (o desmarca) una página como curso: aparece en Modo estudio con sus temas y exámenes. */
export async function alternarCurso(id: string, curso: boolean): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("paginas").update({ curso: Boolean(curso) }).eq("id", id);
  refrescar();
}

/** Un examen = fecha importante ligada al curso (sale en la cuenta regresiva de Hoy). */
export async function crearExamen(cursoId: string, _anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (!esquemaId.safeParse(cursoId).success) return { errores: { general: "Curso no válido." } };
  const validado = esquemaFechaImportante.safeParse({ icono: "📝", color: "rojo", ...datosDe(formData) });
  if (!validado.success) return { errores: erroresDe(validado.error) };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("fechas_importantes").insert({ ...validado.data, pagina_id: cursoId });
  if (error) return { errores: { general: error.message.includes("máximo") ? "Llegaste al máximo de 100 fechas importantes." : "No se pudo guardar." } };
  refrescar();
  return { ok: true };
}

/** Guarda cómo te sentiste un día (o lo borra con `null`). */
export async function marcarAnimo(fecha: string, animo: number | null): Promise<ResultadoGuardado> {
  if (!esquemaFecha.safeParse(fecha).success || (animo !== null && (!Number.isInteger(animo) || animo < 1 || animo > 5))) {
    return { ok: false, error: "Datos no válidos." };
  }
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("diario").upsert({ fecha, animo }, { onConflict: "user_id,fecha" });
  if (error) return { ok: false, error: error.message.includes("aún no llega") ? "Ese día aún no llega." : "No se pudo guardar." };
  refrescar();
  return { ok: true };
}

/**
 * Abre la página del diario de un día; si no existe, la crea con la plantilla "Diario" dentro de
 * una página "Diario" (que también se crea la primera vez).
 */
export async function abrirDiario(fecha: string): Promise<void> {
  if (!esquemaFecha.safeParse(fecha).success || fecha > hoyLima()) redirect("/diario");
  const { supabase, usuario } = await requerirUsuario();

  const { data: dia } = await supabase.from("diario").select("pagina_id").eq("fecha", fecha).maybeSingle();
  if (dia?.pagina_id) {
    const { data: existe } = await supabase.from("paginas").select("id").eq("id", dia.pagina_id).is("borrado_en", null).maybeSingle();
    if (existe) redirect(`/apuntes/${existe.id}`);
  }

  let { data: carpeta } = await supabase
    .from("paginas")
    .select("id")
    .is("padre_id", null)
    .eq("titulo", "Diario")
    .eq("icono", "📔")
    .is("borrado_en", null)
    .limit(1)
    .maybeSingle();
  if (!carpeta) {
    const { data, error } = await supabase.from("paginas").insert({ user_id: usuario.id, titulo: "Diario", icono: "📔" }).select("id").single();
    if (error) redirect("/diario?error=1");
    carpeta = data;
  }

  const plantilla = desdePlantilla("diario");
  const { data: nueva, error } = await supabase
    .from("paginas")
    .insert({
      user_id: usuario.id,
      padre_id: carpeta.id,
      titulo: tituloDiario(fecha),
      icono: "📔",
      contenido: (plantilla?.contenido ?? []) as unknown as Json,
    })
    .select("id")
    .single();
  if (error) redirect("/diario?error=1");
  await supabase.from("diario").upsert({ fecha, pagina_id: nueva.id }, { onConflict: "user_id,fecha" });
  refrescar();
  redirect(`/apuntes/${nueva.id}`);
}
