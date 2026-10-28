import { FUNCIONES_IA, type FuncionIa } from "@/lib/ia/funciones";

export type UsoIa = {
  usados: number;
  tope: number;
  funciones: { funcion: string; usados: number; tope: number; periodo: string }[];
};

/** Cuánta IA usaste hoy, con el tope de cada función, y cómo se trata lo que envías. */
export function MedidorIa({ uso, configurada }: { uso: UsoIa; configurada: boolean }) {
  const fraccion = Math.min(1, uso.usados / Math.max(1, uso.tope));
  const lleno = uso.usados >= uso.tope;

  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-ia">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-ia" className="text-[17px] font-semibold">
          Inteligencia artificial
        </h2>
        <span className={`text-[15px] tabular-nums ${lleno ? "font-semibold text-rojo" : "text-texto-2"}`}>
          {uso.usados} de {uso.tope} hoy
        </span>
      </div>
      <svg className={`h-2.5 w-full ${lleno ? "text-rojo-relleno" : "text-morado-relleno"}`} role="img" aria-label={`IA: ${uso.usados} de ${uso.tope} usos hoy`}>
        <rect width="100%" height="100%" rx="5" fill="currentColor" fillOpacity={0.18} />
        <rect width={`${Math.max(fraccion * 100, uso.usados > 0 ? 2 : 0)}%`} height="100%" rx="5" fill="currentColor" />
      </svg>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
        {uso.funciones.map((f) => (
          <li key={f.funcion} className="flex justify-between gap-2">
            <span className="truncate text-texto-2">{FUNCIONES_IA[f.funcion as FuncionIa] ?? f.funcion}</span>
            <span className={`tabular-nums ${f.usados >= f.tope ? "font-semibold text-rojo" : ""}`}>
              {f.usados}/{f.tope}
              {f.periodo === "semana" ? " sem." : ""}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[13px] leading-5 text-texto-2">
        {configurada ? "" : "La IA se activará cuando esté configurada. "}
        Solo actúa cuando tocas ✨. Usa Gemini gratis de Google: lo que envías puede usarse para mejorar sus productos, así que evita datos
        sensibles. Los usos se renuevan a las 00:00.
      </p>
    </section>
  );
}
