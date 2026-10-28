"use server";

import { revalidatePath } from "next/cache";
import type { Bloque } from "@/lib/bloques";
import { esInbox } from "@/lib/tareas";
import { listas as leerListas, tareaConSubtareas, tareasActivas } from "@/lib/datos/tareas";
import { hoyLima } from "@/lib/fechas";
import { ErrorIa, generarJson } from "@/lib/ia/gemini";
import { bloquesParaIa, captura, datos, dividir, esquemaBloquesIa, etiquetas, mejorar, resumir, type ModoTexto } from "@/lib/ia/funciones";
import { conTope } from "@/lib/ia/tope";
import { esquemaFecha, esquemaId } from "@/lib/validacion";
import type { ResultadoIa } from "./tipos";


/** Captura inteligente: convierte una frase en una o varias tareas con fecha, hora, lista y prioridad. */
export async function capturaIa(texto: string, extra: { lista_id?: string; fecha_defecto?: string } = {}): Promise<ResultadoIa<{ titulos: string[] }>> {
  const limpio = typeof texto === "string" ? texto.trim().slice(0, 600) : "";
  if (limpio.length < 3) return { ok: false, error: "Escribe un poco más para que la IA entienda." };
  const listaFija = extra.lista_id && esquemaId.safeParse(extra.lista_id).success ? extra.lista_id : null;
  const porDefecto = extra.fecha_defecto && esquemaFecha.safeParse(extra.fecha_defecto).success ? extra.fecha_defecto : null;

  return conTope("captura", async (supabase, usuario) => {
    const misListas = await leerListas(supabase);
    const nombres = misListas.map((l) => l.nombre);
    const r = await generarJson({
      sistema: captura.sistema(hoyLima(), nombres),
      partes: [datos(limpio)],
      esquema: captura.esquema,
      validar: captura.validar,
    });
    const tareas = captura.limpiar(r.tareas, nombres);
    if (tareas.length === 0) throw new ErrorIa("RESPUESTA", "La IA no encontró ninguna tarea en ese texto.");
    const idDeLista = new Map(misListas.map((l) => [l.nombre, l.id]));
    const { error } = await supabase.from("tareas").insert(
      tareas.map((t) => {
        const fecha = t.fecha ?? porDefecto;
        return {
          user_id: usuario,
          titulo: t.titulo,
          notas: t.notas,
          fecha,
          hora: fecha ? t.hora : null,
          prioridad: t.prioridad,
          lista_id: listaFija ?? (t.lista ? (idDeLista.get(t.lista) ?? null) : null),
          repetir: fecha ? t.repetir : null,
        };
      }),
    );
    if (error) throw new ErrorIa("RESPUESTA", "No se pudieron guardar las tareas.");
    revalidatePath("/", "layout");
    return { titulos: tareas.map((t) => t.titulo) };
  });
}

/** Divide una tarea en pasos (subtareas). */
export async function dividirIa(tareaId: string): Promise<ResultadoIa<{ pasos: number }>> {
  if (!esquemaId.safeParse(tareaId).success) return { ok: false, error: "Tarea no válida." };
  return conTope("dividir", async (supabase, usuario) => {
    const { tarea, subtareas } = await tareaConSubtareas(supabase, tareaId);
    if (!tarea || tarea.padre_id) throw new ErrorIa("RESPUESTA", "Solo se pueden dividir tareas principales.");
    const contexto = [`Tarea: ${tarea.titulo}`, tarea.notas && `Notas: ${tarea.notas}`, subtareas.length && `Ya tiene: ${subtareas.map((s) => s.titulo).join("; ")}`]
      .filter(Boolean)
      .join("\n");
    const r = await generarJson({ sistema: dividir.sistema, partes: [datos(contexto)], esquema: dividir.esquema, validar: dividir.validar });
    const pasos = dividir.limpiar(r.pasos);
    if (pasos.length === 0) throw new ErrorIa("RESPUESTA", "La IA no propuso pasos.");
    const { error } = await supabase.from("tareas").insert(pasos.map((titulo) => ({ user_id: usuario, padre_id: tarea.id, titulo })));
    if (error) throw new ErrorIa("RESPUESTA", "No se pudieron guardar los pasos.");
    revalidatePath("/", "layout");
    return { pasos: pasos.length };
  });
}

/** Ordena el Inbox: elige lista y prioridad para cada tarea (hasta 25). */
export async function ordenarInboxIa(): Promise<ResultadoIa<{ ordenadas: number }>> {
  return conTope("etiquetas", async (supabase) => {
    const [tareas, misListas] = await Promise.all([tareasActivas(supabase, hoyLima()), leerListas(supabase)]);
    const inbox = tareas.filter(esInbox).slice(0, 25);
    if (inbox.length === 0) throw new ErrorIa("RESPUESTA", "Tu Inbox está vacío.");
    if (misListas.length === 0) throw new ErrorIa("RESPUESTA", "Primero crea alguna lista para poder ordenar.");
    const r = await generarJson({
      sistema: etiquetas.sistema(misListas.map((l) => l.nombre)),
      partes: [datos(JSON.stringify(inbox.map((t) => ({ id: t.id, titulo: t.titulo, notas: t.notas.slice(0, 300) }))))],
      esquema: etiquetas.esquema,
      validar: etiquetas.validar,
    });
    const cambios = etiquetas.limpiar(r.tareas, inbox.map((t) => t.id), misListas);
    for (const c of cambios) {
      await supabase.from("tareas").update({ lista_id: c.lista_id, prioridad: c.prioridad }).eq("id", c.id);
    }
    revalidatePath("/", "layout");
    return { ordenadas: cambios.filter((c) => c.lista_id).length };
  });
}


/** Mejora la redacción o traduce al inglés los bloques de texto. Devuelve los textos nuevos; el editor los aplica. */
export async function textoIa(modo: ModoTexto, bloques: Bloque[]): Promise<ResultadoIa<{ id: string; texto: string }[]>> {
  if (modo !== "mejorar" && modo !== "traducir") return { ok: false, error: "Opción no válida." };
  const validado = esquemaBloquesIa.safeParse(bloques);
  if (!validado.success) return { ok: false, error: "La página tiene datos no válidos." };
  const enviados = bloquesParaIa(validado.data as Bloque[]);
  if (enviados.length === 0) return { ok: false, error: "No hay texto para trabajar." };
  return conTope("mejorar", async () => {
    const r = await generarJson({
      sistema: mejorar.sistema(modo),
      partes: [datos(JSON.stringify(enviados.map(({ id, tipo, texto }) => ({ id, tipo, texto }))))],
      esquema: mejorar.esquema,
      validar: mejorar.validar,
    });
    const cambios = mejorar.limpiar(r.bloques, enviados);
    if (cambios.length === 0) throw new ErrorIa("RESPUESTA", "La IA no devolvió cambios.");
    return cambios;
  });
}

/** Resume una página: una frase y hasta 5 puntos clave. */
export async function resumirIa(bloques: Bloque[]): Promise<ResultadoIa<{ resumen: string; puntos: string[] }>> {
  const validado = esquemaBloquesIa.safeParse(bloques);
  if (!validado.success) return { ok: false, error: "La página tiene datos no válidos." };
  const enviados = bloquesParaIa(validado.data as Bloque[]);
  if (enviados.reduce((n, b) => n + b.texto.length, 0) < 80) return { ok: false, error: "La página es muy corta para resumirla." };
  return conTope("resumir", async () => {
    const r = await generarJson({
      sistema: resumir.sistema,
      partes: [datos(enviados.map((b) => b.texto).join("\n"))],
      esquema: resumir.esquema,
      validar: resumir.validar,
    });
    return resumir.limpiar(r);
  });
}
