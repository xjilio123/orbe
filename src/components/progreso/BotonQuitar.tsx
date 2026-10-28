"use client";

import { useEffect, useState, useTransition } from "react";
import { Icono } from "@/components/Icono";

/**
 * Quitar en dos toques: el primero pregunta ("¿Quitar?") y el segundo borra.
 * Si no confirmas en 3 segundos, vuelve a la ✕. El ancho es fijo: la fila no se mueve.
 */
export function BotonQuitar({ id, nombre, accion }: { id: string; nombre: string; accion: (id: string) => Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);
  const [quitando, iniciar] = useTransition();

  useEffect(() => {
    if (!confirmando) return;
    const espera = setTimeout(() => setConfirmando(false), 3000);
    return () => clearTimeout(espera);
  }, [confirmando]);

  return (
    <button
      type="button"
      disabled={quitando}
      onClick={() => (confirmando ? iniciar(() => accion(id)) : setConfirmando(true))}
      aria-label={confirmando ? `Confirmar: quitar ${nombre}` : `Quitar ${nombre}`}
      className={`grid h-8 w-[68px] shrink-0 place-items-center rounded-full text-[13px] font-semibold transition active:scale-95 disabled:opacity-50 ${
        confirmando ? "bg-rojo-relleno text-white" : "text-texto-2"
      }`}
    >
      {confirmando ? "¿Quitar?" : <Icono nombre="cerrar" className="size-4" />}
    </button>
  );
}
