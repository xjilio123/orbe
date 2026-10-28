import { fechaCorta } from "@/lib/progreso";

type Props = {
  titulo: string;
  valores: { semana: string; valor: number }[];
  maximo: number;
  /** Clase de fondo de las barras (la de la semana actual va más intensa). */
  color: string;
  formato?: (n: number) => string;
};

/**
 * Barras por semana (de la más antigua a la actual), sin librerías de gráficos.
 * Altura fija: no se mueve nada al cargar. La tabla oculta da los mismos datos a lectores de pantalla.
 */
export function Barras({ titulo, valores, maximo, color, formato = String }: Props) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-[13px] font-semibold text-texto-2">{titulo}</figcaption>
      <div aria-hidden="true" className="flex h-28 items-end gap-1.5">
        {valores.map((v, i) => {
          const actual = i === valores.length - 1;
          // Hasta 82 %: arriba queda lugar para el número.
          const alto = v.valor === 0 ? 4 : Math.max(8, Math.round((v.valor / maximo) * 82));
          return (
            <div key={v.semana} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className={`text-[11px] tabular-nums ${actual ? "font-semibold" : "text-texto-2"}`}>{v.valor > 0 ? formato(v.valor) : ""}</span>
              <div className={`w-full rounded-[6px] ${color} ${actual ? "" : "opacity-45"}`} style={{ height: `${alto}%` }} />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="flex gap-1.5">
        {valores.map((v, i) => (
          <span key={v.semana} className="flex-1 text-center text-[10px] text-texto-2">
            {i === valores.length - 1 ? "Esta" : fechaCorta(v.semana)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th>Semana del</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {valores.map((v) => (
            <tr key={v.semana}>
              <td>{fechaCorta(v.semana)}</td>
              <td>{formato(v.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
