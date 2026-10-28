import Link from "next/link";
import type { AccionesOrganizacion } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { MatrizTareas } from "@/components/tareas/MatrizTareas";
import { Pantalla, enlace } from "@/components/ui";
import type { Tarea } from "@/lib/tareas";

type Props = { tareas: Tarea[]; hoy: string; base: string; acciones: Pick<AccionesOrganizacion, "moverCuadrante"> };

/** Matriz urgente / importante (Eisenhower): qué hacer primero. */
export function VistaMatriz({ tareas, hoy, base, acciones }: Props) {
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/tareas")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Tareas
        </Link>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Matriz</h1>
        <p className="-mt-2 text-[15px] leading-snug text-texto-2">
          Importante = prioridad !! o !!!. Urgente = vence en 2 días o menos. Toca una tarea para moverla.
        </p>
      </header>
      <MatrizTareas tareas={tareas} hoy={hoy} base={base} mover={acciones.moverCuadrante} />
    </Pantalla>
  );
}
