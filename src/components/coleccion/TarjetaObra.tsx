"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { AccionesColeccion } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { BotonQuitar } from "@/components/progreso/BotonQuitar";
import { ESTADOS_BIBLIOTECA, TIPOS_BIBLIOTECA, fraccionObra, textoProgreso, type EstadoBiblioteca, type Obra } from "@/lib/coleccion";

type Props = { obra: Obra; acciones: Pick<AccionesColeccion, "actualizarObra" | "eliminarObra"> };

/** Un libro, serie o curso: avance con − / +, estado y nota de 1 a 5 estrellas. Todo cambia al instante. */
export function TarjetaObra({ obra, acciones }: Props) {
  const [o, cambiar] = useOptimistic(obra, (actual: Obra, c: Partial<Obra>) => {
    const nueva = { ...actual, ...c };
    if (nueva.estado === "terminado" && nueva.total) nueva.progreso = nueva.total;
    return nueva;
  });
  const [, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const tipo = TIPOS_BIBLIOTECA[o.tipo];

  function guardar(c: { progreso?: number; estado?: EstadoBiblioteca; nota?: number | null }) {
    setError(null);
    iniciar(async () => {
      cambiar(c);
      try {
        const r = await acciones.actualizarObra(o.id, c);
        if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      } catch {
        setError("Sin conexión: no se guardó.");
      }
    });
  }

  return (
    <li className="flex flex-col gap-2.5 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-morado-relleno/12 text-[24px]">
          {tipo.emoji}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="line-clamp-2 text-[17px] leading-snug font-semibold">{o.titulo}</p>
          <p className="truncate text-[13px] text-texto-2">
            {tipo.nombre}
            {o.autor ? ` · ${o.autor}` : ""}
          </p>
          <p className="text-[13px] font-semibold text-morado">{textoProgreso(o)}</p>
        </div>
        <BotonQuitar id={o.id} nombre={o.titulo} accion={acciones.eliminarObra} />
      </div>

      {o.estado === "en_curso" && (
        <div className="flex items-center gap-2">
          <div
            role="progressbar"
            aria-label={`Avance de ${o.titulo}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fraccionObra(o) * 100)}
            className="h-2 flex-1 overflow-hidden rounded-full bg-control"
          >
            <div className="h-full origin-left rounded-full bg-morado-relleno transition-transform duration-300" style={{ transform: `scaleX(${fraccionObra(o)})` }} />
          </div>
          <button
            type="button"
            onClick={() => guardar({ progreso: Math.max(0, o.progreso - 1) })}
            disabled={o.progreso <= 0}
            aria-label={`Restar 1 a ${o.titulo}`}
            className="grid size-9 place-items-center rounded-full bg-control text-[20px] font-semibold active:scale-95 disabled:opacity-40"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => guardar({ progreso: Math.min(o.total ?? 100000, o.progreso + 1) })}
            aria-label={`Sumar 1 a ${o.titulo}`}
            className="grid size-9 place-items-center rounded-full bg-control active:scale-95"
          >
            <Icono nombre="mas" className="size-5" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <label className="sr-only" htmlFor={`estado-${o.id}`}>
          Estado de {o.titulo}
        </label>
        <select
          id={`estado-${o.id}`}
          value={o.estado}
          onChange={(e) => guardar({ estado: e.target.value as EstadoBiblioteca })}
          className="rounded-[10px] bg-control px-2.5 py-1.5 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-indigo-relleno/40"
        >
          {(Object.keys(ESTADOS_BIBLIOTECA) as EstadoBiblioteca[]).map((e) => (
            <option key={e} value={e}>
              {ESTADOS_BIBLIOTECA[e]}
            </option>
          ))}
        </select>
        {(o.estado === "terminado" || o.estado === "abandonado") && (
          <div role="radiogroup" aria-label={`Nota de ${o.titulo}`} className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={o.nota === n}
                aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                onClick={() => guardar({ nota: o.nota === n ? null : n })}
                className={`px-0.5 text-[22px] leading-none active:scale-90 ${o.nota !== null && n <= o.nota ? "text-naranja" : "text-texto-2/35"}`}
              >
                ★
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-[13px] text-rojo">{error}</p>}
    </li>
  );
}
