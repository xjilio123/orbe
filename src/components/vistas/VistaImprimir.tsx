import Link from "next/link";
import { BotonImprimir } from "@/components/apuntes/BotonImprimir";
import { VistaBloques } from "@/components/apuntes/VistaBloques";
import { Icono } from "@/components/Icono";
import { Pantalla, enlace } from "@/components/ui";
import type { Pagina } from "@/lib/datos/paginas";

/** Versión limpia de una página para imprimir o guardar como PDF (sin barras ni botones al imprimir). */
export function VistaImprimir({ pagina, urls, base }: { pagina: Pagina; urls: Record<string, string>; base: string }) {
  return (
    <Pantalla>
      <header className="flex items-center pt-2 print:hidden">
        <Link href={enlace(base, `/apuntes/${pagina.id}`)} className="flex items-center gap-1 text-[17px] text-naranja">
          <Icono nombre="atras" className="size-5" />
          Volver a la página
        </Link>
      </header>
      <BotonImprimir />
      <p className="-mt-3 px-1 text-[13px] leading-5 text-texto-2 print:hidden">
        En iPhone: toca el botón, luego Compartir (arriba) y “Guardar en Archivos” para tener el PDF.
      </p>
      <article className="flex flex-col gap-4 rounded-[22px] bg-superficie p-5 print:rounded-none print:bg-transparent print:p-0">
        <h1 className="text-[30px] leading-tight font-bold tracking-tight">
          {pagina.icono && <span className="mr-2">{pagina.icono}</span>}
          {pagina.titulo || "Sin título"}
        </h1>
        <VistaBloques bloques={pagina.contenido} urls={urls} />
      </article>
    </Pantalla>
  );
}
