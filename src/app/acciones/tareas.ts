"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { interpretarCaptura } from "@/lib/captura";
import { hoyLima } from "@/lib/fechas";
import { requerirUsuario } from "@/lib/supabase/servidor";
import {
  datosDe,
  erroresDe,
  esquemaCaptura,
  esquemaEstado,
  esquemaFecha,
  esquemaId,
  esquemaLista,
  esquemaSubtarea,
  esquemaTarea,
} from "@/lib/validacion";
import type { EstadoCaptura, EstadoFormulario } from "./tipos";

/** Mensaje claro para los errores que puede devolver la base. */
function mensajeBase(error: { code?: string; message: string }): string {
  if (error.message.includes("Llegaste al máximo")) return error.message.replace(" en tareas", " tareas").replace(" en listas", " listas");
  if (error.code === "23505") return "Ya tienes una lista con ese nombre.";
  if (error.message.includes("subtareas")) return error.message;
  if (error.message.includes("repetir_con_fecha")) return "Para repetirla, elige la fecha de la primera vez.";
  return "No se pudo guardar. Intenta de nuevo.";
}

function refrescar() {
  revalidatePath("/", "layout");
}

export async function capturarTarea(anterior: EstadoCaptura, formData: FormData): Promise<EstadoCaptura> {
  const { supabase, usuario } = await requerirUsuario();
  const datos = datosDe(formData);
  const validado = esquemaCaptura.safeParse(datos);
  if (!validado.success) return { ...anterior, ok: false, error: erroresDe(validado.error).texto };

  // En la Agenda, lo que se escribe sin fecha va al día que estás mirando.
  const porDefecto = esquemaFecha.safeParse(datos.fecha_defecto).success ? datos.fecha_defecto : undefined;
  const c = interpretarCaptura(validado.data.texto, hoyLima(), porDefecto);
  if (!c.titulo) return { ...anterior, ok: false, error: "Falta el título de la tarea." };

  // Lista: la de la pantalla donde se capturó, o la de #nombre (se crea si no existe).
  let listaId = esquemaId.safeParse(datos.lista_id).success ? datos.lista_id : null;
  if (!listaId && c.lista) {
    const { data: existente } = await supabase.from("listas").select("id").ilike("nombre", c.lista).maybeSingle();
    if (existente) listaId = existente.id;
    else {
      const { data: nueva, error } = await supabase.from("listas").insert({ nombre: c.lista }).select("id").single();
      if (error) return { ...anterior, ok: false, error: mensajeBase(error) };
      listaId = nueva.id;
    }
  }

  const { error } = await supabase.from("tareas").insert({
    user_id: usuario.id,
    titulo: c.titulo.slice(0, 200),
    fecha: c.fecha,
    hora: c.hora,
    prioridad: c.prioridad,
    lista_id: listaId,
    repetir: c.repetir,
  });
  if (error) return { ...anterior, ok: false, error: mensajeBase(error) };

  refrescar();
  return { ok: true, error: undefined, n: anterior.n + 1 };
}

export async function alternarTarea(id: string, hecha: boolean): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("tareas").update({ estado: hecha ? "hecha" : "pendiente" }).eq("id", id);
  refrescar();
}

export async function moverTarea(id: string, estado: string): Promise<void> {
  const e = esquemaEstado.safeParse(estado);
  if (!esquemaId.safeParse(id).success || !e.success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("tareas").update({ estado: e.data }).eq("id", id);
  refrescar();
}

export async function guardarTarea(id: string, _anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (!esquemaId.safeParse(id).success) return { errores: { general: "Tarea no válida." } };
  const validado = esquemaTarea.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };

  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("tareas").update(validado.data).eq("id", id);
  if (error) return { errores: { general: mensajeBase(error) } };
  refrescar();
  return { ok: true };
}

export async function eliminarTarea(id: string, volverA: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("tareas").delete().eq("id", id);
  refrescar();
  // Solo rutas internas conocidas: nunca un destino que venga del navegador.
  redirect(volverA.startsWith("/tareas/lista/") && esquemaId.safeParse(volverA.slice(14)).success ? volverA : "/tareas");
}

export async function crearSubtarea(padreId: string, anterior: EstadoCaptura, formData: FormData): Promise<EstadoCaptura> {
  if (!esquemaId.safeParse(padreId).success) return { ...anterior, ok: false, error: "Tarea no válida." };
  const validado = esquemaSubtarea.safeParse(datosDe(formData));
  if (!validado.success) return { ...anterior, ok: false, error: erroresDe(validado.error).titulo };

  const { supabase, usuario } = await requerirUsuario();
  const { error } = await supabase.from("tareas").insert({ user_id: usuario.id, padre_id: padreId, titulo: validado.data.titulo });
  if (error) return { ...anterior, ok: false, error: mensajeBase(error) };
  refrescar();
  return { ok: true, error: undefined, n: anterior.n + 1 };
}

export async function crearLista(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const validado = esquemaLista.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };

  const { supabase } = await requerirUsuario();
  const { data, error } = await supabase.from("listas").insert(validado.data).select("id").single();
  if (error) return { errores: { nombre: mensajeBase(error) } };
  refrescar();
  redirect(`/tareas/lista/${data.id}`);
}

export async function guardarLista(id: string, _anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  if (!esquemaId.safeParse(id).success) return { errores: { general: "Lista no válida." } };
  const validado = esquemaLista.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };

  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("listas").update(validado.data).eq("id", id);
  if (error) return { errores: { nombre: mensajeBase(error) } };
  refrescar();
  return { ok: true };
}

/** Borra la lista; sus tareas no se pierden: vuelven al Inbox (lista_id queda vacío). */
export async function eliminarLista(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("listas").delete().eq("id", id);
  refrescar();
  redirect("/tareas");
}
