import Link from "next/link";
import type { AccionesApuntes } from "@/app/acciones/tipos";
import { BotonFavorita } from "@/components/apuntes/BotonFavorita";
import { Editor } from "@/components/apuntes/Editor";
import { ConfirmarEliminar } from "@/components/ConfirmarEliminar";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import type { Pagina, PaginaResumen } from "@/lib/datos/paginas";

type Props = {
  pagina: Pagina;
  camino: PaginaResumen[];
  hijas: PaginaResumen[];
  urls: Record<string, string>;
  tamanos: Record<string, number>;
  base: string;
  acciones: AccionesApuntes;
};

export function VistaPagina({ pagina, camino, hijas, urls, tamanos, base, acciones }: Props) {
  const padre = camino.at(-1);

  return (
    <Pantalla>
      <header className="flex items-center justify-between gap-3 pt-2">
        <nav aria-label="Ubicación" className="flex min-w-0 items-center gap-1 text-[17px] text-naranja">
          <Link href={enlace(base, padre ? `/apuntes/${padre.id}` : "/apuntes")} className="flex shrink-0 items-center gap-1">
            <Icono nombre="atras" className="size-5" />
            {padre ? "" : "Apuntes"}
          </Link>
          {camino.map((p, i) => (
            <span key={p.id} className="flex min-w-0 items-center gap-1">
              {i > 0 && <span className="text-texto-2">›</span>}
              <Link href={enlace(base, `/apuntes/${p.id}`)} className="truncate">
                {p.titulo || "Sin título"}
              </Link>
            </span>
          ))}
        </nav>
        <BotonFavorita id={pagina.id} favorita={pagina.favorita} accion={acciones.favorita} />
      </header>

      <h1 className="sr-only">{pagina.titulo || "Sin título"}</h1>
      <Editor
        paginaId={pagina.id}
        titulo={pagina.titulo}
        icono={pagina.icono}
        contenido={pagina.contenido}
        urls={urls}
        tamanos={tamanos}
        acciones={acciones}
      />

      <section className="flex flex-col gap-2" aria-labelledby="titulo-subpaginas">
        <TituloSeccion id="titulo-subpaginas" titulo="Páginas dentro" extra={hijas.length || undefined} />
        {hijas.length > 0 && (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {hijas.map((h) => (
              <li key={h.id}>
                <Link href={enlace(base, `/apuntes/${h.id}`)} className="flex items-center gap-3 px-4 py-3 active:bg-control">
                  <span aria-hidden="true" className="w-6 text-center text-[20px]">
                    {h.icono || "📄"}
                  </span>
                  <span className="flex-1 truncate text-[17px]">{h.titulo || "Sin título"}</span>
                  <Icono nombre="adelante" className="size-4 text-texto-2" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href={enlace(base, `/apuntes/nueva?padre=${pagina.id}`)} className="flex w-fit items-center gap-2 px-1 py-2 text-[17px] font-semibold text-naranja">
          <Icono nombre="mas" className="size-5" />
          Nueva página dentro
        </Link>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href={enlace(base, `/apuntes/${pagina.id}/historial`)}
          className="flex items-center justify-center gap-2 rounded-[18px] bg-superficie py-3 text-[15px] font-semibold active:scale-[0.98]"
        >
          <Icono nombre="reloj" className="size-5 text-naranja" />
          Historial
        </Link>
        <form action={acciones.plantilla.bind(null, pagina.id, !pagina.plantilla)}>
          <button
            type="submit"
            aria-pressed={Boolean(pagina.plantilla)}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-superficie py-3 text-[15px] font-semibold active:scale-[0.98]"
          >
            <Icono nombre="plantilla" className="size-5 text-naranja" />
            {pagina.plantilla ? "Es plantilla ✓" : "Usar como plantilla"}
          </button>
        </form>
      </div>

      <ConfirmarEliminar
        texto="Mover a la papelera"
        pregunta={`¿Mover “${pagina.titulo || "Sin título"}” a la papelera?`}
        detalle="Con sus páginas internas. Puedes recuperarla durante 30 días desde Ajustes → Papelera."
        confirmar="Mover"
        accion={acciones.eliminar.bind(null, pagina.id)}
      />
    </Pantalla>
  );
}
