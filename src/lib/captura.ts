import { diaSemana, sumarDias } from "./fechas";
import { limpiarPlazo } from "./plazo";
import type { Repetir } from "./repeticion";

/**
 * Captura rápida SIN IA: entiende frases comunes en español y deja el resto como título.
 *   "Pagar luz el viernes 9am #casa !!" → título "Pagar luz", viernes 09:00, lista "casa", prioridad 2.
 *   "Clase mañana de 3 a 5 pm" → mañana de 15:00 a 17:00. "Viaje del 10 al 15 de noviembre" → del 10 al 15.
 * Corre en el teléfono (vista previa) y en el servidor (al guardar), así que no puede depender de nada externo.
 */

export type Captura = {
  titulo: string;
  fecha: string | null; // AAAA-MM-DD (inicio)
  hora: string | null; // HH:MM (inicio)
  fecha_fin: string | null; // vacía = termina el mismo día
  hora_fin: string | null;
  prioridad: 0 | 1 | 2 | 3;
  lista: string | null;
  repetir: Repetir | null;
};

const DIAS: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const MESES: Record<string, number> = {
  enero: 1, ene: 1, febrero: 2, feb: 2, marzo: 3, mar: 3, abril: 4, abr: 4, mayo: 5, may: 5, junio: 6, jun: 6,
  julio: 7, jul: 7, agosto: 8, ago: 8, septiembre: 9, setiembre: 9, sept: 9, sep: 9, set: 9, octubre: 10, oct: 10,
  noviembre: 11, nov: 11, diciembre: 12, dic: 12,
};

/** Minúsculas y sin tildes, conservando la longitud para poder recortar el texto original. */
const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const dos = (n: number) => String(n).padStart(2, "0");

function fechaValida(anio: number, mes: number, dia: number): string | null {
  const f = new Date(Date.UTC(anio, mes - 1, dia));
  if (f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== dia) return null;
  return `${anio}-${dos(mes)}-${dos(dia)}`;
}

/** Día y mes sin año: el próximo que venga (hoy cuenta). */
function proximaFecha(dia: number, mes: number, hoy: string): string | null {
  const anio = Number(hoy.slice(0, 4));
  const este = fechaValida(anio, mes, dia);
  if (este && este >= hoy) return este;
  return fechaValida(anio + 1, mes, dia);
}

/** "El 15": este mes si todavía no pasa, si no el mes que viene. */
function proximoDia(dia: number, hoy: string): string | null {
  const [anio, mes] = hoy.split("-").map(Number);
  const este = fechaValida(anio, mes, dia);
  if (este && este >= hoy) return este;
  return mes === 12 ? fechaValida(anio + 1, 1, dia) : fechaValida(anio, mes + 1, dia);
}

const NOMBRES_DIAS = "domingo|lunes|martes|miercoles|jueves|viernes|sabado";
const NOMBRES_MESES = Object.keys(MESES).join("|");
/** Una fecha suelta dentro de un rango: "hoy", "el lunes", "15/11", "15 de noviembre" o "15". */
const UNA_FECHA = `(?:hoy|pasado manana|manana|(?:el )?(?:${NOMBRES_DIAS})|\\d{1,2}[/-]\\d{1,2}(?:[/-]\\d{2,4})?|\\d{1,2}(?: de)? (?:${NOMBRES_MESES})|(?:el )?\\d{1,2})`;

/**
 * Lee una fecha suelta. `desde` es el día de referencia: para el fin de un rango es el inicio
 * (y ese mismo día cuenta); para el inicio es hoy (y "el lunes" siendo lunes es el de la otra semana).
 */
function leerFecha(texto: string, hoy: string, desde: string, mismoDiaCuenta: boolean): string | null {
  const t = texto.replace(/^el /, "");
  if (t === "hoy") return hoy;
  if (t === "manana") return sumarDias(hoy, 1);
  if (t === "pasado manana") return sumarDias(hoy, 2);
  if (t in DIAS) {
    const dif = (DIAS[t] - diaSemana(desde) + 7) % 7;
    return sumarDias(desde, mismoDiaCuenta ? dif : dif || 7);
  }
  let m = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/.exec(t);
  if (m) {
    const [dia, mes] = [Number(m[1]), Number(m[2])];
    return m[3] ? fechaValida(m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]), mes, dia) : proximaFecha(dia, mes, desde);
  }
  m = /^(\d{1,2})(?: de)? (\p{L}+)$/u.exec(t);
  if (m && m[2] in MESES) return proximaFecha(Number(m[1]), MESES[m[2]], desde);
  m = /^(\d{1,2})$/.exec(t);
  return m ? proximoDia(Number(m[1]), desde) : null;
}

/** "del 10 al 15 de noviembre": el 10 también es de noviembre (o del mes anterior si es mayor que 15). */
function inicioConMesDelFin(dia: number, fin: string): string | null {
  const [anio, mes] = fin.split("-").map(Number);
  if (dia <= Number(fin.slice(8))) return fechaValida(anio, mes, dia);
  return mes === 1 ? fechaValida(anio - 1, 12, dia) : fechaValida(anio, mes - 1, dia);
}

const SUFIJO = "(am|pm|a\\.\\s?m\\.|p\\.\\s?m\\.|h(?:rs)?)";
const UNA_HORA = `(\\d{1,2})(?::(\\d{2}))?\\s*${SUFIJO}?(?: de la (manana|tarde|noche))?`;

type Regla = { patron: RegExp; aplicar: (m: RegExpExecArray, r: Captura, hoy: string) => boolean };

const B = "(?<![\\p{L}\\p{N}])"; // inicio de palabra (sirve con letras con tilde)
const E = "(?![\\p{L}\\p{N}])"; // fin de palabra

function hora24(h: number, min: number, sufijo: string | undefined, parte: string | undefined): string | null {
  if (min > 59) return null;
  let hh = h;
  const pm = sufijo?.startsWith("p") || parte === "tarde" || parte === "noche";
  const am = sufijo?.startsWith("a") || parte === "manana";
  if (pm && hh < 12) hh += 12;
  else if (am && hh === 12) hh = 0;
  // "a las 5" sin más: de 1 a 7 casi siempre es de la tarde.
  else if (!pm && !am && hh >= 1 && hh <= 7) hh += 12;
  if (hh > 23) return null;
  return `${dos(hh)}:${dos(min)}`;
}

const dosDigitos = (h: number, min: number) => `${dos(h)}:${dos(min)}`;

/** Una hora de un rango: si dice am/pm, "h" o "de la tarde" es una sola; si no, puede ser de mañana o de tarde. */
function opcionesHora(h: number, min: number, sufijoCrudo: string | undefined, parte: string | undefined): string[] {
  if (min > 59 || h > 23) return [];
  const sufijo = sufijoCrudo?.replace(/[.\s]/g, "");
  if (sufijo === "h" || sufijo === "hrs" || h === 0 || h >= 13) return [dosDigitos(h, min)];
  if (sufijo || parte) {
    const una = hora24(h, min, sufijo, parte);
    return una ? [una] : [];
  }
  return h === 12 ? [dosDigitos(12, min)] : [dosDigitos(h, min), dosDigitos(h + 12, min)];
}

/**
 * "de 3 a 5" → 15:00–17:00; "de 9 a 11" → 9:00–11:00; "de 11 a 1 pm" → 11:00–13:00; "de 8 a 10 pm" → 20:00–22:00.
 * El lado que no dice am/pm se elige para que el rango sea corto y vaya en orden.
 */
function aplicarRangoHoras(m: RegExpExecArray, r: Captura): boolean {
  const a = opcionesHora(Number(m[1]), Number(m[2] ?? 0), m[3], m[4]);
  const b = opcionesHora(Number(m[5]), Number(m[6] ?? 0), m[7], m[8]);
  if (!a.length || !b.length) return false;
  let inicio: string;
  let fin: string;
  if (a.length === 1) {
    inicio = a[0];
    fin = b.find((x) => x > inicio) ?? b[0];
  } else if (b.length === 1) {
    fin = b[0];
    inicio = [...a].reverse().find((x) => x < fin) ?? a[0];
  } else {
    inicio = hora24(Number(m[1]), Number(m[2] ?? 0), undefined, undefined) ?? a[0];
    fin = b.find((x) => x > inicio) ?? b[0];
  }
  r.hora = inicio;
  r.hora_fin = fin;
  return true;
}

const REGLAS: Regla[] = [
  // Prioridad: !, !!, !!! o palabras
  {
    patron: new RegExp(`(?:^|\\s)(!{1,3})(?=\\s|$)`, "u"),
    aplicar: (m, r) => ((r.prioridad = m[1].length as 1 | 2 | 3), true),
  },
  {
    patron: new RegExp(`${B}(urgente|importante)${E}`, "u"),
    aplicar: (m, r) => ((r.prioridad = Math.max(r.prioridad, m[1] === "urgente" ? 3 : 2) as 2 | 3), true),
  },
  // Lista: #nombre
  {
    patron: /(?:^|\s)#([\p{L}\p{N}_-]{1,40})/u,
    aplicar: (m, r) => ((r.lista = m[1]), true),
  },
  // Repetición: "todos los lunes", "de lunes a viernes", "cada día", "cada mes", "todos los años"
  {
    patron: new RegExp(`${B}(?:todos los|todas las|cada) (domingo|lunes|martes|miercoles|jueves|viernes|sabado)s?${E}`, "u"),
    aplicar: (m, r, hoy) => {
      r.repetir = "semanal";
      r.fecha = sumarDias(hoy, (DIAS[m[1]] - diaSemana(hoy) + 7) % 7); // hoy cuenta
      return true;
    },
  },
  {
    patron: new RegExp(`${B}(?:de lunes a viernes|(?:todos los |cada )?dias? laborables?|entre semana)${E}`, "u"),
    aplicar: (_m, r) => ((r.repetir = "laborables"), true),
  },
  {
    patron: new RegExp(`${B}(?:todos los dias|cada dia|a diario|diariamente)${E}`, "u"),
    aplicar: (_m, r) => ((r.repetir = "diaria"), true),
  },
  {
    patron: new RegExp(`${B}(?:todas las semanas|cada semana|semanalmente)${E}`, "u"),
    aplicar: (_m, r) => ((r.repetir = "semanal"), true),
  },
  {
    patron: new RegExp(`${B}(?:todos los meses|cada mes|mensualmente)${E}`, "u"),
    aplicar: (_m, r) => ((r.repetir = "mensual"), true),
  },
  {
    patron: new RegExp(`${B}(?:todos los anos|cada ano|anualmente)${E}`, "u"),
    aplicar: (_m, r) => ((r.repetir = "anual"), true),
  },
  // Rango de horas: "de 3 a 5 pm", "desde las 9 hasta las 11", "entre las 3 y las 5", "de 15:00 a 17:00"
  {
    patron: new RegExp(`${B}(?:de|desde|entre) (?:las? )?${UNA_HORA}(?:\\s*[-–]\\s*|\\s+(?:a|hasta|y)\\s+)(?:las? )?${UNA_HORA}${E}`, "u"),
    aplicar: (m, r) => aplicarRangoHoras(m, r),
  },
  {
    patron: new RegExp(`${B}${UNA_HORA}\\s*[-–]\\s*${UNA_HORA}${E}`, "u"),
    // Sin "de": solo si dice am/pm o lleva minutos ("3-5" a secas es una fecha: el 3 de mayo).
    aplicar: (m, r) => Boolean(m[2] || m[3] || m[6] || m[7]) && aplicarRangoHoras(m, r),
  },
  // Rango de días: "del lunes al miércoles", "del 10 al 15 de noviembre", "desde hoy hasta el viernes"
  {
    patron: new RegExp(`${B}(?:del|desde(?: el)?) (${UNA_FECHA}) (?:al|hasta(?: el)?) (${UNA_FECHA})${E}`, "u"),
    aplicar: (m, r, hoy) => {
      const soloDia = /^(?:el )?(\d{1,2})$/.exec(m[1]);
      const finConMes = soloDia && !/^(?:el )?\d{1,2}$/.test(m[2]) ? leerFecha(m[2], hoy, hoy, true) : null;
      const inicio = soloDia && finConMes ? inicioConMesDelFin(Number(soloDia[1]), finConMes) : leerFecha(m[1], hoy, hoy, false);
      if (!inicio) return false;
      const fin = finConMes ?? leerFecha(m[2], hoy, inicio, true);
      if (!fin || fin < inicio) return false;
      r.fecha = inicio;
      r.fecha_fin = fin;
      return true;
    },
  },
  // Solo el fin: "hasta el viernes", "hasta el 15 de noviembre" (empieza hoy o el día que se diga)
  {
    patron: new RegExp(`${B}hasta (?:el )?(${UNA_FECHA})${E}`, "u"),
    aplicar: (m, r, hoy) => {
      // "hasta 5" a secas no es una fecha (puede ser una hora o una cantidad).
      if (/^\d{1,2}$/.test(m[1]) && !m[0].includes(" el ")) return false;
      const fin = leerFecha(m[1], hoy, hoy, true);
      if (!fin) return false;
      r.fecha_fin = fin;
      return true;
    },
  },
  // Hora: "a las 5 de la tarde", "a las 17:30", "9am", "9:15 pm", "17h"
  {
    patron: new RegExp(
      `${B}(?:a las |a la |las )?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm|a\\.\\s?m\\.|p\\.\\s?m\\.|h(?:rs)?)?(?: de la (manana|tarde|noche))?${E}`,
      "u",
    ),
    aplicar: (m, r) => {
      const conMarca = m[0].includes("las") || m[0].includes("la ") || m[2] || m[3] || m[4];
      if (!conMarca) return false; // un número suelto ("comprar 3 panes") no es una hora
      const sufijo = m[3]?.replace(/[.\s]/g, "");
      const hora = hora24(Number(m[1]), Number(m[2] ?? 0), sufijo === "h" || sufijo === "hrs" ? "24" : sufijo, m[4]);
      if (!hora) return false;
      r.hora = hora;
      return true;
    },
  },
  // Relativas: "pasado mañana", "mañana", "hoy", "en 3 días", "en una semana"
  { patron: new RegExp(`${B}pasado manana${E}`, "u"), aplicar: (_m, r, hoy) => ((r.fecha = sumarDias(hoy, 2)), true) },
  {
    // "mañana" como día; "por/en la mañana" es una parte del día y no cambia la fecha.
    patron: new RegExp(`(?<!la )${B}manana${E}`, "u"),
    aplicar: (_m, r, hoy) => ((r.fecha = sumarDias(hoy, 1)), true),
  },
  { patron: new RegExp(`${B}hoy${E}`, "u"), aplicar: (_m, r, hoy) => ((r.fecha = hoy), true) },
  {
    patron: new RegExp(`${B}en (\\d{1,3}|un|una|dos|tres) (dia|dias|semana|semanas)${E}`, "u"),
    aplicar: (m, r, hoy) => {
      const n = { un: 1, una: 1, dos: 2, tres: 3 }[m[1]] ?? Number(m[1]);
      r.fecha = sumarDias(hoy, m[2].startsWith("semana") ? n * 7 : n);
      return true;
    },
  },
  // Día de la semana: "el viernes", "este lunes", "próximo martes"
  {
    patron: new RegExp(`${B}(?:el |este |proximo |prox )?(domingo|lunes|martes|miercoles|jueves|viernes|sabado)${E}`, "u"),
    aplicar: (m, r, hoy) => {
      const dif = (DIAS[m[1]] - diaSemana(hoy) + 7) % 7 || 7; // el mismo día de hoy → la próxima semana
      r.fecha = sumarDias(hoy, dif);
      return true;
    },
  },
  // Fecha: "15/11", "15-11-2026", "15 de noviembre", "15 nov", "el 15"
  {
    patron: /(?<![\p{L}\p{N}/])(?:el )?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?![\p{L}\p{N}/])/u,
    aplicar: (m, r, hoy) => {
      const dia = Number(m[1]);
      const mes = Number(m[2]);
      const fecha = m[3]
        ? fechaValida(m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]), mes, dia)
        : proximaFecha(dia, mes, hoy);
      if (!fecha) return false;
      r.fecha = fecha;
      return true;
    },
  },
  {
    patron: new RegExp(`${B}(?:el )?(\\d{1,2})(?: de)? (${Object.keys(MESES).join("|")})${E}`, "u"),
    aplicar: (m, r, hoy) => {
      const fecha = proximaFecha(Number(m[1]), MESES[m[2]], hoy);
      if (!fecha) return false;
      r.fecha = fecha;
      return true;
    },
  },
  {
    patron: new RegExp(`${B}el (\\d{1,2})${E}`, "u"),
    aplicar: (m, r, hoy) => {
      const elegida = proximoDia(Number(m[1]), hoy);
      if (!elegida) return false;
      r.fecha = elegida;
      return true;
    },
  },
];

/** Palabras que quedan sueltas al final tras quitar una fecha ("pagar luz el" → "pagar luz"). */
const CONECTORES_FINALES = /(?:\s+(?:el|la|a|para|de|del|en|por|las|este|al))+$/iu;

/** `porDefecto`: fecha para lo que se escribe sin fecha (en la Agenda, el día que estás mirando). */
export function interpretarCaptura(texto: string, hoy: string, porDefecto?: string): Captura {
  const r: Captura = { titulo: "", fecha: null, hora: null, fecha_fin: null, hora_fin: null, prioridad: 0, lista: null, repetir: null };
  let original = texto.replace(/\s+/g, " ").trim().slice(0, 300);

  for (const regla of REGLAS) {
    const normal = normalizar(original);
    const m = regla.patron.exec(normal);
    if (!m || !regla.aplicar(m, r, hoy)) continue;
    // Se recorta del texto ORIGINAL (mismas posiciones: normalizar no cambia la longitud).
    original = `${original.slice(0, m.index)} ${original.slice(m.index + m[0].length)}`.replace(/\s+/g, " ").trim();
  }

  const titulo = original.replace(CONECTORES_FINALES, "").replace(/^[\s,;:-]+|[\s,;:-]+$/g, "").trim();
  r.titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  if (!r.fecha && porDefecto) r.fecha = porDefecto;
  if ((r.hora || r.repetir || r.fecha_fin) && !r.fecha) {
    // "llamar a las 5" → hoy a las 5. "cada día" → empieza hoy (o el lunes, si es de lunes a viernes y hoy es fin de semana).
    // "hasta el viernes" → de hoy al viernes.
    const dia = diaSemana(hoy);
    r.fecha = r.repetir === "laborables" && (dia === 0 || dia === 6) ? sumarDias(hoy, dia === 6 ? 2 : 1) : hoy;
  }
  // "de 10 pm a 2 am" pasa la medianoche: termina al día siguiente.
  if (r.fecha && r.hora && r.hora_fin && !r.fecha_fin && r.hora_fin <= r.hora) r.fecha_fin = sumarDias(r.fecha, 1);
  return limpiarPlazo(r);
}
