// Tareas capturadas sin conexión: se guardan en el teléfono y se envían solas al volver internet.
// Solo texto (lo mismo que escribiste en la captura). Se borran al enviarse o al cerrar sesión.

import type { EstadoCaptura } from "@/app/acciones/tipos";

const CLAVE = "orbe:pendientes";
export const EVENTO_PENDIENTES = "orbe:pendientes";
const MAXIMO = 100;

export type Pendiente = { id: string; texto: string; lista_id?: string; fecha_defecto?: string; capturado_el: string };

type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const almacenPorDefecto = (): Almacen | null => (typeof localStorage === "undefined" ? null : localStorage);

const esPendiente = (x: unknown): x is Pendiente =>
  typeof x === "object" &&
  x !== null &&
  typeof (x as Pendiente).id === "string" &&
  typeof (x as Pendiente).texto === "string" &&
  (x as Pendiente).texto.length <= 300 &&
  typeof (x as Pendiente).capturado_el === "string";

export function leerPendientes(almacen = almacenPorDefecto()): Pendiente[] {
  try {
    const lista = JSON.parse(almacen?.getItem(CLAVE) ?? "[]");
    return Array.isArray(lista) ? lista.filter(esPendiente).slice(0, MAXIMO) : [];
  } catch {
    return [];
  }
}

function escribir(lista: Pendiente[], almacen: Almacen | null) {
  try {
    if (lista.length === 0) almacen?.removeItem(CLAVE);
    else almacen?.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Sin espacio o almacenamiento bloqueado: no se puede guardar sin conexión.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_PENDIENTES));
}

/** Guarda una captura para enviarla después. false si ya hay demasiadas esperando. */
export function agregarPendiente(p: Omit<Pendiente, "id">, almacen = almacenPorDefecto()): boolean {
  const lista = leerPendientes(almacen);
  if (lista.length >= MAXIMO || !p.texto.trim()) return false;
  lista.push({ ...p, texto: p.texto.slice(0, 300), id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  escribir(lista, almacen);
  return leerPendientes(almacen).length === lista.length;
}

export function olvidarPendientes(almacen = almacenPorDefecto()) {
  escribir([], almacen);
}

let enviando = false;

/**
 * Envía lo pendiente, en orden. Si falla la red, se detiene y lo deja para después.
 * Si el servidor la rechaza (texto vacío, tope de tareas), se descarta para no reintentar sin fin.
 */
export async function enviarPendientes(
  capturar: (anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>,
  almacen = almacenPorDefecto(),
): Promise<number> {
  if (enviando) return 0;
  enviando = true;
  let enviadas = 0;
  try {
    for (const p of leerPendientes(almacen)) {
      const datos = new FormData();
      datos.set("texto", p.texto);
      datos.set("capturado_el", p.capturado_el);
      if (p.lista_id) datos.set("lista_id", p.lista_id);
      if (p.fecha_defecto) datos.set("fecha_defecto", p.fecha_defecto);
      let resultado: EstadoCaptura;
      try {
        resultado = await capturar({ ok: false, n: 0 }, datos);
      } catch {
        break; // sin red: se intenta al volver
      }
      if (resultado.ok) enviadas++;
      escribir(
        leerPendientes(almacen).filter((x) => x.id !== p.id),
        almacen,
      );
    }
  } finally {
    enviando = false;
  }
  return enviadas;
}
