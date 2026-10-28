"use client";

import { useTransition } from "react";
import { Icono } from "@/components/Icono";
import { ESTADOS, NOMBRE_ESTADO, type Estado } from "@/lib/tareas";

/** Flechas para pasar una tarjeta a la columna anterior o siguiente del tablero. */
export function MoverTarea({ id, estado, mover }: { id: string; estado: Estado; mover: (id: string, estado: string) => Promise<void> }) {
  const [moviendo, iniciar] = useTransition();
  const i = ESTADOS.indexOf(estado);
  const anterior = ESTADOS[i - 1];
  const siguiente = ESTADOS[i + 1];

  return (
    <div className="flex gap-1">
      {anterior && (
        <button
          type="button"
          disabled={moviendo}
          onClick={() => iniciar(() => mover(id, anterior))}
          aria-label={`Mover a ${NOMBRE_ESTADO[anterior]}`}
          className="grid size-8 place-items-center rounded-full bg-control text-texto-2 active:scale-90 disabled:opacity-40"
        >
          <Icono nombre="atras" className="size-4" />
        </button>
      )}
      {siguiente && (
        <button
          type="button"
          disabled={moviendo}
          onClick={() => iniciar(() => mover(id, siguiente))}
          aria-label={`Mover a ${NOMBRE_ESTADO[siguiente]}`}
          className="grid size-8 place-items-center rounded-full bg-control text-texto-2 active:scale-90 disabled:opacity-40"
        >
          <Icono nombre="adelante" className="size-4" />
        </button>
      )}
    </div>
  );
}
