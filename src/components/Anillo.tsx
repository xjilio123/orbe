/**
 * Anillo de progreso al estilo Actividad del Apple Watch (SVG puro, sin estilos inline).
 * Sin `etiqueta` es decorativo (lo describe el botón o texto que lo rodea).
 */
export function Anillo({
  fraccion,
  etiqueta,
  clase = "text-indigo-relleno",
  tamano = "size-16",
}: {
  fraccion: number;
  etiqueta?: string;
  clase?: string;
  tamano?: string;
}) {
  const radio = 26;
  const circunferencia = 2 * Math.PI * radio;
  const largo = Math.min(1, Math.max(0, fraccion)) * circunferencia;
  return (
    <svg
      viewBox="0 0 64 64"
      className={`${tamano} shrink-0 -rotate-90 ${clase}`}
      {...(etiqueta ? { role: "img", "aria-label": etiqueta } : { "aria-hidden": true })}
    >
      <circle cx={32} cy={32} r={radio} fill="none" stroke="currentColor" strokeOpacity={0.18} strokeWidth={9} />
      {largo > 0 && (
        <circle
          cx={32}
          cy={32}
          r={radio}
          fill="none"
          stroke="currentColor"
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${largo} ${circunferencia}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      )}
    </svg>
  );
}
