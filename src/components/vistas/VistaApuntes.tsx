import Link from "next/link";
import type { AccionesNotas } from "@/app/acciones/tipos";
import { ImportarMarkdown } from "@/components/apuntes/ImportarMarkdown";
import { Icono, type NombreIcono } from "@/components/Icono";
import { Encabezado, Pantalla, TituloSeccion, enlace } from "@/components/ui";
import type { PaginaResumen } from "@/lib/datos/paginas";
import { etiquetaFecha, hoyLima } from "@/lib/fechas";

type Props = {
  paginas: (PaginaResumen & { hijas: number })[];
  hoy: string;
  base: string;
  error?: boolean;
  notas?: AccionesNotas;
  /** Cómo se ven las páginas: lista (por defecto) o galería de tarjetas. */
  vista?: "lista" | "galeria";
};

const HERRAMIENTAS: { ruta: string; nombre: string; icono: NombreIcono; clase: string }[] = [
  { ruta: "/preguntar", nombre: "Pregunta a tus notas", icono: "chispa", clase: "bg-morado-relleno/12 text-morado" },
  { ruta: "/apuntes/mapa", nombre: "Mapa de notas", icono: "mapa", clase: "bg-naranja-relleno/15 text-naranja" },
  { ruta: "/estudio", nombre: "Modo estudio", icono: "estudio", clase: "bg-azul-relleno/12 text-azul" },
  { ruta: "/diario", nombre: "Diario", icono: "diario", clase: "bg-verde-relleno/15 text-verde" },
];

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

export function VistaApuntes({ paginas, hoy, base, error, notas, vista = "lista" }: Props) {
  const favoritas = paginas.filter((p) => p.favorita);
  const raiz = paginas.filter((p) => !p.padre_id);

  return (
    <Pantalla>
      <Encabezado titulo="Apuntes" />

      <Link
        href={enlace(base, "/apuntes/nueva")}
        className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-naranja-relleno py-4 text-[17px] font-bold text-[#1d1d1f] transition active:scale-[0.98]"
      >
        <Icono nombre="mas" className="size-5" />
        Nueva página
      </Link>
      <nav aria-label="Herramientas de apuntes" className="-mt-3 grid grid-cols-2 gap-2">
        {HERRAMIENTAS.map((h) => (
          <Link
            key={h.ruta}
            href={enlace(base, h.ruta)}
            className={`flex items-center justify-center gap-2 rounded-[16px] py-3 text-[15px] font-semibold active:scale-[0.98] ${h.clase}`}
          >
            <Icono nombre={h.icono} className="size-4 shrink-0" />
            <span className="truncate">{h.nombre}</span>
          </Link>
        ))}
      </nav>
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
        <TituloSeccion
          id="titulo-paginas"
          titulo="Páginas"
          extra={
            <nav aria-label="Vista de páginas" className="flex rounded-[10px] bg-control p-0.5">
              {(["lista", "galeria"] as const).map((v) => (
                <Link
                  key={v}
                  href={enlace(base, v === "lista" ? "/apuntes" : "/apuntes?vista=galeria")}
                  aria-current={vista === v ? "page" : undefined}
                  aria-label={v === "lista" ? "Ver como lista" : "Ver como galería"}
                  className={`grid size-8 place-items-center rounded-[8px] ${vista === v ? "bg-superficie text-texto shadow-sm" : "text-texto-2"}`}
                >
                  <Icono nombre={v} className="size-4" />
                </Link>
              ))}
            </nav>
          }
        />
        {raiz.length > 0 && vista === "galeria" ? (
          <ul className="grid grid-cols-2 gap-2">
            {raiz.map((p) => (
              <li key={p.id}>
                <Link href={enlace(base, `/apuntes/${p.id}`)} className="flex h-full flex-col gap-2 rounded-[20px] bg-superficie p-3.5 active:scale-[0.98]">
                  <span aria-hidden="true" className="grid h-16 place-items-center rounded-[14px] bg-naranja-relleno/15 text-[34px]">
                    {p.icono || "📄"}
                  </span>
                  <span className="line-clamp-2 text-[15px] leading-snug font-semibold">{p.titulo || "Sin título"}</span>
                  <span className="mt-auto text-[12px] text-texto-2">
                    {etiquetaFecha(hoyLima(new Date(p.actualizado)), hoy)}
                    {p.hijas > 0 && ` · ${p.hijas}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : raiz.length > 0 ? (
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

      <section className="flex flex-col gap-2" aria-labelledby="titulo-traer">
        <TituloSeccion id="titulo-traer" titulo="Importar y exportar" />
        {notas && <ImportarMarkdown importar={notas.importar} base={base} />}
        <a href="/apuntes/exportar" download className="flex items-center gap-3 rounded-[18px] bg-superficie px-4 py-3 active:scale-[0.99]">
          <Icono nombre="compartir" className="size-5 text-naranja" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[17px] font-semibold">Exportar todo (.zip)</span>
            <span className="text-[13px] text-texto-2">Tus páginas como archivos .md, listas para Obsidian.</span>
          </span>
        </a>
      </section>
    </Pantalla>
  );
}
