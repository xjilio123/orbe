import "server-only";
import type { Evento } from "@/lib/agenda";
import { leerIcs, normalizarUrlCalendario } from "@/lib/calendario";
import { hoyLima, sumarDias } from "@/lib/fechas";

const MAX_BYTES = 5 * 1024 * 1024;
const VIGENCIA_MS = 10 * 60 * 1000;

// Caché en memoria por persona (10 min): volver a la Agenda no descarga el calendario otra vez.
// Guarda los eventos de una ventana amplia; si se navega más lejos, se lee solo ese rango.
const cache = new Map<string, { expira: number; url: string; desde: string; hasta: string; eventos: Evento[] }>();

async function descargar(url: string): Promise<string> {
  const respuesta = await fetch(url, {
    // Sin redirecciones: la dirección ya se validó y no se sigue a ningún otro sitio.
    redirect: "error",
    signal: AbortSignal.timeout(5000),
    headers: { Accept: "text/calendar" },
    cache: "no-store",
  });
  if (!respuesta.ok || !respuesta.body) throw new Error(`Google respondió ${respuesta.status}`);
  if (Number(respuesta.headers.get("content-length") ?? 0) > MAX_BYTES) throw new Error("Calendario demasiado grande");

  // Lee por partes y corta si pasa del máximo (aunque Google no diga el tamaño).
  const lector = respuesta.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await lector.cancel();
      throw new Error("Calendario demasiado grande");
    }
    partes.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(partes));
}

export type ResultadoCalendario = { eventos: Evento[]; error: boolean };

/** Eventos de Google Calendar entre dos fechas. Si falla, la Agenda se muestra igual (solo sin eventos). */
export async function eventosDeGoogle(usuario: string, urlGuardada: string | null, desde: string, hasta: string): Promise<ResultadoCalendario> {
  const url = urlGuardada ? normalizarUrlCalendario(urlGuardada) : null;
  if (!url) return { eventos: [], error: false };

  const filtrar = (eventos: Evento[]) => eventos.filter((e) => e.fecha >= desde && e.fecha <= hasta);
  const guardado = cache.get(usuario);
  if (guardado && guardado.url === url && guardado.expira > Date.now() && desde >= guardado.desde && hasta <= guardado.hasta) {
    return { eventos: filtrar(guardado.eventos), error: false };
  }

  try {
    const ics = await descargar(url);
    const hoy = hoyLima();
    const ventana = { desde: sumarDias(hoy, -62), hasta: sumarDias(hoy, 400) };
    if (desde >= ventana.desde && hasta <= ventana.hasta) {
      const eventos = leerIcs(ics, ventana.desde, ventana.hasta, 3000);
      if (cache.size > 60) cache.clear();
      cache.set(usuario, { expira: Date.now() + VIGENCIA_MS, url, ...ventana, eventos });
      return { eventos: filtrar(eventos), error: false };
    }
    return { eventos: leerIcs(ics, desde, hasta), error: false };
  } catch (e) {
    // Sin la dirección secreta en el registro.
    console.error("Google Calendar no disponible:", e instanceof Error ? e.message : "error");
    return { eventos: [], error: true };
  }
}

/** Al cambiar o quitar la dirección, se olvida lo guardado. */
export function olvidarCalendario(usuario: string) {
  cache.delete(usuario);
}
