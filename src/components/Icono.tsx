// Íconos de trazo al estilo SF Symbols (dibujados a mano: la licencia de SF Symbols no permite usarlos en la web).
const trazos = {
  hoy: "M3 10.5 12 3l9 7.5M5.5 9v11h4.5v-6h4v6h4.5V9",
  tareas: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM8 12.5l2.8 2.8L16.5 9.5",
  apuntes: "M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5ZM14.5 3.5V8h4.5M9 12h6M9 16h6",
  agenda: "M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2ZM4.5 10h15M8.5 3v3M15.5 3v3",
  ajustes: "M4 7h9M17 7h3M4 17h3M11 17h9M15 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  inbox: "M4 13.5 6.5 5h11l2.5 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1ZM4 13.5h4.5l1.5 2.5h4l1.5-2.5H20",
  campana: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15ZM10 20a2 2 0 0 0 4 0",
  mas: "M12 5v14M5 12h14",
  salir: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4",
  compartir: "M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1",
  check: "M5 12.5l4.5 4.5L19 7.5",
  atras: "M15 5l-7 7 7 7",
  adelante: "M9 5l7 7-7 7",
  basura: "M4 7h16M10 11v6M14 11v6M5.5 7l.9 12.1A2 2 0 0 0 8.4 21h7.2a2 2 0 0 0 2-1.9L18.5 7M9 7V4.5h6V7",
  lista: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  tablero: "M4 4.5h4.5v15H4ZM10 4.5h4.5v10H10ZM16 4.5h4v6.5h-4Z",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  plantilla: "M4.5 5.5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v3h-15ZM4.5 11.5h6v8h-5a1 1 0 0 1-1-1ZM13.5 11.5h6v7a1 1 0 0 1-1 1h-5Z",
  papelera: "M4 7h16M10 11v6M14 11v6M5.5 7l.9 12.1A2 2 0 0 0 8.4 21h7.2a2 2 0 0 0 2-1.9L18.5 7M9 7V4.5h6V7",
  buscar: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  llama: "M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.7-8.3.4 2 1.5 3.2 2.6 3.6C12 7 13.4 4.6 15.5 3c-.3 3 3 5.4 3 10.6 0 3.8-2.6 7.4-6.5 7.4Z",
  meta: "M5.5 21V3.5M5.5 4.5h11.5l-2.2 4.25L17 13H5.5",
  foco: "M12 21a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM12 9.5v4l2.5 1.5M10 2.75h4M18.25 6.25l1.5-1.5",
  grafico: "M4 20h16M7 16.5v-5M12 16.5V6M17 16.5v-8",
  cerrar: "M6 6l12 12M18 6 6 18",
  pausa: "M8.5 5.5v13M15.5 5.5v13",
  play: "M7.5 5.2v13.6a.6.6 0 0 0 .9.5l10.6-6.8a.6.6 0 0 0 0-1L8.4 4.7a.6.6 0 0 0-.9.5Z",
  mapa: "M12 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM5 22.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM19 22.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM10.8 6.2 6.2 17.8M13.2 6.2l4.6 11.6M7.5 20h9",
  estudio: "M2.5 9 12 4.5 21.5 9 12 13.5ZM6.5 11v4.5c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3V11M21.5 9v5.5",
  diario: "M6.5 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-11a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2ZM4.5 17.5a2 2 0 0 1 2-2h12M9 8h6",
  chispa: "M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9ZM18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z",
} as const;

export type NombreIcono = keyof typeof trazos;

export function Icono({ nombre, className = "size-6" }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={trazos[nombre]} />
    </svg>
  );
}

export function LogoGoogle({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
