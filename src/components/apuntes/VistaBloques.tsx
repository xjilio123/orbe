import { numeracion, type Bloque } from "@/lib/bloques";

/**
 * Una página en solo lectura (historial y versión para imprimir). Con `urls`, las fotos se ven;
 * sin ellas, fotos y PDF se muestran como un rótulo.
 */
export function VistaBloques({ bloques, urls }: { bloques: Bloque[]; urls?: Record<string, string> }) {
  const numeros = numeracion(bloques);
  if (bloques.every((b) => !b.texto.trim() && b.tipo !== "imagen" && b.tipo !== "archivo")) {
    return <p className="text-[15px] text-texto-2">Página vacía.</p>;
  }
  return (
    <div className="flex flex-col gap-1.5 text-[16px] leading-relaxed">
      {bloques.map((b) => {
        switch (b.tipo) {
          case "h1":
            return <p key={b.id} className="text-[24px] font-bold">{b.texto}</p>;
          case "h2":
            return <p key={b.id} className="text-[20px] font-bold">{b.texto}</p>;
          case "h3":
            return <p key={b.id} className="text-[17px] font-semibold">{b.texto}</p>;
          case "lista":
            return <p key={b.id} className="pl-4 before:-ml-4 before:inline-block before:w-4 before:content-['•']">{b.texto}</p>;
          case "num":
            return <p key={b.id} className="pl-1">{numeros.get(b.id)}. {b.texto}</p>;
          case "todo":
            return <p key={b.id} className={b.hecho ? "text-texto-2 line-through" : ""}>{b.hecho ? "☑" : "☐"} {b.texto}</p>;
          case "cita":
            return <p key={b.id} className="border-l-4 border-separador pl-3 italic">{b.texto}</p>;
          case "codigo":
            return <pre key={b.id} className="overflow-x-auto rounded-[10px] bg-control p-3 font-mono text-[13px] whitespace-pre-wrap">{b.texto}</pre>;
          case "aviso":
            return <p key={b.id} className="rounded-[10px] bg-naranja-relleno/12 px-3 py-2">{b.texto}</p>;
          case "separador":
            return <hr key={b.id} className="my-2 border-separador" />;
          case "imagen": {
            const url = b.adjunto ? urls?.[b.adjunto] : undefined;
            return url ? (
              <figure key={b.id} className="my-1 break-inside-avoid">
                {/* eslint-disable-next-line @next/next/no-img-element -- enlace firmado y temporal de un archivo privado */}
                <img src={url} alt={b.texto || "Foto del apunte"} width={b.ancho} height={b.alto} className="h-auto max-w-full rounded-[12px]" />
                {b.texto && <figcaption className="mt-1 text-[13px] text-texto-2">{b.texto}</figcaption>}
              </figure>
            ) : (
              <p key={b.id} className="text-[13px] text-texto-2">🖼️ Foto{b.texto ? `: ${b.texto}` : ""}</p>
            );
          }
          case "archivo":
            return <p key={b.id} className="text-[13px] text-texto-2">📎 PDF{b.texto ? `: ${b.texto}` : ""}</p>;
          default:
            return b.texto ? <p key={b.id}>{b.texto}</p> : null;
        }
      })}
    </div>
  );
}
