"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Contenedor desplazable del mapa: al abrir se centra (el mapa es más grande que la pantalla). */
export function LienzoMapa({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = caja.current;
    if (!c) return;
    c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2;
    c.scrollTop = (c.scrollHeight - c.clientHeight) / 2;
  }, []);
  return (
    <div ref={caja} className="h-[62dvh] overflow-auto overscroll-contain rounded-[22px] bg-superficie" tabIndex={0} aria-label="Mapa de notas (desplázalo con el dedo)">
      {/* Si el mapa es más chico que la caja, queda centrado. */}
      <div className="grid min-h-full min-w-full w-max place-items-center">{children}</div>
    </div>
  );
}
