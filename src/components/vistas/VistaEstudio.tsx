import Link from "next/link";
import type { AccionesEstudio } from "@/app/acciones/tipos";
import { FormularioExamen } from "@/components/estudio/FormularioExamen";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import type { CursoResumen } from "@/lib/estudio";
import { etiquetaFecha } from "@/lib/fechas";
import { textoFaltan } from "@/lib/progreso";

type Props = { cursos: CursoResumen[]; hoy: string; base: string; acciones: Pick<AccionesEstudio, "crearExamen"> };

/** Modo estudio: cada curso con sus temas, el próximo examen y sus tarjetas para repasar. */
export function VistaEstudio({ cursos, hoy, base, acciones }: Props) {
  const examenes = cursos
    .flatMap((c) => (c.examen ? [{ ...c.examen, curso: c }] : []))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/apuntes")} className="flex w-fit items-center gap-1 text-[17px] text-naranja">
          <Icono nombre="atras" className="size-5" /> Apuntes
        </Link>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Modo estudio</h1>
      </header>

      {examenes.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-examenes">
          <TituloSeccion id="titulo-examenes" titulo="Próximos exámenes" />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {examenes.map((e) => (
              <li key={`${e.curso.id}-${e.fecha}`} className="flex items-center gap-3 px-4 py-3">
                <span aria-hidden="true" className="w-7 text-center text-[22px]">
                  📝
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-[17px] font-semibold">{e.titulo}</p>
                  <p className="truncate text-[13px] text-texto-2">
                    {e.curso.titulo} · {etiquetaFecha(e.fecha, hoy)}
                  </p>
                </div>
                <span className="shrink-0 text-[15px] font-semibold text-rojo">{textoFaltan(e.fecha, hoy)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2" aria-labelledby="titulo-cursos">
        <TituloSeccion id="titulo-cursos" titulo="Tus cursos" extra={cursos.length || undefined} />
        {cursos.length === 0 ? (
          <div className="flex flex-col gap-2 rounded-[22px] bg-superficie px-4 py-5 text-[15px] leading-relaxed text-texto-2">
            <p>Convierte una página en curso: ábrela y toca <span className="font-semibold text-texto">Es un curso</span>.</p>
            <p>Sus páginas internas serán los temas, podrás anotar sus exámenes y repasar sus tarjetas (créalas con IA desde cualquier tema).</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {cursos.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
                <Link href={enlace(base, `/apuntes/${c.id}`)} className="flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-azul-relleno/15 text-[24px]">
                    {c.icono || "🎓"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[19px] font-bold">{c.titulo || "Sin título"}</span>
                    <span className="text-[13px] text-texto-2">
                      {c.temas} {c.temas === 1 ? "tema" : "temas"} · {c.tarjetas} {c.tarjetas === 1 ? "tarjeta" : "tarjetas"}
                    </span>
                  </span>
                  <Icono nombre="adelante" className="size-4 shrink-0 text-texto-2" />
                </Link>
                <p className="text-[15px]">
                  {c.examen ? (
                    <>
                      📝 {c.examen.titulo} · <span className="font-semibold text-rojo">{textoFaltan(c.examen.fecha, hoy)}</span>
                    </>
                  ) : (
                    <span className="text-texto-2">Sin exámenes anotados</span>
                  )}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <FormularioExamen accion={acciones.crearExamen.bind(null, c.id)} hoy={hoy} curso={c.titulo || "este curso"} />
                  {c.tarjetas > 0 && (
                    <Link
                      href={enlace(base, `/estudio/repaso?curso=${c.id}`)}
                      className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-azul-relleno px-4 py-2 text-[15px] font-semibold text-white active:scale-95"
                    >
                      🧠 Repasar
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Pantalla>
  );
}
