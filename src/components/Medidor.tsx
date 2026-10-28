import { tamanoLegible } from "@/lib/archivos";

type Uso = { archivos: number; archivosMax: number; texto: number; textoMax: number };

function Barra({ titulo, usado, maximo }: { titulo: string; usado: number; maximo: number }) {
  const fraccion = Math.min(1, usado / maximo);
  const alto = fraccion >= 0.8;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-[15px]">
        <span className="font-semibold">{titulo}</span>
        <span className={alto ? "font-semibold text-rojo" : "text-texto-2"}>
          {tamanoLegible(usado)} de {tamanoLegible(maximo)}
        </span>
      </div>
      {/* SVG en vez de un ancho con estilo inline: compatible con la CSP estricta. */}
      <svg className={`h-2.5 w-full ${alto ? "text-rojo-relleno" : "text-indigo-relleno"}`} role="img" aria-label={`${titulo}: ${Math.round(fraccion * 100)} % usado`}>
        <rect width="100%" height="100%" rx="5" fill="currentColor" fillOpacity={0.18} />
        <rect width={`${Math.max(fraccion * 100, usado > 0 ? 1 : 0)}%`} height="100%" rx="5" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Medidor de espacio de Ajustes: avisa al 80 % para no llegar al límite del plan gratis. */
export function Medidor({ uso }: { uso: Uso }) {
  const lleno = uso.archivos / uso.archivosMax >= 0.8 || uso.texto / uso.textoMax >= 0.8;
  return (
    <section className="flex flex-col gap-4 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-espacio">
      <div>
        <h2 id="titulo-espacio" className="text-[17px] font-semibold">
          Tu espacio
        </h2>
        <p className="text-[13px] text-texto-2">Orbe es gratis: cada persona tiene un espacio fijo.</p>
      </div>
      <Barra titulo="Fotos y PDF" usado={uso.archivos} maximo={uso.archivosMax} />
      <Barra titulo="Texto de apuntes" usado={uso.texto} maximo={uso.textoMax} />
      {lleno && (
        <p role="status" className="rounded-[14px] bg-rojo-relleno/12 px-3 py-2 text-[15px] text-rojo">
          Estás cerca del límite. Borra fotos o páginas que ya no uses para liberar espacio.
        </p>
      )}
    </section>
  );
}
