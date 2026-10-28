"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "@/app/acciones/tipos";
import { AVISOS, NOMBRE_REPETIR, REPETICIONES } from "@/lib/repeticion";
import { ESTADOS, NOMBRE_ESTADO, type Lista, type Tarea } from "@/lib/tareas";

type Props = {
  tarea: Tarea;
  listas: Lista[];
  accion: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
};

const PRIORIDADES = [
  { valor: 0, nombre: "Ninguna" },
  { valor: 1, nombre: "Baja" },
  { valor: 2, nombre: "Media" },
  { valor: 3, nombre: "Alta" },
];

const campo = "w-full rounded-[12px] bg-control px-3 py-2.5 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40";

export function FormularioTarea({ tarea, listas, accion }: Props) {
  const [estado, enviar, guardando] = useActionState(accion, {});
  const e = estado.errores ?? {};

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Título</span>
          <input name="titulo" defaultValue={tarea.titulo} maxLength={200} required className={`${campo} font-semibold`} />
          {e.titulo && <span className="text-[13px] text-rojo">{e.titulo}</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Notas</span>
          <textarea name="notas" defaultValue={tarea.notas} maxLength={2000} rows={3} className={`${campo} resize-none leading-relaxed`} />
          {e.notas && <span className="text-[13px] text-rojo">{e.notas}</span>}
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Fecha</span>
            <input type="date" name="fecha" defaultValue={tarea.fecha ?? ""} className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Hora</span>
            <input type="time" name="hora" defaultValue={tarea.hora ?? ""} className={campo} />
          </label>
        </div>
        {(e.fecha || e.hora) && <span className="text-[13px] text-rojo">{e.fecha ?? e.hora}</span>}

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Repetir</span>
            <select name="repetir" defaultValue={tarea.repetir ?? ""} disabled={tarea.padre_id !== null} className={campo}>
              <option value="">Nunca</option>
              {REPETICIONES.map((r) => (
                <option key={r} value={r}>
                  {NOMBRE_REPETIR[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-texto-2">Aviso</span>
            <select name="aviso" defaultValue={tarea.aviso ?? ""} className={campo}>
              {AVISOS.map((a) => (
                <option key={a.nombre} value={a.valor ?? ""}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        {e.repetir ? (
          <span className="text-[13px] text-rojo">{e.repetir}</span>
        ) : (
          <span className="text-[13px] text-texto-2">El aviso llega a la hora de la tarea si activaste los avisos en Ajustes.</span>
        )}

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold text-texto-2">Prioridad</legend>
          <div className="flex rounded-[12px] bg-control p-1">
            {PRIORIDADES.map((p) => (
              <label key={p.valor} className="flex-1">
                <input type="radio" name="prioridad" value={p.valor} defaultChecked={tarea.prioridad === p.valor} className="peer sr-only" />
                <span className="block rounded-[9px] py-1.5 text-center text-[15px] font-semibold peer-checked:bg-superficie peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-relleno/40">
                  {p.nombre}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-semibold text-texto-2">Estado</legend>
          <div className="flex rounded-[12px] bg-control p-1">
            {ESTADOS.map((s) => (
              <label key={s} className="flex-1">
                <input type="radio" name="estado" value={s} defaultChecked={tarea.estado === s} className="peer sr-only" />
                <span className="block rounded-[9px] py-1.5 text-center text-[15px] font-semibold peer-checked:bg-superficie peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-relleno/40">
                  {NOMBRE_ESTADO[s]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Lista</span>
          <select name="lista_id" defaultValue={tarea.lista_id ?? ""} className={campo}>
            <option value="">Inbox (sin lista)</option>
            {listas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
        </label>
      </section>

      {e.general && <p className="text-center text-[15px] text-rojo">{e.general}</p>}
      <button
        type="submit"
        disabled={guardando}
        className="rounded-[20px] bg-indigo-relleno py-4 text-[17px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
      >
        {guardando ? "Guardando…" : estado.ok ? "Guardado ✓" : "Guardar cambios"}
      </button>
    </form>
  );
}
