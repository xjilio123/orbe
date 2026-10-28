// Estados que devuelven las Server Actions a los formularios (useActionState).

export type EstadoFormulario = { ok?: boolean; errores?: Record<string, string> };

/** Captura y subtareas: `n` cambia en cada guardado para que el campo se vacíe. */
export type EstadoCaptura = { ok: boolean; error?: string; n: number; /** Se guardó en el teléfono para enviarla al volver internet. */ sinConexion?: boolean };

export const CAPTURA_INICIAL: EstadoCaptura = { ok: false, n: 0 };

export type ResultadoGuardado = { ok: boolean; error?: string };

export type ResultadoSubida =
  | { ok: true; adjunto: { id: string; tipo: string; nombre: string; tamano: number; url: string } }
  | { ok: false; error: string };

export type AccionesApuntes = {
  crear: (padreId: string | null, plantilla?: string) => Promise<void>;
  guardar: (id: string, datos: import("@/lib/bloques").DatosPagina) => Promise<ResultadoGuardado>;
  favorita: (id: string, favorita: boolean) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  subir: (paginaId: string, formData: FormData) => Promise<ResultadoSubida>;
  eliminarAdjunto: (id: string) => Promise<void>;
  plantilla: (id: string, plantilla: boolean) => Promise<void>;
  restaurarVersion: (paginaId: string, hueco: number) => Promise<void>;
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
  invitar: (anterior: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  quitarInvitado: (email: string) => Promise<void>;
};

export type AccionesPapelera = {
  restaurar: (tipo: string, id: string) => Promise<void>;
  eliminar: (tipo: string, id: string) => Promise<void>;
  vaciar: () => Promise<void>;
};

export type ResultadoBusqueda = { tipo: "tarea" | "pagina"; id: string; titulo: string; icono: string; detalle: string };
export type Buscar = (consulta: string) => Promise<ResultadoBusqueda[]>;

export type ResultadoIa<T> = { ok: true; datos: T } | { ok: false; error: string };

/** Funciones de IA que reciben las pantallas (la vitrina usa unas de mentira, sin Gemini). */
export type AccionesIa = {
  captura: (texto: string, extra?: { lista_id?: string; fecha_defecto?: string }) => Promise<ResultadoIa<{ titulos: string[] }>>;
  dividir: (tareaId: string) => Promise<ResultadoIa<{ pasos: number }>>;
  ordenarInbox: () => Promise<ResultadoIa<{ ordenadas: number }>>;
  texto: (modo: "mejorar" | "traducir", bloques: import("@/lib/bloques").Bloque[]) => Promise<ResultadoIa<{ id: string; texto: string }[]>>;
  resumir: (bloques: import("@/lib/bloques").Bloque[]) => Promise<ResultadoIa<{ resumen: string; puntos: string[] }>>;
  plan: () => Promise<ResultadoIa<import("@/lib/ia/contenido").Plan>>;
  semana: () => Promise<ResultadoIa<import("@/lib/ia/contenido").ResumenSemana>>;
  tarjetas: (paginaId: string, titulo: string, bloques: import("@/lib/bloques").Bloque[]) => Promise<ResultadoIa<{ id: string }>>;
  foto: (formData: FormData) => Promise<ResultadoIa<{ titulo: string; bloques: import("@/lib/bloques").Bloque[] }>>;
  audio: (formData: FormData) => Promise<ResultadoIa<{ titulo: string; bloques: import("@/lib/bloques").Bloque[] }>>;
  preguntar: (pregunta: string) => Promise<ResultadoIa<import("@/lib/ia/preguntar").Respuesta>>;
};
