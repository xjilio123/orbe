"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { AccionesProgreso } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { FONDO_COLOR } from "@/components/ui";
import { fraccionMeta, textoMeta, type Meta } from "@/lib/progreso";
import { BotonQuitar } from "./BotonQuitar";

type Props = { meta: Meta; avanzar: AccionesProgreso["avanzarMeta"]; eliminar: AccionesProgreso["eliminarMeta"] };

/** Meta del año con su barra de avance. Las de número se mueven con − y +; las de lista avanzan solas. */
export function TarjetaMeta({ meta, avanzar, eliminar }: Props) {
  const [m, cambiar] = useOptimistic(meta, (actual: Meta, valor: number) => ({ ...actual, actual: valor }));
  const [, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const porcentaje = Math.round(fraccionMeta(m) * 100);

  function mover(delta: number) {
    const valor = Math.max(0, m.actual + delta);
    setError(null);
    iniciar(async () => {
      cambiar(valor);
      try {
        const r = await avanzar(m.id, valor);
        if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      } catch {
        setError("Sin conexión: no se guardó.");
      }
    });
  }

  return (
    <li className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-[17px] font-semibold leading-snug">{m.titulo}</p>
          <p className="text-[15px] text-texto-2">
            {textoMeta(m)}
            {m.tipo === "lista" && m.lista ? ` · ${m.lista}` : ""}
          </p>
        </div>
        <span className="pt-0.5 text-[15px] font-semibold tabular-nums">{porcentaje} %</span>
        <BotonQuitar id={m.id} nombre={m.titulo} accion={eliminar} />
      </div>
      <div
        role="progressbar"
        aria-label={`Avance de ${m.titulo}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        className="h-2.5 overflow-hidden rounded-full bg-control"
      >
        <div className={`h-full origin-left rounded-full ${FONDO_COLOR[m.color]} transition-transform duration-500 ease-out`} style={{ transform: `scaleX(${porcentaje / 100})` }} />
      </div>
      {m.tipo === "numero" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => mover(-1)}
            disabled={m.actual <= 0}
            aria-label={`Restar 1 a ${m.titulo}`}
            className="grid size-9 place-items-center rounded-full bg-control text-[20px] font-semibold active:scale-95 disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => mover(1)}
            aria-label={`Sumar 1 a ${m.titulo}`}
            className="grid size-9 place-items-center rounded-full bg-control active:scale-95"
          >
            <Icono nombre="mas" className="size-5" />
          </button>
          <p className="h-5 flex-1 truncate text-[13px] text-rojo" aria-live="polite">
            {error}
          </p>
        </div>
      )}
    </li>
  );
}
