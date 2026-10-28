"use client";

import { startTransition, useOptimistic } from "react";

/** Estrella para marcar la página como favorita: responde al instante. */
export function BotonFavorita({ id, favorita, accion }: { id: string; favorita: boolean; accion: (id: string, favorita: boolean) => Promise<void> }) {
  const [activa, setActiva] = useOptimistic(favorita);
  return (
    <button
      type="button"
      aria-pressed={activa}
      aria-label={activa ? "Quitar de favoritas" : "Agregar a favoritas"}
      onClick={() =>
        startTransition(async () => {
          setActiva(!activa);
          await accion(id, !activa);
        })
      }
      className={`grid size-11 place-items-center rounded-full bg-superficie text-[22px] shadow-sm active:scale-90 ${activa ? "text-naranja" : "text-texto-2"}`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill={activa ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
      </svg>
    </button>
  );
}
