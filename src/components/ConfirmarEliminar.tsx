"use client";

import { useState, useTransition } from "react";
import { Icono } from "@/components/Icono";

/** Botón rojo que pide confirmación antes de borrar (alerta al estilo iOS, sin ventanas del navegador). */
export function ConfirmarEliminar({ texto, pregunta, detalle, accion }: { texto: string; pregunta: string; detalle: string; accion: () => Promise<void> }) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, iniciar] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-superficie py-4 text-[17px] font-semibold text-rojo active:scale-[0.98]"
      >
        <Icono nombre="basura" className="size-5" />
        {texto}
      </button>
      {abierto && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo" className="fixed inset-0 z-40 grid place-items-center bg-black/40 px-10">
          <div className="w-full max-w-[290px] overflow-hidden rounded-[16px] bg-superficie text-center motion-safe:animate-[entrar-desde-abajo_0.2s_ease-out]">
            <div className="flex flex-col gap-1 px-4 pt-5 pb-4">
              <h2 id="confirmar-titulo" className="text-[17px] font-semibold">
                {pregunta}
              </h2>
              <p className="text-[13px] text-texto-2">{detalle}</p>
            </div>
            <div className="grid grid-cols-2 border-t border-separador">
              <button type="button" onClick={() => setAbierto(false)} className="border-r border-separador py-3 text-[17px] text-azul">
                Cancelar
              </button>
              <button
                type="button"
                disabled={borrando}
                onClick={() => iniciar(accion)}
                className="py-3 text-[17px] font-semibold text-rojo disabled:opacity-50"
              >
                {borrando ? "Borrando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
