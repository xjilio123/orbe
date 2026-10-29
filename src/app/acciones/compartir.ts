"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bloquesDe, leerCompartido, notasDe, tituloDe } from "@/lib/compartir";
import type { Json } from "@/lib/supabase/tipos";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { datosDe } from "@/lib/validacion";

/** Guarda lo compartido desde otra app como tarea (en el Inbox) o como nota (en Apuntes) y la abre. */
export async function guardarCompartido(como: "tarea" | "nota", formData: FormData): Promise<void> {
  const c = leerCompartido(datosDe(formData));
  if (!c.titulo && !c.texto && !c.url) redirect("/compartir?error=vacio");
  const { supabase, usuario } = await requerirUsuario();

  if (como === "tarea") {
    const { data, error } = await supabase
      .from("tareas")
      .insert({ user_id: usuario.id, titulo: tituloDe(c), notas: notasDe(c) })
      .select("id")
      .single();
    if (error) redirect("/compartir?error=guardar");
    revalidatePath("/", "layout");
    redirect(`/tareas/${data.id}`);
  }

  const { data, error } = await supabase
    .from("paginas")
    .insert({ user_id: usuario.id, titulo: tituloDe(c), icono: "🔗", contenido: bloquesDe(c) as unknown as Json })
    .select("id")
    .single();
  if (error) redirect("/compartir?error=guardar");
  revalidatePath("/apuntes", "layout");
  redirect(`/apuntes/${data.id}`);
}
