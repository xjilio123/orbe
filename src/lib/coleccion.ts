import type { ColorLista } from "./tareas";

// Checklists reutilizables y biblioteca (libros, series, cursos…): cálculos puros.

export type Checklist = { id: string; nombre: string; icono: string; color: ColorLista; hechos: number; total: number };
export type ItemChecklist = { id: string; texto: string; hecho: boolean; orden: number };

/** Lo que falta arriba (en el orden en que lo anotaste) y lo marcado abajo. */
export function ordenarItems(items: ItemChecklist[]): ItemChecklist[] {
  return [...items].sort((a, b) => Number(a.hecho) - Number(b.hecho) || a.orden - b.orden || a.id.localeCompare(b.id));
}

export const TIPOS_BIBLIOTECA = {
  libro: { nombre: "Libro", emoji: "📚", unidad: "páginas" },
  serie: { nombre: "Serie", emoji: "📺", unidad: "episodios" },
  pelicula: { nombre: "Película", emoji: "🎬", unidad: "minutos" },
  curso: { nombre: "Curso", emoji: "🎓", unidad: "lecciones" },
  podcast: { nombre: "Podcast", emoji: "🎧", unidad: "episodios" },
} as const;
export type TipoBiblioteca = keyof typeof TIPOS_BIBLIOTECA;

export const ESTADOS_BIBLIOTECA = {
  en_curso: "En curso",
  quiero: "Quiero ver o leer",
  terminado: "Terminados",
  abandonado: "Abandonados",
} as const;
export type EstadoBiblioteca = keyof typeof ESTADOS_BIBLIOTECA;

export type Obra = {
  id: string;
  titulo: string;
  autor: string;
  tipo: TipoBiblioteca;
  estado: EstadoBiblioteca;
  progreso: number;
  total: number | null;
  nota: number | null;
  resena: string;
  terminado_en: string | null;
};

export const esTipo = (t: string): t is TipoBiblioteca => t in TIPOS_BIBLIOTECA;
export const esEstado = (e: string): e is EstadoBiblioteca => e in ESTADOS_BIBLIOTECA;

export function fraccionObra(o: Obra): number {
  if (o.estado === "terminado") return 1;
  if (!o.total) return 0;
  return Math.min(1, Math.max(0, o.progreso / o.total));
}

/** "120 de 260 páginas", "Episodio 4", "Terminado el 12 oct". */
export function textoProgreso(o: Obra): string {
  const unidad = TIPOS_BIBLIOTECA[o.tipo].unidad;
  if (o.estado === "terminado") return o.terminado_en ? `Terminado el ${Number(o.terminado_en.slice(8))} ${MESES[Number(o.terminado_en.slice(5, 7)) - 1]}` : "Terminado";
  if (o.total) return `${o.progreso} de ${o.total} ${unidad}`;
  if (o.progreso > 0) return `Vas en ${o.progreso} ${unidad}`;
  return o.estado === "quiero" ? "Pendiente" : "Sin empezar";
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

/** Lo terminado este año, por tipo (para el resumen de arriba). */
export function resumenAnio(obras: Obra[], anio: number) {
  const terminadas = obras.filter((o) => o.estado === "terminado" && o.terminado_en?.startsWith(String(anio)));
  return {
    total: terminadas.length,
    porTipo: (Object.keys(TIPOS_BIBLIOTECA) as TipoBiblioteca[])
      .map((t) => ({ tipo: t, ...TIPOS_BIBLIOTECA[t], cantidad: terminadas.filter((o) => o.tipo === t).length }))
      .filter((x) => x.cantidad > 0),
  };
}
