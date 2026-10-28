import ICAL from "ical.js";
import type { Evento } from "./agenda";
import { ZONA, sumarDias } from "./fechas";

// Google Calendar de solo lectura, con la "dirección secreta en formato iCal" de tu calendario.
// Sin permisos de Google ni tokens que caducan. Solo se aceptan direcciones de calendar.google.com,
// así el servidor nunca descarga nada de otro sitio (evita SSRF).

const PATRON_GOOGLE =
  /^https:\/\/calendar\.google\.com\/calendar\/ical\/[A-Za-z0-9%._@+-]{3,200}\/(public|private-[A-Za-z0-9]{16,64})\/basic\.ics$/;

/** Acepta también "webcal://", que es como a veces se copia la dirección. Devuelve null si no es de Google. */
export function normalizarUrlCalendario(texto: string): string | null {
  const url = texto.trim().replace(/^webcal:\/\//i, "https://");
  return PATRON_GOOGLE.test(url) ? url : null;
}

const formato = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Fecha y hora en Lima de un instante. */
function enLima(fecha: Date): { dia: string; hora: string } {
  const p = Object.fromEntries(formato.formatToParts(fecha).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

const texto = (valor: unknown, max: number) => (typeof valor === "string" ? valor.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Eventos del calendario entre dos fechas (Lima), con las repeticiones ya expandidas. */
export function leerIcs(ics: string, desde: string, hasta: string, maximo = 800): Evento[] {
  const raiz = new ICAL.Component(ICAL.parse(ics));
  for (const zona of raiz.getAllSubcomponents("vtimezone")) {
    try {
      ICAL.TimezoneService.register(zona);
    } catch {
      // Una zona horaria mal escrita no impide leer el resto.
    }
  }

  const inicioMs = Date.parse(`${desde}T05:00:00Z`); // 00:00 en Lima (UTC-5 todo el año)
  const finMs = Date.parse(`${sumarDias(hasta, 1)}T05:00:00Z`);
  const eventos: Evento[] = [];

  const agregar = (uid: string, item: ICAL.Event, inicio: ICAL.Time, fin: ICAL.Time | null) => {
    const titulo = texto(item.summary, 200) || "(Sin título)";
    const lugar = texto(item.location, 200) || null;
    if (inicio.isDate) {
      // Todo el día: de la fecha de inicio hasta el día anterior al fin (máximo un mes).
      const primero = inicio.toString().slice(0, 10);
      const ultimo = fin ? sumarDias(fin.toString().slice(0, 10), -1) : primero;
      for (let f = primero, n = 0; f <= ultimo && n < 31; f = sumarDias(f, 1), n++) {
        if (f >= desde && f <= hasta) eventos.push({ id: uid, titulo, fecha: f, inicio: null, fin: null, lugar });
      }
      return;
    }
    const ini = inicio.toJSDate();
    if (ini.getTime() < inicioMs || ini.getTime() >= finMs) return;
    const a = enLima(ini);
    const b = fin ? enLima(fin.toJSDate()) : null;
    eventos.push({ id: uid, titulo, fecha: a.dia, inicio: a.hora, fin: b && b.dia === a.dia ? b.hora : null, lugar });
  };

  const vevents = raiz.getAllSubcomponents("vevent");
  const principales = new Map<string, ICAL.Event>();
  for (const v of vevents) {
    if (v.hasProperty("recurrence-id")) continue;
    const e = new ICAL.Event(v);
    if (e.uid) principales.set(e.uid, e);
  }
  // Cambios a una sola vez de un evento que se repite (otra hora, otro título).
  for (const v of vevents) {
    if (!v.hasProperty("recurrence-id")) continue;
    const principal = principales.get(texto(v.getFirstPropertyValue("uid"), 500));
    if (principal) principal.relateException(v);
  }

  for (const [uid, e] of principales) {
    if (eventos.length >= maximo) break;
    if (texto(e.component.getFirstPropertyValue("status"), 20).toUpperCase() === "CANCELLED") continue;
    if (!e.isRecurring()) {
      agregar(uid, e, e.startDate, e.endDate);
      continue;
    }
    const iterador = e.iterator();
    for (let i = 0, t = iterador.next(); t && i < 5000 && eventos.length < maximo; i++, t = iterador.next()) {
      if (t.toJSDate().getTime() >= finMs) break;
      const vez = e.getOccurrenceDetails(t);
      if (texto(vez.item.component.getFirstPropertyValue("status"), 20).toUpperCase() === "CANCELLED") continue;
      if (vez.endDate.toJSDate().getTime() <= inicioMs) continue;
      agregar(uid, vez.item, vez.startDate, vez.endDate);
    }
  }

  return eventos.sort((x, y) => (x.fecha + (x.inicio ?? "")).localeCompare(y.fecha + (y.inicio ?? ""))).slice(0, maximo);
}
