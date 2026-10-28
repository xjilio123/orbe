import Link from "next/link";
import type { AccionesTareas } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { CapturaRapida } from "@/components/tareas/CapturaRapida";
import { FilaTarea } from "@/components/tareas/FilaTarea";
import { FormularioLista } from "@/components/tareas/FormularioLista";
import { Encabezado, FONDO_COLOR, Pantalla, TEXTO_COLOR, TituloSeccion, enlace } from "@/components/ui";
import type { Grupo, Lista, Tarea } from "@/lib/tareas";

type Props = {
  hoy: string;
  base: string;
  inbox: Tarea[];
  grupos: Grupo[];
  listas: (Lista & { pendientes: number })[];
  subtareas: Record<string, { hechas: number; total: number }>;
  acciones: Pick<AccionesTareas, "capturar" | "alternar" | "crearLista">;
};

export function VistaTareas({ hoy, base, inbox, grupos, listas, subtareas, acciones }: Props) {
  const porId = new Map(listas.map((l) => [l.id, l]));
  const fila = (t: Tarea) => {
    const lista = t.lista_id ? porId.get(t.lista_id) : undefined;
    return (
      <FilaTarea
        key={t.id}
        tarea={t}
        hoy={hoy}
        base={base}
        alternar={acciones.alternar}
        lista={lista && { nombre: lista.nombre, texto: TEXTO_COLOR[lista.color] }}
        subtareas={subtareas[t.id]}
      />
    );
  };

  return (
    <Pantalla>
      <Encabezado titulo="Tareas" />
      <CapturaRapida accion={acciones.capturar} />

      <section id="inbox" className="flex scroll-mt-6 flex-col gap-2" aria-labelledby="titulo-inbox">
        <TituloSeccion id="titulo-inbox" titulo="Inbox" extra={inbox.length || undefined} />
        {inbox.length > 0 ? (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">{inbox.map(fila)}</ul>
        ) : (
          <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] text-texto-2">
            Inbox vacío. Lo que captures sin fecha ni lista llega aquí.
          </p>
        )}
      </section>

      {grupos.map((g) => (
        <section key={g.clave} className="flex flex-col gap-2" aria-labelledby={`titulo-${g.clave}`}>
          <TituloSeccion id={`titulo-${g.clave}`} titulo={g.titulo} extra={g.tareas.length} alerta={g.alerta} />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">{g.tareas.map(fila)}</ul>
        </section>
      ))}

      <section className="flex flex-col gap-2" aria-labelledby="titulo-listas">
        <TituloSeccion id="titulo-listas" titulo="Listas" />
        {listas.length > 0 && (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {listas.map((l) => (
              <li key={l.id}>
                <Link href={enlace(base, `/tareas/lista/${l.id}`)} className="flex items-center gap-3 px-4 py-3 active:bg-control">
                  <span aria-hidden="true" className={`grid size-9 place-items-center rounded-full text-white ${FONDO_COLOR[l.color]}`}>
                    <Icono nombre="lista" className="size-5" />
                  </span>
                  <span className="flex-1 truncate text-[17px] font-semibold">{l.nombre}</span>
                  <span className="text-[15px] text-texto-2">{l.pendientes}</span>
                  <Icono nombre="adelante" className="size-4 text-texto-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-1 py-2 text-[17px] font-semibold text-indigo [&::-webkit-details-marker]:hidden">
            <Icono nombre="mas" className="size-5 transition group-open:rotate-45" />
            Nueva lista
          </summary>
          <FormularioLista accion={acciones.crearLista} boton="Crear lista" />
        </details>
      </section>
    </Pantalla>
  );
}
