import Link from "next/link";
import type { AccionesApuntes } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { Encabezado, Pantalla, TituloSeccion, enlace } from "@/components/ui";
import type { PaginaResumen } from "@/lib/datos/paginas";
import { etiquetaFecha, hoyLima } from "@/lib/fechas";

type Props = {
  paginas: (PaginaResumen & { hijas: number })[];
  hoy: string;
  base: string;
  error?: boolean;
  acciones: Pick<AccionesApuntes, "crear">;
};

function FilaPagina({ p, hoy, base }: { p: PaginaResumen & { hijas: number }; hoy: string; base: string }) {
  return (
    <li>
      <Link href={enlace(base, `/apuntes/${p.id}`)} className="flex items-center gap-3 px-4 py-3 active:bg-control">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-naranja-relleno/15 text-[20px]">
          {p.icono || <Icono nombre="apuntes" className="size-5 text-naranja" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[17px] font-semibold">{p.titulo || "Sin título"}</span>
          <span className="text-[13px] text-texto-2">
            {etiquetaFecha(hoyLima(new Date(p.actualizado)), hoy)}
            {p.hijas > 0 && ` · ${p.hijas} ${p.hijas === 1 ? "subpágina" : "subpáginas"}`}
          </span>
        </span>
        <Icono nombre="adelante" className="size-4 shrink-0 text-texto-2" />
      </Link>
    </li>
  );
}

export function VistaApuntes({ paginas, hoy, base, error, acciones }: Props) {
  const favoritas = paginas.filter((p) => p.favorita);
  const raiz = paginas.filter((p) => !p.padre_id);

  return (
    <Pantalla>
      <Encabezado titulo="Apuntes" />

      <form action={acciones.crear.bind(null, null)}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-naranja-relleno py-4 text-[17px] font-bold text-[#1d1d1f] transition active:scale-[0.98]"
        >
          <Icono nombre="mas" className="size-5" />
          Nueva página
        </button>
      </form>
      {error && <p className="text-center text-[15px] text-rojo">No se pudo crear la página. Puede que llegaras al máximo.</p>}

      {favoritas.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-favoritas">
          <TituloSeccion id="titulo-favoritas" titulo="Favoritas" />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {favoritas.map((p) => (
              <FilaPagina key={p.id} p={p} hoy={hoy} base={base} />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="titulo-paginas">
        <TituloSeccion id="titulo-paginas" titulo="Páginas" extra={raiz.length || undefined} />
        {raiz.length > 0 ? (
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {raiz.map((p) => (
              <FilaPagina key={p.id} p={p} hoy={hoy} base={base} />
            ))}
          </ul>
        ) : (
          <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
            Aún no tienes apuntes. Crea una página para tus clases, ideas o proyectos; dentro puedes crear más páginas.
          </p>
        )}
      </section>
    </Pantalla>
  );
}
