import { createClient } from "@supabase/supabase-js";
import { leerClave } from "@/lib/atajoClave";
import { interpretarCaptura } from "@/lib/captura";
import { env } from "@/lib/env";
import { hoyLima } from "@/lib/fechas";

/**
 * Atajo de Siri "Anota en Orbe": POST con "Authorization: Bearer orbe_…" y el texto dictado.
 * No usa la sesión del navegador: la clave personal solo permite crear tareas en tu Inbox
 * (la base lo comprueba en capturar_con_clave y frena a 30 por hora).
 */
const respuesta = (estado: number, mensaje: string) =>
  Response.json({ ok: estado === 200, mensaje }, { status: estado, headers: { "Cache-Control": "no-store" } });

const MENSAJES: Record<string, [number, string]> = {
  CLAVE_INVALIDA: [401, "La clave no es válida o fue revocada. Crea una nueva en Orbe → Ajustes → Atajo de Siri."],
  DEMASIADAS: [429, "Anotaste muchas tareas en la última hora. Espera un poco."],
  SIN_TEXTO: [400, "No escuché nada para anotar."],
};

export async function POST(request: Request) {
  const clave = leerClave(request.headers.get("authorization"));
  if (!clave) return respuesta(401, MENSAJES.CLAVE_INVALIDA[1]);

  const cuerpo = await request.text();
  if (cuerpo.length > 4000) return respuesta(413, "El texto es demasiado largo.");
  let texto = cuerpo;
  // Acepta JSON {"texto": "..."} (lo que arma Atajos) o texto plano.
  if ((request.headers.get("content-type") ?? "").includes("json")) {
    try {
      const datos = JSON.parse(cuerpo) as { texto?: unknown };
      texto = typeof datos.texto === "string" ? datos.texto : "";
    } catch {
      return respuesta(400, "No pude leer lo que enviaste.");
    }
  }
  texto = texto.replace(/\s+/g, " ").trim().slice(0, 300);
  if (!texto) return respuesta(400, MENSAJES.SIN_TEXTO[1]);

  // Entiende "mañana a las 5 pagar la luz #casa !!" igual que la captura rápida.
  const c = interpretarCaptura(texto, hoyLima());
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc("capturar_con_clave", {
    p_clave: clave,
    p_titulo: c.titulo || texto,
    p_fecha: c.fecha ?? undefined,
    p_hora: c.hora ?? undefined,
    p_prioridad: c.prioridad,
    p_lista: c.lista ?? undefined,
  });
  if (error) {
    const conocido = Object.keys(MENSAJES).find((k) => error.message.includes(k));
    const [estado, mensaje] = conocido ? MENSAJES[conocido] : [500, "No se pudo anotar. Intenta de nuevo."];
    return respuesta(estado, mensaje);
  }
  return respuesta(200, `Anotado en Orbe: ${data}`);
}
