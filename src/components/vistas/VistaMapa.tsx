import Link from "next/link";
import { LienzoMapa } from "@/components/apuntes/LienzoMapa";
import { Icono } from "@/components/Icono";
import { Pantalla, TituloSeccion, enlace } from "@/components/ui";
import type { Arista, NodoUbicado } from "@/lib/grafo";

type Props = { nodos: NodoUbicado[]; aristas: Arista[]; ancho: number; alto: number; total: number; base: string };

const corto = (t: string) => (t.length > 22 ? `${t.slice(0, 21)}…` : t || "Sin título");

/** Mapa de notas: tus páginas como puntos y sus conexiones ([[enlaces]] y páginas dentro de otras) como líneas. */
export function VistaMapa({ nodos, aristas, ancho, alto, total, base }: Props) {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const conEtiqueta = nodos.length <= 60;
  const masConectadas = [...nodos].filter((n) => n.grado > 0).sort((a, b) => b.grado - a.grado).slice(0, 8);
  const sueltas = nodos.filter((n) => n.grado === 0).length;

  return (
    <Pantalla>
      <header className="flex flex-col gap-3 pt-2">
        <Link href={enlace(base, "/apuntes")} className="flex w-fit items-center gap-1 text-[17px] text-naranja">
          <Icono nombre="atras" className="size-5" /> Apuntes
        </Link>
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Mapa de notas</h1>
      </header>

      {nodos.length === 0 ? (
        <p className="rounded-[22px] bg-superficie px-4 py-5 text-center text-[15px] leading-relaxed text-texto-2">
          Aún no tienes páginas. Crea algunas y enlázalas escribiendo [[ y el título de otra página.
        </p>
      ) : (
        <>
          <LienzoMapa>
            <svg viewBox={`0 0 ${ancho} ${alto}`} width={ancho} height={alto} role="img" aria-label={`Mapa con ${nodos.length} páginas y ${aristas.length} conexiones`}>
              <g>
                {aristas.map((a) => {
                  const o = porId.get(a.origen);
                  const d = porId.get(a.destino);
                  if (!o || !d) return null;
                  return (
                    <line
                      key={`${a.origen}-${a.destino}`}
                      x1={o.x}
                      y1={o.y}
                      x2={d.x}
                      y2={d.y}
                      className={a.tipo === "enlace" ? "stroke-naranja-relleno/60" : "stroke-texto-2/30"}
                      strokeWidth={a.tipo === "enlace" ? 1.6 : 1.2}
                      strokeDasharray={a.tipo === "dentro" ? "4 4" : undefined}
                    />
                  );
                })}
              </g>
              <g>
                {nodos.map((n) => {
                  const radio = 6 + Math.min(10, n.grado * 1.5);
                  return (
                    <a key={n.id} href={enlace(base, `/apuntes/${n.id}`)} aria-label={`${n.titulo || "Sin título"}: ${n.grado} conexiones`}>
                      <circle cx={n.x} cy={n.y} r={radio} className={n.grado > 0 ? "fill-naranja-relleno" : "fill-texto-2/40"} />
                      {(conEtiqueta || n.grado >= 2) && (
                        <text x={n.x} y={n.y + radio + 14} textAnchor="middle" className="fill-texto text-[13px] font-semibold">
                          {corto(n.titulo)}
                        </text>
                      )}
                    </a>
                  );
                })}
              </g>
            </svg>
          </LienzoMapa>
          <p className="-mt-3 px-1 text-[13px] leading-5 text-texto-2">
            Línea continua: enlace con [[ ]]. Punteada: página dentro de otra.
            {total > nodos.length ? ` Se muestran las ${nodos.length} más conectadas de ${total}.` : ""}
            {sueltas > 0 ? ` ${sueltas} sin conexiones (en gris).` : ""}
          </p>
        </>
      )}

      {masConectadas.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="titulo-centrales">
          <TituloSeccion id="titulo-centrales" titulo="Las más conectadas" />
          <ul className="divide-y divide-separador/60 overflow-hidden rounded-[22px] bg-superficie">
            {masConectadas.map((n) => (
              <li key={n.id}>
                <Link href={enlace(base, `/apuntes/${n.id}`)} className="flex items-center gap-3 px-4 py-3 active:bg-control">
                  <span aria-hidden="true" className="w-6 text-center text-[20px]">
                    {n.icono || "📄"}
                  </span>
                  <span className="flex-1 truncate text-[17px]">{n.titulo || "Sin título"}</span>
                  <span className="text-[15px] text-texto-2">{n.grado}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Pantalla>
  );
}
