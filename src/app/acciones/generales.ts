"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requerirUsuario } from "@/lib/supabase/servidor";
import { COOKIE_TEMA, TEMAS } from "@/lib/tema";

export async function guardarTema(formData: FormData): Promise<void> {
  await requerirUsuario();
  const tema = formData.get("tema");
  if (typeof tema !== "string" || !(TEMAS as readonly string[]).includes(tema)) return;
  (await cookies()).set(COOKIE_TEMA, tema, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

export async function cerrarSesion() {
  const { supabase } = await requerirUsuario();
  await supabase.auth.signOut();
  redirect("/login");
}
