import Link from "next/link";
import type { AccionesColeccion } from "@/app/acciones/tipos";
import { FormularioObra } from "@/components/coleccion/Formularios";
import { TarjetaObra } from "@/components/coleccion/TarjetaObra";
import { Icono } from "@/components/Icono";
import { Pantalla, enlace } from "@/components/ui";
import { ESTADOS_BIBLIOTECA, resumenAnio, type EstadoBiblioteca, type Obra } from "@/lib/coleccion";

type Props = { obras: Obra[]; estado: EstadoBiblioteca; anio: number; base: string; acciones: Pick<AccionesColeccion, "crearObra" | "actualizarObra" | "eliminarObra"> };

const PESTANAS: EstadoBiblioteca[] = ["en_curso", "quiero", "terminado", "abandonado"];
const CORTO: Record<EstadoBiblioteca, string> = { en_curso: "En curso", quiero: "Quiero", terminado: "Terminados", abandonado: "Dejados" };

/** Biblioteca: lo que lees, ves o cursas, con su avance, nota y lo terminado en el año. */
export function VistaBiblioteca({ obras, estado, anio, base, acciones }: Props) {
  const visibles = obras.filter((o) => o.estado === estado);
  const r = resumenAnio(obras, anio);

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/progreso")} className="flex w-fit items-center gap-1 text-[17px] text-indigo">
          <Icono nombre="atras" className="size-5" /> Progreso
        </Link>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Biblioteca</h1>
        <p className="-mt-2 text-[15px] text-texto-2">
          {r.total === 0
            ? `Aún nada terminado en ${anio}.`
            : `En ${anio} terminaste ${r.total}: ${r.porTipo.map((t) => `${t.emoji} ${t.cantidad}`).join("  ")}`}
        </p>
      </header>

      <nav aria-label="Estado" className="grid grid-cols-4 gap-1 rounded-[14px] bg-control p-1">
        {PESTANAS.map((e) => {
          const cuantos = obras.filter((o) => o.estado === e).length;
          return (
            <Link
              key={e}
              href={enlace(base, e === "en_curso" ? "/biblioteca" : `/biblioteca?estado=${e}`)}
              aria-current={estado === e ? "page" : undefined}
              className={`flex flex-col items-center rounded-[11px] py-1.5 text-[13px] font-semibold ${estado === e ? "bg-superficie shadow-sm" : "text-texto-2"}`}
            >
              {CORTO[e]}
              <span className="text-[11px] font-normal text-texto-2 tabular-nums">{cuantos}</span>
            </Link>
          );
        })}
      </nav>

      {visibles.length > 0 ? (
        <ul aria-label={ESTADOS_BIBLIOTECA[estado]} className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
          {visibles.map((o) => (
            <TarjetaObra key={o.id} obra={o} acciones={acciones} />
          ))}
        </ul>
      ) : (
        <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
          {estado === "en_curso" ? "Nada en curso. Agrega lo que estás leyendo o viendo." : "Nada por aquí todavía."}
        </p>
      )}
      <FormularioObra accion={acciones.crearObra} />
    </Pantalla>
  );
}
