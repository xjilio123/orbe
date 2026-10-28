"use server";

import { revalidatePath } from "next/cache";
import { anioDe } from "@/lib/progreso";
import { hoyLima } from "@/lib/fechas";
import { requerirUsuario } from "@/lib/supabase/servidor";
import {
  datosDe,
  erroresDe,
  esquemaFecha,
  esquemaFechaImportante,
  esquemaHabito,
  esquemaId,
  esquemaMeta,
  esquemaSesionFoco,
} from "@/lib/validacion";
import type { EstadoFormulario, ResultadoGuardado } from "./tipos";

const NOMBRES: Record<string, string> = {
  habitos: "hábitos",
  metas: "metas",
  fechas_importantes: "fechas importantes",
  sesiones_foco: "sesiones de foco",
  habitos_marcas: "marcas de hábitos",
};

/** Mensaje claro para los errores que puede devolver la base. */
function mensajeBase(error: { message: string }): string {
  const tope = error.message.match(/Llegaste al máximo de (\d+) en (\w+)/);
  if (tope) return `Llegaste al máximo de ${tope[1]} ${NOMBRES[tope[2]] ?? tope[2]}.`;
  if (error.message.includes("aún no llega")) return "No puedes marcar un día que aún no llega.";
  if (error.message.includes("último mes")) return "Solo puedes marcar días del último mes.";
  return "No se pudo guardar. Intenta de nuevo.";
}

function refrescar() {
  revalidatePath("/", "layout");
}

export async function crearHabito(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const validado = esquemaHabito.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };
  const { error } = await supabase.from("habitos").insert(validado.data);
  if (error) return { errores: { general: mensajeBase(error) } };
  refrescar();
  return { ok: true };
}

export async function eliminarHabito(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("habitos").delete().eq("id", id);
  refrescar();
}

/** Marca o desmarca un hábito en un día (la base solo acepta días del último mes y no futuros). */
export async function marcarHabito(id: string, fecha: string, hecho: boolean): Promise<ResultadoGuardado> {
  if (!esquemaId.safeParse(id).success || !esquemaFecha.safeParse(fecha).success) return { ok: false, error: "Datos no válidos." };
  const { supabase } = await requerirUsuario();
  const { error } = hecho
    ? await supabase.from("habitos_marcas").upsert({ habito_id: id, fecha }, { onConflict: "habito_id,fecha", ignoreDuplicates: true })
    : await supabase.from("habitos_marcas").delete().eq("habito_id", id).eq("fecha", fecha);
  if (error) return { ok: false, error: mensajeBase(error) };
  refrescar();
  return { ok: true };
}

export async function crearMeta(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const validado = esquemaMeta.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };
  const anio = anioDe(hoyLima());
  const m = validado.data;
  const { error } = await supabase
    .from("metas")
    .insert(
      m.tipo === "numero"
        ? { anio, tipo: "numero", titulo: m.titulo, objetivo: m.objetivo, unidad: m.unidad, color: m.color }
        : { anio, tipo: "lista", titulo: m.titulo, lista_id: m.lista_id, color: m.color },
    );
  if (error) return { errores: { general: mensajeBase(error) } };
  refrescar();
  return { ok: true };
}

/** Cambia el avance de una meta de tipo número (el +1 / −1 de la tarjeta). */
export async function avanzarMeta(id: string, actual: number): Promise<ResultadoGuardado> {
  if (!esquemaId.safeParse(id).success || !Number.isFinite(actual) || actual < 0 || actual > 1_000_000_000) {
    return { ok: false, error: "Datos no válidos." };
  }
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("metas").update({ actual }).eq("id", id).eq("tipo", "numero");
  if (error) return { ok: false, error: mensajeBase(error) };
  refrescar();
  return { ok: true };
}

export async function eliminarMeta(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("metas").delete().eq("id", id);
  refrescar();
}

export async function crearFechaImportante(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const { supabase } = await requerirUsuario();
  const validado = esquemaFechaImportante.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };
  const { error } = await supabase.from("fechas_importantes").insert(validado.data);
  if (error) return { errores: { general: mensajeBase(error) } };
  refrescar();
  return { ok: true };
}

export async function eliminarFechaImportante(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("fechas_importantes").delete().eq("id", id);
  refrescar();
}

/** Guarda una sesión de foco terminada (o cortada antes, si duró al menos 1 minuto). */
export async function guardarFoco(datos: { tarea_id: string | null; inicio: string; minutos: number }): Promise<ResultadoGuardado> {
  const validado = esquemaSesionFoco.safeParse(datos);
  if (!validado.success) return { ok: false, error: "Datos no válidos." };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("sesiones_foco").insert(validado.data);
  if (error) return { ok: false, error: mensajeBase(error) };
  refrescar();
  return { ok: true };
}
