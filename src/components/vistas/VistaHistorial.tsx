import Link from "next/link";
import type { AccionesApuntes } from "@/app/acciones/tipos";
import { VistaBloques } from "@/components/apuntes/VistaBloques";
import { Icono } from "@/components/Icono";
import { Pantalla, enlace } from "@/components/ui";
import type { Bloque } from "@/lib/bloques";
import { ZONA } from "@/lib/fechas";

export type Version = { hueco: number; titulo: string; icono: string; contenido: Bloque[]; creado: string };

type Props = {
  pagina: { id: string; titulo: string };
  versiones: Version[];
  base: string;
  acciones: Pick<AccionesApuntes, "restaurarVersion">;
};

const formato = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Las últimas 10 versiones de una página. Tocar una muestra cómo estaba; se puede volver a ella. */
export function VistaHistorial({ pagina, versiones, base, acciones }: Props) {
  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, `/apuntes/${pagina.id}`)} className="flex w-fit items-center gap-1 text-[17px] text-naranja">
          <Icono nombre="atras" className="size-5" /> {pagina.titulo || "Sin título"}
        </Link>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Historial</h1>
        <p className="text-[15px] text-texto-2">Orbe guarda cómo estaba la página cada vez que la editas tras 10 minutos. Se conservan las últimas 10.</p>
      </header>

      {versiones.length === 0 ? (
        <p className="rounded-[22px] bg-superficie px-4 py-6 text-center text-[15px] text-texto-2">Todavía no hay versiones anteriores.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {versiones.map((v) => (
            <li key={v.hueco}>
              <details className="group overflow-hidden rounded-[22px] bg-superficie">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                  <span aria-hidden="true" className="w-6 text-center text-[20px]">
                    {v.icono || "📄"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[17px] font-semibold first-letter:uppercase">{formato.format(new Date(v.creado)).replace(".", "")}</span>
                    <span className="truncate text-[13px] text-texto-2">{v.titulo || "Sin título"}</span>
                  </span>
                  <Icono nombre="adelante" className="size-4 shrink-0 text-texto-2 transition-transform group-open:rotate-90" />
                </summary>
                <div className="flex flex-col gap-4 border-t border-separador/60 px-4 py-4">
                  <VistaBloques bloques={v.contenido} />
                  <form action={acciones.restaurarVersion.bind(null, pagina.id, v.hueco)}>
                    <button type="submit" className="w-full rounded-[14px] bg-naranja-relleno py-2.5 text-[15px] font-bold text-[#1d1d1f] active:scale-[0.98]">
                      Volver a esta versión
                    </button>
                  </form>
                  <p className="text-center text-[13px] text-texto-2">Lo que tienes ahora queda guardado en el historial.</p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Pantalla>
  );
}
