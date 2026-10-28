"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import type { AccionesColeccion } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { BotonQuitar } from "@/components/progreso/BotonQuitar";
import { ordenarItems, type ItemChecklist } from "@/lib/coleccion";

type Props = {
  checklistId: string;
  items: ItemChecklist[];
  acciones: Pick<AccionesColeccion, "agregarItem" | "alternarItem" | "eliminarItem" | "desmarcarTodo">;
};

type Cambio = { tipo: "alternar"; id: string } | { tipo: "agregar"; item: ItemChecklist } | { tipo: "desmarcar" };

/** Los ítems de una checklist: marcar es instantáneo; "Desmarcar todo" la deja lista para reusar. */
export function ItemsChecklist({ checklistId, items, acciones }: Props) {
  const [lista, cambiar] = useOptimistic(items, (actual: ItemChecklist[], c: Cambio) => {
    if (c.tipo === "alternar") return actual.map((i) => (i.id === c.id ? { ...i, hecho: !i.hecho } : i));
    if (c.tipo === "agregar") return [...actual, c.item];
    return actual.map((i) => ({ ...i, hecho: false }));
  });
  const [, iniciar] = useTransition();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const hechos = lista.filter((i) => i.hecho).length;

  const conAviso = (trabajo: () => Promise<unknown>) =>
    iniciar(async () => {
      try {
        const r = await trabajo();
        if (r && typeof r === "object" && "ok" in r && !r.ok) setError((r as { error?: string }).error ?? "No se pudo guardar.");
      } catch {
        setError("Sin conexión: no se guardó.");
      }
    });

  function agregar() {
    const limpio = texto.trim();
    if (!limpio) return campo.current?.focus();
    setTexto("");
    setError(null);
    conAviso(async () => {
      cambiar({ tipo: "agregar", item: { id: `nuevo-${Date.now()}`, texto: limpio, hecho: false, orden: Number.MAX_SAFE_INTEGER } });
      return acciones.agregarItem(checklistId, limpio);
    });
    campo.current?.focus();
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          agregar();
        }}
        className="flex items-center gap-2 rounded-[18px] bg-superficie py-1.5 pr-1.5 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-verde-relleno/40"
      >
        <label htmlFor="nuevo-item" className="sr-only">
          Agregar a la lista
        </label>
        <input
          id="nuevo-item"
          ref={campo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={200}
          autoComplete="off"
          enterKeyHint="done"
          placeholder="Agregar: pan, cargador…"
          className="min-w-0 flex-1 bg-transparent py-2 text-[17px] outline-none placeholder:text-texto-2"
        />
        <button type="submit" aria-label="Agregar" className="grid size-9 shrink-0 place-items-center rounded-full bg-verde-relleno text-white active:scale-95">
          <Icono nombre="mas" className="size-5" />
        </button>
      </form>

      <div className="flex items-center justify-between px-1">
        <p className="text-[15px] text-texto-2" aria-live="polite">
          {lista.length === 0 ? "Lista vacía" : `${hechos} de ${lista.length} marcados`}
        </p>
        <button
          type="button"
          disabled={hechos === 0}
          onClick={() => {
            setError(null);
            conAviso(async () => {
              cambiar({ tipo: "desmarcar" });
              await acciones.desmarcarTodo(checklistId);
            });
          }}
          className="rounded-full bg-control px-3 py-1.5 text-[14px] font-semibold text-azul active:scale-95 disabled:opacity-40"
        >
          Desmarcar todo
        </button>
      </div>

      {lista.length > 0 && (
        <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
          {ordenarItems(lista).map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-1 pr-1 pl-4">
              <button
                type="button"
                role="checkbox"
                aria-checked={i.hecho}
                aria-label={`${i.texto}: ${i.hecho ? "marcado" : "sin marcar"}`}
                onClick={() => {
                  setError(null);
                  conAviso(async () => {
                    cambiar({ tipo: "alternar", id: i.id });
                    await acciones.alternarItem(i.id, !i.hecho);
                  });
                }}
                className="flex min-h-11 flex-1 items-center gap-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${i.hecho ? "border-verde-relleno bg-verde-relleno text-white" : "border-separador"}`}
                >
                  {i.hecho && <Icono nombre="check" className="size-4" />}
                </span>
                <span className={`text-[17px] ${i.hecho ? "text-texto-2 line-through" : ""}`}>{i.texto}</span>
              </button>
              {!i.id.startsWith("nuevo-") && <BotonQuitar id={i.id} nombre={i.texto} accion={acciones.eliminarItem} />}
            </li>
          ))}
        </ul>
      )}
      <p className="h-5 px-1 text-[13px] text-rojo" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
