"use client";

import { cerrarSesion } from "@/app/acciones/generales";
import { Icono } from "@/components/Icono";
import { olvidarPendientes } from "@/lib/pendientes";

/** Cerrar sesión también borra del teléfono las pantallas guardadas y las tareas por enviar. */
export function BotonCerrarSesion() {
  return (
    <form
      action={cerrarSesion}
      onSubmit={() => {
        olvidarPendientes();
        navigator.serviceWorker?.controller?.postMessage({ tipo: "olvidar" });
      }}
    >
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-superficie py-4 text-[17px] font-semibold text-rojo active:scale-[0.98]"
      >
        <Icono nombre="salir" className="size-5" />
        Cerrar sesión
      </button>
    </form>
  );
}
