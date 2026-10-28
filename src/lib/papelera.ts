// Papelera: lo borrado se guarda 30 días. Al borrar una tarea se van con ella sus subtareas, y al borrar
// una página, sus páginas internas; todas llevan la MISMA hora de borrado para restaurarse juntas.

export const DIAS_PAPELERA = 30;
const DIA_MS = 86_400_000;

export type EnPapelera = { id: string; padre_id: string | null; borrado_en: string };

/** Solo lo que se borró "a mano": no repite las subtareas o subpáginas que se fueron con su padre. */
export function raices<T extends EnPapelera>(items: T[]): T[] {
  const porId = new Map(items.map((i) => [i.id, i]));
  return items
    .filter((i) => {
      const padre = i.padre_id ? porId.get(i.padre_id) : undefined;
      return !padre || padre.borrado_en !== i.borrado_en;
    })
    .sort((a, b) => b.borrado_en.localeCompare(a.borrado_en));
}

/** Lo que se restaura junto con un elemento: él y sus descendientes borrados a la misma hora. */
export function grupo<T extends EnPapelera>(items: T[], id: string): string[] {
  const raiz = items.find((i) => i.id === id);
  if (!raiz) return [];
  const resultado = [id];
  for (let i = 0; i < resultado.length; i++) {
    for (const hijo of items) {
      if (hijo.padre_id === resultado[i] && hijo.borrado_en === raiz.borrado_en && !resultado.includes(hijo.id)) resultado.push(hijo.id);
    }
  }
  return resultado;
}

/** Días que le quedan antes de borrarse para siempre (mínimo 0). */
export function diasRestantes(borradoEn: string, ahora = new Date()): number {
  const pasados = (ahora.getTime() - Date.parse(borradoEn)) / DIA_MS;
  return Math.max(0, Math.ceil(DIAS_PAPELERA - pasados));
}

/** Fecha desde la cual lo borrado ya venció. */
export const limitePapelera = (ahora = new Date()) => new Date(ahora.getTime() - DIAS_PAPELERA * DIA_MS).toISOString();
