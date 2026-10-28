"use server";

import { revalidatePath } from "next/cache";
import { lunesDe } from "@/lib/agenda";
import { detectarTipo } from "@/lib/archivos";
import type { Bloque } from "@/lib/bloques";
import { eventosDeGoogle } from "@/lib/datos/calendario";
import { tareasActivas } from "@/lib/datos/tareas";
import { hoyLima, minutosLima } from "@/lib/fechas";
import { aBloques, plan, semana, tarjetas, tipoDeAudio, type Plan, type ResumenSemana } from "@/lib/ia/contenido";
import { bloquesParaIa, datos, esquemaBloquesIa } from "@/lib/ia/funciones";
import { ErrorIa, generarJson } from "@/lib/ia/gemini";
import { conTope } from "@/lib/ia/tope";
import type { Json } from "@/lib/supabase/tipos";
import { resumenDelDia } from "@/lib/tareas";
import { esquemaId } from "@/lib/validacion";
import type { ResultadoIa } from "./tipos";

// IA, parte 2: plan del día, resumen semanal, tarjetas de estudio, foto a texto y nota de voz.

const horaDe = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/** Plan del día: ordena lo pendiente de hoy entre los eventos de tu calendario. Se guarda para no gastar otro uso. */
export async function planIa(): Promise<ResultadoIa<Plan>> {
  return conTope("plan", async (supabase, usuario) => {
    const hoy = hoyLima();
    const [tareas, { data: perfil }] = await Promise.all([
      tareasActivas(supabase, hoy),
      supabase.from("perfiles").select("calendario_ics").eq("id", usuario).maybeSingle(),
    ]);
    const pendientes = resumenDelDia(tareas, hoy, () => false).pendientes.slice(0, 30);
    const { eventos } = await eventosDeGoogle(usuario, perfil?.calendario_ics ?? null, hoy, hoy);
    if (pendientes.length === 0 && eventos.length === 0) throw new ErrorIa("RESPUESTA", "No tienes tareas ni eventos para hoy.");
    const contexto = {
      tareas: pendientes.map((t) => ({ id: t.id, titulo: t.titulo, prioridad: t.prioridad, vence: t.fecha, hora: t.hora })),
      eventos: eventos.map((e) => ({ titulo: e.titulo, inicio: e.inicio ?? "todo el día", fin: e.fin })),
    };
    const r = await generarJson({
      sistema: plan.sistema(horaDe(minutosLima())),
      partes: [datos(JSON.stringify(contexto))],
      esquema: plan.esquema,
      validar: plan.validar,
    });
    const resultado = plan.limpiar(r, pendientes.map((t) => t.id));
    if (resultado.bloques.length === 0) throw new ErrorIa("RESPUESTA", "La IA no pudo armar un plan. Intenta de nuevo.");
    await supabase.from("ia_guardado").upsert({ user_id: usuario, clave: "plan", fecha: hoy, datos: resultado as unknown as Json });
    revalidatePath("/");
    return resultado;
  });
}

/** Resumen de la semana: lo que terminaste, lo que editaste y lo que quedó pendiente (1 por semana). */
export async function semanaIa(): Promise<ResultadoIa<ResumenSemana>> {
  return conTope("resumen_semanal", async (supabase, usuario) => {
    const hoy = hoyLima();
    const hace7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [{ data: hechas }, { data: paginas }, activas] = await Promise.all([
      supabase.from("tareas").select("titulo").eq("estado", "hecha").gte("hecha_en", hace7).is("borrado_en", null).limit(80),
      supabase.from("paginas").select("titulo").gte("actualizado", hace7).is("borrado_en", null).limit(40),
      tareasActivas(supabase, hoy),
    ]);
    const vencidas = activas.filter((t) => t.estado !== "hecha" && !t.padre_id && t.fecha !== null && t.fecha < hoy).slice(0, 30);
    if (!hechas?.length && !paginas?.length && vencidas.length === 0) throw new ErrorIa("RESPUESTA", "Todavía no hay actividad de esta semana para resumir.");
    const contexto = {
      terminadas: (hechas ?? []).map((t) => t.titulo),
      paginas_editadas: (paginas ?? []).map((p) => p.titulo || "Sin título"),
      vencidas: vencidas.map((t) => ({ titulo: t.titulo, vencio: t.fecha })),
    };
    const r = await generarJson({
      sistema: semana.sistema,
      partes: [datos(JSON.stringify(contexto))],
      esquema: semana.esquema,
      validar: semana.validar,
      temperatura: 0.6,
    });
    const resultado = semana.limpiar(r);
    await supabase.from("ia_guardado").upsert({ user_id: usuario, clave: "semana", fecha: lunesDe(hoy), datos: resultado as unknown as Json });
    revalidatePath("/");
    return resultado;
  });
}

/** Tarjetas de estudio: crea una página dentro de esta con preguntas y respuestas. */
export async function tarjetasIa(paginaId: string, titulo: string, bloques: Bloque[]): Promise<ResultadoIa<{ id: string }>> {
  if (!esquemaId.safeParse(paginaId).success) return { ok: false, error: "Página no válida." };
  const validado = esquemaBloquesIa.safeParse(bloques);
  if (!validado.success) return { ok: false, error: "La página tiene datos no válidos." };
  const enviados = bloquesParaIa(validado.data as Bloque[]);
  if (enviados.reduce((n, b) => n + b.texto.length, 0) < 120) return { ok: false, error: "La página es muy corta para crear tarjetas." };
  return conTope("tarjetas", async (supabase, usuario) => {
    const r = await generarJson({
      sistema: tarjetas.sistema,
      partes: [datos(enviados.map((b) => b.texto).join("\n"))],
      esquema: tarjetas.esquema,
      validar: tarjetas.validar,
    });
    const nueva = tarjetas.aPagina(String(titulo ?? "").slice(0, 150), r.tarjetas);
    if (nueva.contenido.length < 4) throw new ErrorIa("RESPUESTA", "La IA no pudo crear tarjetas con esta página.");
    const { data, error } = await supabase
      .from("paginas")
      .insert({ user_id: usuario, padre_id: paginaId, titulo: nueva.titulo, icono: nueva.icono, contenido: nueva.contenido as unknown as Json })
      .select("id")
      .single();
    if (error) throw new ErrorIa("RESPUESTA", error.message.startsWith("Sin espacio") ? error.message : "No se pudo crear la página de tarjetas.");
    revalidatePath("/apuntes", "layout");
    return { id: data.id };
  });
}

const MAX_MEDIO = 4 * 1024 * 1024;

async function leerArchivo(formData: FormData, campo: string): Promise<Uint8Array | null> {
  const archivo = formData.get(campo);
  if (!(archivo instanceof File) || archivo.size === 0 || archivo.size > MAX_MEDIO) return null;
  return new Uint8Array(await archivo.arrayBuffer());
}

const aBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

/** Foto a texto: lee apuntes, pizarras o listas de una foto. La foto no se guarda. */
export async function fotoIa(formData: FormData): Promise<ResultadoIa<{ titulo: string; bloques: Bloque[] }>> {
  const bytes = await leerArchivo(formData, "foto");
  if (!bytes) return { ok: false, error: "La foto debe pesar menos de 4 MB." };
  const tipo = detectarTipo(bytes);
  if (!tipo || !tipo.startsWith("image/")) return { ok: false, error: "Solo se aceptan fotos (JPG, PNG o WebP)." };
  return conTope("foto", async () => {
    const r = await generarJson({
      sistema: aBloques.sistema("foto"),
      partes: [{ inlineData: { mimeType: tipo, data: aBase64(bytes) } }],
      esquema: aBloques.esquema,
      validar: aBloques.validar,
    });
    const resultado = aBloques.limpiar(r);
    if (resultado.bloques.length === 0) throw new ErrorIa("RESPUESTA", "No encontré texto legible en la foto.");
    return resultado;
  });
}

/** Nota de voz: transcribe y ordena lo que dijiste. El audio no se guarda en ningún lado. */
export async function audioIa(formData: FormData): Promise<ResultadoIa<{ titulo: string; bloques: Bloque[] }>> {
  const bytes = await leerArchivo(formData, "audio");
  if (!bytes) return { ok: false, error: "La grabación es muy larga (máximo unos 2 minutos)." };
  const tipo = tipoDeAudio(bytes);
  if (!tipo) return { ok: false, error: "Ese formato de audio no se puede leer." };
  return conTope("audio", async () => {
    const r = await generarJson({
      sistema: aBloques.sistema("audio"),
      partes: [{ inlineData: { mimeType: tipo, data: aBase64(bytes) } }],
      esquema: aBloques.esquema,
      validar: aBloques.validar,
    });
    const resultado = aBloques.limpiar(r);
    if (resultado.bloques.length === 0) throw new ErrorIa("RESPUESTA", "No se entendió la grabación. Intenta de nuevo, más cerca del micrófono.");
    return resultado;
  });
}
