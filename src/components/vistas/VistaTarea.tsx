import Link from "next/link";
import type { AccionesTareas } from "@/app/acciones/tipos";
import { ConfirmarEliminar } from "@/components/ConfirmarEliminar";
import { Icono } from "@/components/Icono";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { FormularioTarea } from "@/components/tareas/FormularioTarea";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import { progresoSubtareas, type Lista, type Tarea } from "@/lib/tareas";

type Props = {
  tarea: Tarea;
  subtareas: Tarea[];
  listas: Lista[];
  hoy: string;
  base: string;
  acciones: Pick<AccionesTareas, "guardar" | "eliminar" | "crearSubtarea" | "alternar">;
};

export function VistaTarea({ tarea, subtareas, listas, hoy, base, acciones }: Props) {
  const lista = listas.find((l) => l.id === tarea.lista_id);
  const volver = lista ? { href: `/tareas/lista/${lista.id}`, texto: lista.nombre } : { href: "/tareas", texto: "Tareas" };
  const avance = progresoSubtareas(subtareas);
  const esSubtarea = tarea.padre_id !== null;

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, esSubtarea ? `/tareas/${tarea.padre_id}` : volver.href)} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> {esSubtarea ? "Tarea principal" : volver.texto}
        </Link>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">Detalle</h1>
      </header>

      <FormularioTarea tarea={tarea} listas={listas} accion={acciones.guardar.bind(null, tarea.id)} />

      {!esSubtarea && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-subtareas">
          <TituloSeccion id="titulo-subtareas" titulo="Subtareas" extra={avance.total > 0 ? `${avance.hechas}/${avance.total}` : undefined} />
          {subtareas.length > 0 && (
            <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
              {subtareas.map((s) => (
                <FilaTarea key={s.id} tarea={s} hoy={hoy} base={base} alternar={acciones.alternar} />
              ))}
            </ul>
          )}
          <CapturaRapida accion={acciones.crearSubtarea.bind(null, tarea.id)} placeholder="Agregar subtarea…" interpretar={false} />
        </section>
      )}

      <ConfirmarEliminar
        texto="Mover a la papelera"
        pregunta={`¿Mover “${tarea.titulo}” a la papelera?`}
        detalle={`${subtareas.length > 0 ? "Con sus subtareas. " : ""}Puedes recuperarla durante 30 días desde Ajustes → Papelera.`}
        confirmar="Mover"
        accion={acciones.eliminar.bind(null, tarea.id, volver.href)}
      />
    </Pantalla>
  );
}
