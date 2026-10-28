import { describe, expect, it } from "vitest";
import { leerIcs, normalizarUrlCalendario } from "./calendario";

// Calendario como lo exporta Google (recortado): zona de Lima, un evento con hora, uno de todo el día,
// una reunión semanal con una vez movida y otra cancelada, y un evento cancelado.
const ICS = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Google Inc//Google Calendar 70.9054//EN",
  "BEGIN:VTIMEZONE",
  "TZID:America/Lima",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0500",
  "TZNAME:-05",
  "DTSTART:19700101T000000",
  "END:STANDARD",
  "END:VTIMEZONE",
  "BEGIN:VEVENT",
  "UID:dentista@google.com",
  "DTSTART;TZID=America/Lima:20261028T163000",
  "DTEND;TZID=America/Lima:20261028T171500",
  "SUMMARY:Dentista",
  "LOCATION:Av. Larco 123\\, Miraflores",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:utc@google.com",
  "DTSTART:20261029T140000Z",
  "DTEND:20261029T150000Z",
  "SUMMARY:Llamada con Prediqt",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:feriado@google.com",
  "DTSTART;VALUE=DATE:20261101",
  "DTEND;VALUE=DATE:20261103",
  "SUMMARY:Puente de Todos los Santos",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:daily@google.com",
  "DTSTART;TZID=America/Lima:20261005T090000",
  "DTEND;TZID=America/Lima:20261005T093000",
  "RRULE:FREQ=WEEKLY;BYDAY=MO",
  "EXDATE;TZID=America/Lima:20261102T090000",
  "SUMMARY:Daily del equipo",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:daily@google.com",
  "RECURRENCE-ID;TZID=America/Lima:20261026T090000",
  "DTSTART;TZID=America/Lima:20261026T110000",
  "DTEND;TZID=America/Lima:20261026T113000",
  "SUMMARY:Daily del equipo (movida)",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:cancelado@google.com",
  "DTSTART;TZID=America/Lima:20261030T100000",
  "DTEND;TZID=America/Lima:20261030T110000",
  "STATUS:CANCELLED",
  "SUMMARY:Cancelado",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("leerIcs", () => {
  const eventos = leerIcs(ICS, "2026-10-26", "2026-11-09");
  const resumen = eventos.map((e) => `${e.fecha} ${e.inicio ?? "todo el día"}${e.fin ? `-${e.fin}` : ""} ${e.titulo}`);

  it("lee eventos con hora en Lima, también los que vienen en UTC", () => {
    expect(resumen).toContain("2026-10-28 16:30-17:15 Dentista");
    expect(resumen).toContain("2026-10-29 09:00-10:00 Llamada con Prediqt");
    expect(eventos.find((e) => e.titulo === "Dentista")?.lugar).toBe("Av. Larco 123, Miraflores");
  });

  it("los de todo el día ocupan cada día hasta el anterior al fin", () => {
    expect(resumen).toContain("2026-11-01 todo el día Puente de Todos los Santos");
    expect(resumen).toContain("2026-11-02 todo el día Puente de Todos los Santos");
    expect(resumen.filter((r) => r.includes("Puente"))).toHaveLength(2);
  });

  it("expande las repeticiones con sus cambios y fechas quitadas", () => {
    const daily = resumen.filter((r) => r.includes("Daily"));
    expect(daily).toEqual(["2026-10-26 11:00-11:30 Daily del equipo (movida)", "2026-11-09 09:00-09:30 Daily del equipo"]);
  });

  it("no muestra eventos cancelados ni los que están fuera del rango", () => {
    expect(resumen.some((r) => r.includes("Cancelado"))).toBe(false);
    expect(leerIcs(ICS, "2026-12-01", "2026-12-07").map((e) => e.titulo)).toEqual(["Daily del equipo"]);
  });

  it("sale ordenado por fecha y hora", () => {
    expect([...resumen].sort()).toEqual(resumen);
  });
});

describe("normalizarUrlCalendario", () => {
  const buena = "https://calendar.google.com/calendar/ical/ana%40gmail.com/private-0123456789abcdef0123/basic.ics";

  it("acepta la dirección secreta de Google y la versión webcal://", () => {
    expect(normalizarUrlCalendario(`  ${buena} `)).toBe(buena);
    expect(normalizarUrlCalendario(buena.replace("https://", "webcal://"))).toBe(buena);
  });

  it("rechaza cualquier otro sitio (el servidor nunca descarga de otro lado)", () => {
    expect(normalizarUrlCalendario("https://evil.com/calendar/ical/x/public/basic.ics")).toBeNull();
    expect(normalizarUrlCalendario("https://calendar.google.com.evil.com/calendar/ical/ana/public/basic.ics")).toBeNull();
    expect(normalizarUrlCalendario("http://calendar.google.com/calendar/ical/ana%40gmail.com/public/basic.ics")).toBeNull();
    expect(normalizarUrlCalendario("https://169.254.169.254/latest/meta-data")).toBeNull();
  });
});
