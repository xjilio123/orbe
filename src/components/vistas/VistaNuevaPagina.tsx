import Link from "next/link";
import type { AccionesApuntes } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import { PLANTILLAS } from "@/lib/plantillas";

type Props = {
  padreId: string | null;
  /** Páginas tuyas marcadas como plantilla. */
  propias: { id: string; titulo: string; icono: string }[];
  base: string;
  acciones: Pick<AccionesApuntes, "crear">;
};

function Opcion({ icono, nombre, descripcion, accion }: { icono: string; nombre: string; descripcion: string; accion: () => Promise<void> }) {
  return (
    <li>
      <form action={accion}>
        <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-control">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-naranja-relleno/15 text-[22px]">
            {icono}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[17px] font-semibold">{nombre}</span>
            <span className="truncate text-[13px] text-texto-2">{descripcion}</span>
          </span>
          <Icono nombre="adelante" className="size-4 shrink-0 text-texto-2" />
        </button>
      </form>
    </li>
  );
}

/** Elegir cómo empieza la página nueva: en blanco, con una plantilla de Orbe o con una tuya. */
export function VistaNuevaPagina({ padreId, propias, base, acciones }: Props) {
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, padreId ? `/apuntes/${padreId}` : "/apuntes")} className="flex w-fit items-center gap-1 text-[17px] text-naranja">
          <Icono nombre="atras" className="size-5" /> Apuntes
        </Link>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Nueva página</h1>
      </header>

      <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
        <Opcion icono="📄" nombre="En blanco" descripcion="Empieza desde cero." accion={acciones.crear.bind(null, padreId, undefined)} />
      </ul>

      {propias.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-plantillas-propias">
          <TituloSeccion id="titulo-plantillas-propias" titulo="Tus plantillas" />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {propias.map((p) => (
              <Opcion
                key={p.id}
                icono={p.icono || "📄"}
                nombre={p.titulo || "Sin título"}
                descripcion="Copia sus textos y casillas (sin fotos ni PDF)."
                accion={acciones.crear.bind(null, padreId, p.id)}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="titulo-plantillas">
        <TituloSeccion id="titulo-plantillas" titulo="Plantillas de Orbe" />
        <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
          {PLANTILLAS.map((p) => (
            <Opcion key={p.id} icono={p.icono} nombre={p.nombre} descripcion={p.descripcion} accion={acciones.crear.bind(null, padreId, p.id)} />
          ))}
        </ul>
      </section>
      <p className="px-1 text-[13px] text-texto-2">Para tener tus propias plantillas, abre una página y toca “Usar como plantilla”.</p>
    </Pantalla>
  );
}
