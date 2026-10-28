// Estados que devuelven las Server Actions a los formularios (useActionState).

export type EstadoFormulario = { ok?: boolean; errores?: Record<string, string> };

/** Captura y subtareas: `n` cambia en cada guardado para que el campo se vacíe. */
export type EstadoCaptura = { ok: boolean; error?: string; n: number };

export const CAPTURA_INICIAL: EstadoCaptura = { ok: false, n: 0 };

export type ResultadoGuardado = { ok: boolean; error?: string };

export type ResultadoSubida =
  | { ok: true; adjunto: { id: string; tipo: string; nombre: string; tamano: number; url: string } }
  | { ok: false; error: string };

export type AccionesApuntes = {
  crear: (padreId: string | null) => Promise<void>;
  guardar: (id: string, datos: import("@/lib/bloques").DatosPagina) => Promise<ResultadoGuardado>;
  favorita: (id: string, favorita: boolean) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  subir: (paginaId: string, formData: FormData) => Promise<ResultadoSubida>;
  eliminarAdjunto: (id: string) => Promise<void>;
};

/** Acciones que reciben las pantallas: la app usa las reales y la vitrina unas que no hacen nada. */
export type AccionesTareas = {
  capturar: (anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>;
  alternar: (id: string, hecha: boolean) => Promise<void>;
  mover: (id: string, estado: string) => Promise<void>;
  guardar: (id: string, anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  eliminar: (id: string, volverA: string) => Promise<void>;
  crearSubtarea: (padreId: string, anterior: EstadoCaptura, formData: FormData) => Promise<EstadoCaptura>;
  crearLista: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  guardarLista: (id: string, anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  eliminarLista: (id: string) => Promise<void>;
};

export type AccionesAjustes = {
  guardarSuscripcion: (datos: unknown) => Promise<ResultadoGuardado>;
  quitarSuscripcion: (endpoint: string) => Promise<void>;
  probarAvisos: () => Promise<ResultadoGuardado>;
  guardarCalendario: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  quitarCalendario: () => Promise<void>;
};
