import Link from "next/link";
import type { AccionesApuntes, AccionesIa, AccionesNotas } from "@/app/acciones/tipos";
import { BotonFavorita } from "@/components/apuntes/BotonFavorita";
import { Editor } from "@/components/apuntes/Editor";
import { ConfirmarEliminar } from "@/components/ConfirmarEliminar";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import type { Pagina, PaginaResumen } from "@/lib/datos/paginas";
import { enlacesDe, resolverEnlaces, type PaginaEnlazable } from "@/lib/enlaces";

type Props = {
  pagina: Pagina;
  camino: PaginaResumen[];
  hijas: PaginaResumen[];
  urls: Record<string, string>;
  tamanos: Record<string, number>;
  base: string;
  acciones: AccionesApuntes;
  ia?: AccionesIa;
  /** Todas tus páginas (para [[enlaces]]) y las que enlazan a esta (backlinks). */
  paginas?: PaginaEnlazable[];
  mencionan?: PaginaEnlazable[];
  notas?: AccionesNotas;
};

function FilaEnlace({ p, base }: { p: PaginaEnlazable; base: string }) {
  return (
    <li>
      <Link href={enlace(base, `/apuntes/${p.id}`)} className="flex items-center gap-3 px-4 py-3 active:bg-control">
        <span aria-hidden="true" className="w-6 text-center text-[20px]">
          {p.icono || "📄"}
        </span>
        <span className="flex-1 truncate text-[17px]">{p.titulo || "Sin título"}</span>
        <Icono nombre="adelante" className="size-4 text-texto-2" />
      </Link>
    </li>
  );
}

export function VistaPagina({ pagina, camino, hijas, urls, tamanos, base, acciones, ia, paginas = [], mencionan = [], notas }: Props) {
  const padre = camino.at(-1);
  const salientes = resolverEnlaces(enlacesDe(pagina.contenido), paginas, pagina.id);
  const existentes = salientes.flatMap((e) => (e.pagina ? [e.pagina] : []));
  const porCrear = salientes.filter((e) => !e.pagina).map((e) => e.titulo);

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
        ia={ia}
        base={base}
        paginas={paginas}
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

      <section className="flex flex-col gap-2" aria-labelledby="titulo-conexiones">
        <TituloSeccion
          id="titulo-conexiones"
          titulo="Conexiones"
          extra={
            <Link href={enlace(base, "/apuntes/mapa")} className="font-semibold text-naranja">
              Ver mapa
            </Link>
          }
        />
        {existentes.length + porCrear.length + mencionan.length === 0 ? (
          <p className="rounded-[22px] bg-superficie px-4 py-4 text-[15px] leading-relaxed text-texto-2">
            Escribe <span className="font-mono font-semibold text-texto">[[</span> en el texto para enlazar otra página. Aquí verás a cuáles enlaza y cuáles la mencionan.
          </p>
        ) : (
          <>
            {(existentes.length > 0 || porCrear.length > 0) && (
              <div className="flex flex-col gap-1.5">
                <p className="px-1 text-[13px] font-semibold text-texto-2">Enlaza a</p>
                <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
                  {existentes.map((p) => (
                    <FilaEnlace key={p.id} p={p} base={base} />
                  ))}
                  {porCrear.map((titulo) => (
                    <li key={titulo} className="flex items-center gap-3 px-4 py-2.5">
                      <span aria-hidden="true" className="w-6 text-center text-[20px] opacity-50">
                        📄
                      </span>
                      <span className="flex-1 truncate text-[17px] text-texto-2">{titulo}</span>
                      {notas && (
                        <form action={notas.crearEnlazada.bind(null, titulo, pagina.padre_id)}>
                          <button type="submit" className="rounded-full bg-naranja-relleno/15 px-3 py-1.5 text-[14px] font-semibold text-naranja active:scale-95">
                            Crear
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mencionan.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="px-1 text-[13px] font-semibold text-texto-2">Te mencionan</p>
                <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
                  {mencionan.map((p) => (
                    <FilaEnlace key={p.id} p={p} base={base} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={enlace(base, `/apuntes/${pagina.id}/imprimir`)}
          className="flex items-center justify-center gap-2 rounded-[18px] bg-superficie py-3 text-[15px] font-semibold active:scale-[0.98]"
        >
          <Icono nombre="compartir" className="size-5 text-naranja" />
          Exportar a PDF
        </a>
        <a
          href={`/apuntes/${pagina.id}/markdown`}
          download
          className="flex items-center justify-center gap-2 rounded-[18px] bg-superficie py-3 text-[15px] font-semibold active:scale-[0.98]"
        >
          <Icono nombre="apuntes" className="size-5 text-naranja" />
          Markdown (.md)
        </a>
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
