import { esDeTexto, type Bloque } from "./bloques";
import { diaSemana, sumarDias } from "./fechas";

// Modo estudio (tarjetas para repasar) y diario con estado de ánimo: cálculos puros.

export type Tarjeta = { id: string; pregunta: string; respuesta: string; pagina: string };

/**
 * Tarjetas de una página: cada "Título 3" es una pregunta y el texto que la sigue (hasta el próximo
 * título o separador) es la respuesta. Es el formato que crea "Tarjetas de estudio" con IA.
 */
export function tarjetasDe(bloques: Bloque[], pagina = ""): Tarjeta[] {
  const tarjetas: Tarjeta[] = [];
  let actual: { id: string; pregunta: string; partes: string[] } | null = null;
  const cerrar = () => {
    if (actual && actual.partes.length) {
      tarjetas.push({ id: actual.id, pregunta: actual.pregunta, respuesta: actual.partes.join("\n"), pagina });
    }
    actual = null;
  };
  for (const b of bloques) {
    if (b.tipo === "h3") {
      cerrar();
      const pregunta = b.texto.replace(/^\s*\d+[.)]\s*/, "").trim();
      if (pregunta) actual = { id: b.id, pregunta, partes: [] };
    } else if (b.tipo === "separador" || b.tipo === "h1" || b.tipo === "h2") {
      cerrar();
    } else if (actual && esDeTexto(b.tipo) && b.texto.trim()) {
      const prefijo = b.tipo === "lista" || b.tipo === "num" ? "• " : "";
      actual.partes.push(prefijo + b.texto.trim());
    }
  }
  cerrar();
  return tarjetas;
}

/** ¿Es una página de tarjetas? (las que crea la IA, o cualquiera cuyo título empiece con "Tarjetas"). */
export const esPaginaDeTarjetas = (titulo: string) => /^tarjetas\b/i.test(titulo.trim());

/** Mezcla con una semilla: el mismo orden para la misma semilla (sin Math.random en el servidor). */
export function mezclar<T>(lista: T[], semilla: number): T[] {
  const copia = [...lista];
  let s = semilla >>> 0 || 1;
  for (let i = copia.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ---------- Diario ----------

export const ANIMOS = [
  { valor: 1, emoji: "😞", nombre: "Muy mal", clase: "bg-rojo-relleno" },
  { valor: 2, emoji: "😕", nombre: "Mal", clase: "bg-naranja-relleno" },
  { valor: 3, emoji: "😐", nombre: "Normal", clase: "bg-celeste-relleno" },
  { valor: 4, emoji: "🙂", nombre: "Bien", clase: "bg-azul-relleno" },
  { valor: 5, emoji: "😄", nombre: "Muy bien", clase: "bg-verde-relleno" },
] as const;

export type DiaDiario = { fecha: string; animo: number | null; pagina_id: string | null };

export const animo = (valor: number | null | undefined) => ANIMOS.find((a) => a.valor === valor) ?? null;

/** Celdas del mes (lunes a domingo); null = hueco antes del día 1 o después del último. */
export function celdasDelMes(mes: string): (string | null)[] {
  const primero = `${mes.slice(0, 7)}-01`;
  const huecos = (diaSemana(primero) + 6) % 7;
  const celdas: (string | null)[] = Array.from({ length: huecos }, () => null);
  for (let d = primero; d.slice(0, 7) === primero.slice(0, 7); d = sumarDias(d, 1)) celdas.push(d);
  while (celdas.length % 7) celdas.push(null);
  return celdas;
}

/** Resumen del mes: días anotados, promedio y cuántos días de cada ánimo. */
export function resumenAnimo(dias: DiaDiario[]) {
  const conAnimo = dias.filter((d) => d.animo !== null);
  const promedio = conAnimo.length ? conAnimo.reduce((s, d) => s + (d.animo ?? 0), 0) / conAnimo.length : null;
  const conteo = ANIMOS.map((a) => ({ ...a, dias: conAnimo.filter((d) => d.animo === a.valor).length }));
  return {
    registrados: conAnimo.length,
    escritos: dias.filter((d) => d.pagina_id).length,
    promedio: promedio === null ? null : Math.round(promedio * 10) / 10,
    emojiPromedio: promedio === null ? null : animo(Math.round(promedio))?.emoji ?? null,
    conteo,
    maximo: Math.max(1, ...conteo.map((c) => c.dias)),
  };
}

/** "2026-10" ± n meses. */
export function moverMesDiario(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const nombreMesDiario = (mes: string) => `${MESES[Number(mes.slice(5, 7)) - 1]} ${mes.slice(0, 4)}`;

/** Título de la página del diario: "28 oct 2026 · miércoles". */
export function tituloDiario(fecha: string): string {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const cortos = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
  return `${Number(fecha.slice(8, 10))} ${cortos[Number(fecha.slice(5, 7)) - 1]} ${fecha.slice(0, 4)} · ${dias[diaSemana(fecha)]}`;
}

export type CursoResumen = {
  id: string;
  titulo: string;
  icono: string;
  temas: number;
  tarjetas: number;
  examen: { titulo: string; fecha: string } | null;
};
