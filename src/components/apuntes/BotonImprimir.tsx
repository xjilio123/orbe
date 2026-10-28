"use client";

import { Icono } from "@/components/Icono";

/** Abre el diálogo de impresión del navegador: ahí se elige "Guardar como PDF" (en iPhone: Compartir → Guardar en Archivos). */
export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-naranja-relleno py-4 text-[17px] font-bold text-[#1d1d1f] active:scale-[0.98] print:hidden"
    >
      <Icono nombre="compartir" className="size-5" />
      Imprimir o guardar como PDF
    </button>
  );
}
