"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { esEstado, esTipo } from "@/lib/coleccion";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { COLORES_LISTA } from "@/lib/tareas";
import { datosDe, erroresDe, esquemaId } from "@/lib/validacion";
import type { EstadoFormulario, ResultadoGuardado } from "./tipos";

const texto = (max: number, mensaje: string) =>
  z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1, mensaje).max(max));

const esquemaChecklist = z.object({
  nombre: texto(60, "Ponle un nombre: Mercado, Maleta…"),
  icono: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : "🛒"))
    .pipe(z.string().max(8, "Usa un solo emoji")),
  color: z.enum(COLORES_LISTA),
});

const esquemaObra = z.object({
  titulo: texto(200, "Escribe el título"),
  autor: z
    .string()
    .optional()
    .transform((s) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, 120)),
  tipo: z.string().refine(esTipo, "Tipo no válido"),
  total: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? Number(s) : null))
    .pipe(z.number().int("Usa un número entero").min(1).max(100000).nullable()),
});

function mensaje(error: { message: string }, nombre: string): string {
  const tope = error.message.match(/Llegaste al máximo de (\d+)/);
  return tope ? `Llegaste al máximo de ${tope[1]} ${nombre}.` : "No se pudo guardar. Intenta de nuevo.";
}

function refrescar() {
  revalidatePath("/", "layout");
}

// ---------- Checklists ----------

export async function crearChecklist(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const validado = esquemaChecklist.safeParse(datosDe(formData));
  if (!validado.success) return { errores: erroresDe(validado.error) };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("checklists").insert(validado.data);
  if (error) return { errores: { general: mensaje(error, "checklists") } };
  refrescar();
  return { ok: true };
}

export async function eliminarChecklist(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("checklists").delete().eq("id", id);
  refrescar();
}

export async function agregarItem(checklistId: string, textoItem: string): Promise<ResultadoGuardado> {
  const limpio = String(textoItem ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  if (!esquemaId.safeParse(checklistId).success || !limpio) return { ok: false, error: "Escribe qué agregar." };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("checklist_items").insert({ checklist_id: checklistId, texto: limpio, orden: Math.floor(Date.now() / 1000) });
  if (error) return { ok: false, error: mensaje(error, "ítems") };
  refrescar();
  return { ok: true };
}

export async function alternarItem(id: string, hecho: boolean): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("checklist_items").update({ hecho: Boolean(hecho) }).eq("id", id);
  refrescar();
}

export async function eliminarItem(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("checklist_items").delete().eq("id", id);
  refrescar();
}

/** Desmarca todo para volver a usar la lista (el mercado de la otra semana, la maleta del próximo viaje). */
export async function desmarcarTodo(checklistId: string): Promise<void> {
  if (!esquemaId.safeParse(checklistId).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("checklist_items").update({ hecho: false }).eq("checklist_id", checklistId).eq("hecho", true);
  refrescar();
}

// ---------- Biblioteca ----------

export async function crearObra(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const datos = datosDe(formData);
  const validado = esquemaObra.safeParse(datos);
  if (!validado.success) return { errores: erroresDe(validado.error) };
  const estado = esEstado(datos.estado ?? "") ? datos.estado : "quiero";
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("biblioteca").insert({ ...validado.data, estado });
  if (error) return { errores: { general: mensaje(error, "obras en la biblioteca") } };
  refrescar();
  return { ok: true };
}

/** Cambia el avance, el estado o la nota de un libro o serie. */
export async function actualizarObra(id: string, cambios: { progreso?: number; estado?: string; nota?: number | null }): Promise<ResultadoGuardado> {
  if (!esquemaId.safeParse(id).success) return { ok: false, error: "Datos no válidos." };
  const datos: { progreso?: number; estado?: string; nota?: number | null } = {};
  if (cambios.progreso !== undefined) {
    if (!Number.isInteger(cambios.progreso) || cambios.progreso < 0 || cambios.progreso > 100000) return { ok: false, error: "Avance no válido." };
    datos.progreso = cambios.progreso;
  }
  if (cambios.estado !== undefined) {
    if (!esEstado(cambios.estado)) return { ok: false, error: "Estado no válido." };
    datos.estado = cambios.estado;
  }
  if (cambios.nota !== undefined) {
    if (cambios.nota !== null && (!Number.isInteger(cambios.nota) || cambios.nota < 1 || cambios.nota > 5)) return { ok: false, error: "Nota no válida." };
    datos.nota = cambios.nota;
  }
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.from("biblioteca").update(datos).eq("id", id);
  if (error) return { ok: false, error: "No se pudo guardar." };
  refrescar();
  return { ok: true };
}

export async function eliminarObra(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("biblioteca").delete().eq("id", id);
  refrescar();
}
