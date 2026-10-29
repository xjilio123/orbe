import Link from "next/link";
import type { AccionesColeccion } from "@/app/acciones/tipos";
import { ItemsChecklist } from "@/components/coleccion/ItemsChecklist";
import { ConfirmarEliminar } from "@/components/ConfirmarEliminar";
import { Icono } from "@/components/Icono";
import { Pantalla, TEXTO_COLOR, enlace } from "@/components/ui";
import type { Checklist, ItemChecklist } from "@/lib/coleccion";

type Props = { checklist: Checklist; items: ItemChecklist[]; base: string; acciones: AccionesColeccion };

export function VistaChecklist({ checklist, items, base, acciones }: Props) {
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/checklists")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Checklists
        </Link>
        <h1 className={`text-[34px] leading-tight font-bold tracking-tight ${TEXTO_COLOR[checklist.color]}`}>
          <span className="mr-2" aria-hidden="true">
            {checklist.icono}
          </span>
          {checklist.nombre}
        </h1>
      </header>
      <ItemsChecklist checklistId={checklist.id} items={items} acciones={acciones} />
      <ConfirmarEliminar
        texto="Eliminar checklist"
        pregunta={`¿Eliminar “${checklist.nombre}”?`}
        detalle="Se borra con todos sus ítems. Esto no se puede deshacer."
        accion={acciones.eliminarChecklist.bind(null, checklist.id)}
      />
    </Pantalla>
  );
}
