"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizarUrlCalendario } from "@/lib/calendario";
import { olvidarCalendario } from "@/lib/datos/calendario";
import { requerirUsuario } from "@/lib/supabase/servidor";
import type { EstadoFormulario, ResultadoGuardado } from "./tipos";

// Mismas reglas que la base (suscripciones_push): solo servicios de push conocidos.
const esquemaSuscripcion = z.object({
  endpoint: z
    .string()
    .max(1000)
    .regex(/^https:\/\/(web\.push\.apple\.com|fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)\//),
  p256dh: z.string().regex(/^[A-Za-z0-9_-]{40,200}$/),
  auth: z.string().regex(/^[A-Za-z0-9_-]{10,100}$/),
  dispositivo: z.string().max(80),
});

/** Guarda la suscripción push de este teléfono o navegador. */
export async function guardarSuscripcion(datos: unknown): Promise<ResultadoGuardado> {
  const validado = esquemaSuscripcion.safeParse(datos);
  if (!validado.success) return { ok: false, error: "Este navegador no es compatible con los avisos de Orbe." };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.rpc("guardar_suscripcion_push", {
    p_endpoint: validado.data.endpoint,
    p_p256dh: validado.data.p256dh,
    p_auth: validado.data.auth,
    p_dispositivo: validado.data.dispositivo,
  });
  if (error) {
    return { ok: false, error: error.message.includes("Llegaste al máximo") ? "Ya tienes 10 dispositivos con avisos. Quita uno." : "No se pudo activar." };
  }
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function quitarSuscripcion(endpoint: string): Promise<void> {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return;
  const { supabase } = await requerirUsuario();
  await supabase.from("suscripciones_push").delete().eq("endpoint", endpoint);
  revalidatePath("/ajustes");
}

const MENSAJES_PRUEBA: Record<string, ResultadoGuardado> = {
  enviado: { ok: true },
  espera: { ok: false, error: "Espera un minuto antes de otra prueba." },
  sin_dispositivos: { ok: false, error: "Primero activa los avisos en este dispositivo." },
};

/** Manda un aviso de prueba a tus dispositivos (máximo uno por minuto, lo controla la base). */
export async function probarAvisos(): Promise<ResultadoGuardado> {
  const { supabase } = await requerirUsuario();
  const { data, error } = await supabase.rpc("probar_avisos");
  if (error || !data) return { ok: false, error: "No se pudo enviar la prueba." };
  return MENSAJES_PRUEBA[data] ?? { ok: false, error: "No se pudo enviar la prueba." };
}

/** Conecta Google Calendar con la dirección secreta iCal (solo lectura). */
export async function guardarCalendario(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const texto = formData.get("url");
  const url = typeof texto === "string" && texto.length <= 600 ? normalizarUrlCalendario(texto) : null;
  if (!url) return { errores: { url: "Pega la “Dirección secreta en formato iCal” de Google Calendar (termina en basic.ics)." } };

  const { supabase, usuario } = await requerirUsuario();
  const { error } = await supabase.from("perfiles").update({ calendario_ics: url }).eq("id", usuario.id);
  if (error) return { errores: { url: "No se pudo guardar. Intenta de nuevo." } };
  olvidarCalendario(usuario.id);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function quitarCalendario(): Promise<void> {
  const { supabase, usuario } = await requerirUsuario();
  await supabase.from("perfiles").update({ calendario_ics: null }).eq("id", usuario.id);
  olvidarCalendario(usuario.id);
  revalidatePath("/", "layout");
}

/** Invita un correo (solo la administración; la base lo verifica y pone el tope de 30). */
export async function invitar(_anterior: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.email().safeParse(email).success || email.length > 254) return { errores: { email: "Escribe un correo válido." } };
  const { supabase } = await requerirUsuario();
  const { error } = await supabase.rpc("invitar", { p_email: email });
  if (error) {
    const msg = error.message.includes("30 personas") ? "Ya hay 30 personas invitadas: quita a alguien primero." : "No se pudo invitar.";
    return { errores: { email: msg } };
  }
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function quitarInvitado(email: string): Promise<void> {
  if (typeof email !== "string" || email.length > 254) return;
  const { supabase } = await requerirUsuario();
  await supabase.rpc("quitar_invitado", { p_email: email });
  revalidatePath("/ajustes");
}
