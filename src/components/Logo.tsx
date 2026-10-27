// Logo de Orbe: cuatro arcos (azul tareas, verde hábitos, rojo recordatorios, morado calendario)
// alrededor de un check. Mismo dibujo que los íconos de la app (public/iconos).

const ARCOS = [
  { color: "text-azul-relleno", giro: -119.72 },
  { color: "text-verde-relleno", giro: -29.72 },
  { color: "text-rojo-relleno", giro: 60.28 },
  { color: "text-morado-relleno", giro: 150.28 },
] as const;

/** Solo el anillo y el check, sin fondo: se adapta al tema con los colores del sistema. */
export function Logo({ className = "size-24", etiqueta = "Logo de Orbe" }: { className?: string; etiqueta?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} role="img" aria-label={etiqueta}>
      <g fill="none" strokeWidth={40} strokeLinecap="round">
        {ARCOS.map((a) => (
          <circle
            key={a.giro}
            cx={256}
            cy={256}
            r={150}
            stroke="currentColor"
            className={a.color}
            strokeDasharray="155.6 786.9"
            transform={`rotate(${a.giro} 256 256)`}
          />
        ))}
      </g>
      <path
        d="M200 258 L240 298 L316 214"
        fill="none"
        stroke="currentColor"
        className="text-texto"
        strokeWidth={40}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
