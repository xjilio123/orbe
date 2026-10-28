"use client";

import Link from "next/link";
import { startTransition, useOptimistic } from "react";
import { Icono } from "@/components/Icono";
import { enlace } from "@/components/ui";
import { etiquetaFecha, etiquetaHora } from "@/lib/fechas";
import type { Tarea } from "@/lib/tareas";

type Props = {
  tarea: Tarea;
  hoy: string;
  base: string;
  alternar: (id: string, hecha: boolean) => Promise<void>;
  lista?: { nombre: string; texto: string };
  subtareas?: { hechas: number; total: number };
};

const ARO_PRIORIDAD = ["border-texto-2/60", "border-azul-relleno", "border-naranja-relleno", "border-rojo-relleno"];

/**
 * Fila de tarea al estilo Recordatorios. El check responde al instante (useOptimistic):
 * la pantalla no espera al servidor para marcarla.
 */
export function FilaTarea({ tarea, hoy, base, alternar, lista, subtareas }: Props) {
  const [hecha, setHecha] = useOptimistic(tarea.estado === "hecha");

  function tocar() {
    const nuevo = !hecha;
    startTransition(async () => {
      setHecha(nuevo);
      await alternar(tarea.id, nuevo);
    });
  }

  const vencida = !hecha && tarea.fecha !== null && tarea.fecha < hoy;
  const meta = [
    tarea.fecha && {
      texto: etiquetaFecha(tarea.fecha, hoy) + (tarea.hora ? ` · ${etiquetaHora(tarea.hora)}` : "") + (tarea.repetir ? " ↻" : ""),
      clase: vencida ? "text-rojo" : "",
    },
    lista && { texto: lista.nombre, clase: lista.texto },
    subtareas && subtareas.total > 0 && { texto: `${subtareas.hechas}/${subtareas.total}`, clase: "" },
  ].filter(Boolean) as { texto: string; clase: string }[];

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        onClick={tocar}
        role="checkbox"
        aria-checked={hecha}
        aria-label={hecha ? `Marcar “${tarea.titulo}” como pendiente` : `Marcar “${tarea.titulo}” como hecha`}
        className={`mt-0.5 grid size-[26px] shrink-0 place-items-center rounded-full border-2 transition active:scale-90 ${
          hecha ? "border-verde-relleno bg-verde-relleno text-white" : ARO_PRIORIDAD[tarea.prioridad]
        }`}
      >
        {hecha && <Icono nombre="check" className="size-4" />}
      </button>
      <Link href={enlace(base, `/tareas/${tarea.id}`)} className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-[17px] leading-snug transition-colors ${hecha ? "text-texto-2 line-through" : ""}`}>
          {tarea.prioridad > 0 && !hecha && (
            <span className="mr-1 font-bold text-rojo" aria-label={`Prioridad ${tarea.prioridad}`}>
              {"!".repeat(tarea.prioridad)}
            </span>
          )}
          {tarea.titulo}
        </span>
        {meta.length > 0 && (
          <span className="flex flex-wrap gap-x-2 text-[13px] text-texto-2">
            {meta.map((m) => (
              <span key={m.texto} className={m.clase}>
                {m.texto}
              </span>
            ))}
          </span>
        )}
      </Link>
    </li>
  );
}
