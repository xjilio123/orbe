import Link from "next/link";
import type { AccionesColeccion } from "@/app/acciones/tipos";
import { FormularioChecklist } from "@/components/coleccion/Formularios";
import { Icono } from "@/components/Icono";
import { FONDO_COLOR, Pantalla, enlace } from "@/components/ui";
import type { Checklist } from "@/lib/coleccion";

type Props = { checklists: Checklist[]; base: string; acciones: Pick<AccionesColeccion, "crearChecklist"> };

/** Checklists reutilizables: el mercado, la maleta… Marcas, y al terminar desmarcas todo para la próxima. */
export function VistaChecklists({ checklists, base, acciones }: Props) {
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/tareas")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Tareas
        </Link>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Checklists</h1>
        <p className="-mt-2 text-[15px] leading-snug text-texto-2">Listas que vuelves a usar: marcas lo que llevas y al final desmarcas todo.</p>
      </header>

      {checklists.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {checklists.map((c) => (
            <li key={c.id}>
              <Link href={enlace(base, `/checklists/${c.id}`)} className="flex h-full flex-col gap-2 rounded-[20px] bg-superficie p-3.5 active:scale-[0.98]">
                <span aria-hidden="true" className="text-[30px] leading-none">
                  {c.icono}
                </span>
                <span className="line-clamp-2 text-[17px] leading-snug font-semibold">{c.nombre}</span>
                <span className="mt-auto flex items-center gap-2">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-control">
                    <span
                      className={`block h-full origin-left rounded-full ${FONDO_COLOR[c.color]}`}
                      style={{ transform: `scaleX(${c.total ? c.hechos / c.total : 0})` }}
                    />
                  </span>
                  <span className="text-[12px] text-texto-2 tabular-nums">
                    {c.hechos}/{c.total}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
          Crea tu primera checklist: la lista del mercado o lo que llevas de viaje.
        </p>
      )}
      <FormularioChecklist accion={acciones.crearChecklist} />
    </Pantalla>
  );
}
