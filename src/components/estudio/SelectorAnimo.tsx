"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { AccionesEstudio } from "@/app/acciones/tipos";
import { ANIMOS } from "@/lib/estudio";

type Props = { fecha: string; animo: number | null; marcar: AccionesEstudio["marcarAnimo"] };

/** Cinco caras para decir cómo estás hoy. Tocar la marcada otra vez la quita. Cambia al instante. */
export function SelectorAnimo({ fecha, animo, marcar }: Props) {
  const [elegido, cambiar] = useOptimistic(animo, (_actual: number | null, nuevo: number | null) => nuevo);
  const [, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function tocar(valor: number) {
    const nuevo = elegido === valor ? null : valor;
    setError(null);
    iniciar(async () => {
      cambiar(nuevo);
      try {
        const r = await marcar(fecha, nuevo);
        if (!r.ok) setError(r.error ?? "No se pudo guardar.");
      } catch {
        setError("Sin conexión: no se guardó.");
      }
    });
  }

  return (
    <div className="relative">
      <div role="radiogroup" aria-label="¿Cómo te sientes hoy?" className="grid grid-cols-5 gap-2">
        {ANIMOS.map((a) => {
          const activo = elegido === a.valor;
          return (
            <button
              key={a.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={a.nombre}
              onClick={() => tocar(a.valor)}
              className={`flex flex-col items-center gap-1 rounded-[16px] py-2.5 transition active:scale-95 ${activo ? `${a.clase} text-white` : "bg-control"}`}
            >
              <span aria-hidden="true" className={`text-[28px] leading-none ${elegido !== null && !activo ? "opacity-50" : ""}`}>
                {a.emoji}
              </span>
              <span className={`text-[11px] font-semibold ${activo ? "" : "text-texto-2"}`}>{a.nombre}</span>
            </button>
          );
        })}
      </div>
      <p className="absolute inset-x-0 top-full mt-1 truncate px-1 text-[13px] text-rojo" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
