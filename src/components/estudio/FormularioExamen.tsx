"use client";

import { useActionState, useEffect, useRef } from "react";
import type { EstadoFormulario } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";

const CAMPO = "w-full rounded-[12px] bg-control px-3 py-2.5 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40";

/** "Nuevo examen" de un curso: se guarda como fecha importante (y sale en la cuenta regresiva de Hoy). */
export function FormularioExamen({ accion, hoy, curso }: { accion: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>; hoy: string; curso: string }) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  const caja = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (estado.ok && caja.current) caja.current.open = false;
  }, [estado]);
  return (
    <details ref={caja} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[15px] font-semibold text-azul [&::-webkit-details-marker]:hidden">
        <Icono nombre="mas" className="size-4 transition-transform group-open:rotate-45" />
        Nuevo examen
      </summary>
      <form action={enviar} className="mt-3 flex flex-col gap-2.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Examen de {curso}</span>
          <input name="titulo" maxLength={80} required placeholder="Parcial, final, práctica…" className={CAMPO} />
        </label>
        <input type="date" name="fecha" required min={hoy} aria-label="Fecha del examen" className={CAMPO} />
        {(estado.errores?.titulo || estado.errores?.fecha || estado.errores?.general) && (
          <span className="text-[13px] text-rojo">{estado.errores.titulo ?? estado.errores.fecha ?? estado.errores.general}</span>
        )}
        <button
          type="submit"
          disabled={guardando}
          className="rounded-[14px] bg-indigo-relleno py-2.5 text-[17px] font-bold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar examen"}
        </button>
      </form>
    </details>
  );
}
