import Link from "next/link";
import type { AccionesEstudio } from "@/app/acciones/tipos";
import { SelectorAnimo } from "@/components/estudio/SelectorAnimo";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import { INICIALES_SEMANA } from "@/lib/agenda";
import { animo, celdasDelMes, moverMesDiario, nombreMesDiario, resumenAnimo, tituloDiario, type DiaDiario } from "@/lib/estudio";

type Props = {
  hoy: string;
  mes: string;
  dias: DiaDiario[];
  base: string;
  error?: boolean;
  acciones: Pick<AccionesEstudio, "marcarAnimo" | "abrirDiario">;
};

/** Diario: cómo te sientes hoy, la página de hoy y el mes de un vistazo. */
export function VistaDiario({ hoy, mes, dias, base, error, acciones }: Props) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const deHoy = porFecha.get(hoy);
  const r = resumenAnimo(dias.filter((d) => d.fecha.startsWith(mes)));
  const esEsteMes = hoy.startsWith(mes);

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/apuntes")} className="flex w-fit items-center gap-1 text-[17px] text-naranja">
          <Icono nombre="atras" className="size-5" /> Apuntes
        </Link>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Diario</h1>
      </header>

      <section aria-labelledby="titulo-hoy-diario" className="flex flex-col gap-4 rounded-[22px] bg-superficie p-4">
        <div className="flex flex-col gap-0.5">
          <h2 id="titulo-hoy-diario" className="text-[20px] font-bold tracking-tight">
            ¿Cómo te sientes hoy?
          </h2>
          <p className="text-[13px] text-texto-2">{tituloDiario(hoy)}</p>
        </div>
        <SelectorAnimo fecha={hoy} animo={deHoy?.animo ?? null} marcar={acciones.marcarAnimo} />
        <form action={acciones.abrirDiario.bind(null, hoy)} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-naranja-relleno py-3.5 text-[17px] font-bold text-[#1d1d1f] active:scale-[0.98]"
          >
            📔 {deHoy?.pagina_id ? "Abrir el diario de hoy" : "Escribir el diario de hoy"}
          </button>
        </form>
        {error && <p className="text-[13px] text-rojo">No se pudo crear la página. Puede que llegaras al máximo.</p>}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-mes">
        <div className="flex items-center justify-between px-1">
          <h2 id="titulo-mes" className="text-[20px] font-bold tracking-tight first-letter:uppercase">
            {nombreMesDiario(mes)}
          </h2>
          <div className="flex gap-1">
            <Link href={enlace(base, `/diario?mes=${moverMesDiario(mes, -1)}`)} aria-label="Mes anterior" className="grid size-9 place-items-center rounded-full bg-superficie text-texto-2 active:scale-95">
              <Icono nombre="atras" className="size-4" />
            </Link>
            {!esEsteMes && (
              <Link href={enlace(base, `/diario?mes=${moverMesDiario(mes, 1)}`)} aria-label="Mes siguiente" className="grid size-9 place-items-center rounded-full bg-superficie text-texto-2 active:scale-95">
                <Icono nombre="adelante" className="size-4" />
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-[22px] bg-superficie p-3">
          <div className="grid grid-cols-7 gap-1 text-center" aria-hidden="true">
            {INICIALES_SEMANA.map((l, i) => (
              <span key={i} className="text-[11px] font-semibold text-texto-2">
                {l}
              </span>
            ))}
          </div>
          <ol className="mt-1 grid grid-cols-7 gap-1" aria-label={`Ánimo de ${nombreMesDiario(mes)}`}>
            {celdasDelMes(mes).map((fecha, i) => {
              if (!fecha) return <li key={`hueco-${i}`} aria-hidden="true" />;
              const d = porFecha.get(fecha);
              const a = animo(d?.animo);
              const contenido = (
                <>
                  <span className={`text-[11px] ${fecha === hoy ? "font-bold text-texto" : "text-texto-2"}`}>{Number(fecha.slice(8))}</span>
                  <span className="text-[20px] leading-none">{a ? a.emoji : fecha > hoy ? "" : "·"}</span>
                  {d?.pagina_id && <span className="size-1 rounded-full bg-naranja" />}
                </>
              );
              const etiqueta = `${Number(fecha.slice(8))}: ${a ? a.nombre : "sin anotar"}${d?.pagina_id ? ", con página" : ""}`;
              const clase = `flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[10px] ${fecha === hoy ? "ring-2 ring-naranja-relleno" : ""} ${a ? "bg-control/70" : ""}`;
              return (
                <li key={fecha}>
                  {d?.pagina_id ? (
                    <Link href={enlace(base, `/apuntes/${d.pagina_id}`)} aria-label={etiqueta} className={clase}>
                      {contenido}
                    </Link>
                  ) : (
                    <span aria-label={etiqueta} className={clase}>
                      {contenido}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-resumen-mes">
        <TituloSeccion id="titulo-resumen-mes" titulo="Resumen del mes" />
        <div className="flex flex-col gap-4 rounded-[22px] bg-superficie p-4">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col gap-0.5">
              <dt className="order-2 text-[12px] text-texto-2">días anotados</dt>
              <dd className="text-[26px] font-bold tabular-nums">{r.registrados}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="order-2 text-[12px] text-texto-2">ánimo promedio</dt>
              <dd className="text-[26px] font-bold">{r.emojiPromedio ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="order-2 text-[12px] text-texto-2">páginas escritas</dt>
              <dd className="text-[26px] font-bold tabular-nums">{r.escritos}</dd>
            </div>
          </dl>
          <ul className="flex flex-col gap-1.5" aria-label="Días de cada ánimo">
            {[...r.conteo].reverse().map((c) => (
              <li key={c.valor} className="flex items-center gap-2">
                <span aria-hidden="true" className="w-7 text-center text-[18px]">
                  {c.emoji}
                </span>
                <span className="w-16 text-[13px] text-texto-2">{c.nombre}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-control">
                  <div className={`h-full origin-left rounded-full ${c.clase}`} style={{ transform: `scaleX(${c.dias / r.maximo})` }} />
                </div>
                <span className="w-6 text-right text-[13px] font-semibold tabular-nums">{c.dias}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Pantalla>
  );
}
