"use server";

import { revalidatePath } from "next/cache";
import { generarClave, huella, pista } from "@/lib/atajo";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export type ResultadoClave = { ok: true; clave: string } | { ok: false; error: string };

/** Crea una clave para el atajo de Siri. Se devuelve una sola vez: después solo se ve su final. */
export async function crearClaveAtajo(nombre: string): Promise<ResultadoClave> {
  const limpio = String(nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 40) || "iPhone";
  const { supabase } = await requerirUsuario();
  const clave = generarClave();
  const { error } = await supabase.from("claves_atajo").insert({ nombre: limpio, hash: huella(clave), pista: pista(clave) });
  if (error) return { ok: false, error: error.message.includes("máximo") ? "Puedes tener hasta 5 claves. Revoca una que no uses." : "No se pudo crear la clave." };
  revalidatePath("/ajustes");
  return { ok: true, clave };
}

/** Revoca una clave: el atajo que la use deja de funcionar al instante. */
export async function revocarClaveAtajo(id: string): Promise<void> {
  if (!esquemaId.safeParse(id).success) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("claves_atajo").delete().eq("id", id);
  revalidatePath("/ajustes");
}
