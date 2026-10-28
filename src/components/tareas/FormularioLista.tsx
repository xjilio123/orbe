"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "@/app/acciones/tipos";
import { FONDO_COLOR } from "@/components/ui";
import { COLORES_LISTA, type ColorLista } from "@/lib/tareas";

type Props = {
  accion: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  nombre?: string;
  color?: ColorLista;
  boton: string;
};

const NOMBRE_COLOR: Record<ColorLista, string> = {
  indigo: "Índigo",
  azul: "Azul",
  rojo: "Rojo",
  morado: "Morado",
  naranja: "Naranja",
  verde: "Verde",
  celeste: "Celeste",
};

export function FormularioLista({ accion, nombre = "", color = "azul", boton }: Props) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  return (
    <form action={enviar} className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-texto-2">Nombre de la lista</span>
        <input
          name="nombre"
          defaultValue={nombre}
          maxLength={60}
          required
          placeholder="Casa, Trabajo, Inglés…"
          className="w-full rounded-[12px] bg-control px-3 py-2.5 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40"
        />
        {estado.errores?.nombre && <span className="text-[13px] text-rojo">{estado.errores.nombre}</span>}
      </label>
      <fieldset>
        <legend className="mb-2 text-[13px] font-semibold text-texto-2">Color</legend>
        <div className="flex justify-between">
          {COLORES_LISTA.map((c) => (
            <label key={c} className="relative">
              <input type="radio" name="color" value={c} defaultChecked={c === color} className="peer sr-only" aria-label={NOMBRE_COLOR[c]} />
              <span
                className={`block size-9 rounded-full ${FONDO_COLOR[c]} ring-offset-2 ring-offset-superficie peer-checked:ring-2 peer-checked:ring-texto peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-relleno`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={guardando}
        className="rounded-[16px] bg-indigo-relleno py-3 text-[17px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {guardando ? "Guardando…" : estado.ok ? "Guardado ✓" : boton}
      </button>
    </form>
  );
}
