"use client";

import { useRef, useState } from "react";
import type { Plazo } from "@/lib/plazo";

type Props = {
  /** Clases del campo de texto (cada formulario usa las suyas). */
  clase: string;
  inicial?: Partial<Plazo>;
  /** La fecha de inicio es obligatoria (fechas importantes y exámenes). */
  requerido?: boolean;
  /** Primer día que se puede elegir. */
  min?: string;
  errores?: Partial<Record<"fecha" | "hora" | "fecha_fin" | "hora_fin", string>>;
  /** Avisa cuando cambian la fecha o la hora de inicio (la tarea lo usa para explicar el aviso). */
  alCambiar?: (inicio: { fecha: string; hora: string }) => void;
};

const ETIQUETA = "text-[13px] font-semibold text-texto-2";
const FILA = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3";

/**
 * Fecha y hora de inicio y de fin, en dos filas. Si el inicio pasa después del fin, el fin se mueve con él
 * (como en Calendario). Fin vacío = termina el mismo día.
 */
export function CamposPlazo({ clase, inicial = {}, requerido = false, min, errores = {}, alCambiar }: Props) {
  const [inicio, setInicio] = useState(inicial.fecha ?? "");
  const hora = useRef(inicial.hora ?? "");
  const fin = useRef<HTMLInputElement>(null);

  function cambiarInicio(valor: string) {
    setInicio(valor);
    if (fin.current?.value && valor && fin.current.value < valor) fin.current.value = valor;
    alCambiar?.({ fecha: valor, hora: hora.current });
  }

  const errorInicio = errores.fecha ?? errores.hora;
  const errorFin = errores.fecha_fin ?? errores.hora_fin;

  return (
    <>
      <div className={FILA}>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={ETIQUETA}>Fecha de inicio</span>
          <input
            type="date"
            name="fecha"
            required={requerido}
            min={min}
            defaultValue={inicial.fecha ?? ""}
            onChange={(ev) => cambiarInicio(ev.target.value)}
            className={clase}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={ETIQUETA}>Hora de inicio</span>
          <input
            type="time"
            name="hora"
            defaultValue={inicial.hora ?? ""}
            onChange={(ev) => {
              hora.current = ev.target.value;
              alCambiar?.({ fecha: inicio, hora: ev.target.value });
            }}
            className={clase}
          />
        </label>
      </div>
      {errorInicio && <span className="text-[13px] text-rojo">{errorInicio}</span>}

      <div className={FILA}>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={ETIQUETA}>Fecha de fin</span>
          <input ref={fin} type="date" name="fecha_fin" min={inicio || min} defaultValue={inicial.fecha_fin ?? ""} className={clase} />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={ETIQUETA}>Hora de fin</span>
          <input type="time" name="hora_fin" defaultValue={inicial.hora_fin ?? ""} className={clase} />
        </label>
      </div>
      {errorFin ? (
        <span className="text-[13px] text-rojo">{errorFin}</span>
      ) : (
        <span className="text-[13px] text-texto-2">Si termina el mismo día, deja vacía la fecha de fin.</span>
      )}
    </>
  );
}
