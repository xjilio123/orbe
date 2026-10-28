"use client";

import { useEffect, useState } from "react";
import type { Buscar } from "@/app/acciones/tipos";
import BarraComandos from "./BarraComandos";

export const EVENTO_BUSCAR = "orbe:buscar";

/** Abre la barra ⌘K con el teclado (⌘K o Ctrl+K) o con la lupa de cada pantalla. */
export function AbrirBarra({ buscar, base }: { buscar: Buscar; base: string }) {
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    const teclado = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierta((a) => !a);
      }
    };
    const abrir = () => setAbierta(true);
    window.addEventListener("keydown", teclado);
    window.addEventListener(EVENTO_BUSCAR, abrir);
    return () => {
      window.removeEventListener("keydown", teclado);
      window.removeEventListener(EVENTO_BUSCAR, abrir);
    };
  }, []);

  return abierta ? <BarraComandos buscar={buscar} base={base} onCerrar={() => setAbierta(false)} /> : null;
}

/** Lupa que abre la barra (en el encabezado de cada pantalla). */
export function BotonBuscar() {
  return (
    <button
      type="button"
      aria-label="Buscar"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => window.dispatchEvent(new Event(EVENTO_BUSCAR))}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-superficie text-texto-2 shadow-sm active:scale-95"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="size-[22px]" aria-hidden="true">
        <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4" />
      </svg>
    </button>
  );
}
