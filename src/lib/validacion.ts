import { z } from "zod";
import { limpiarPlazo, revisarPlazo, type Plazo } from "./plazo";
import { REPETICIONES, VALORES_AVISO } from "./repeticion";
import { COLORES_LISTA, ESTADOS } from "./tareas";

// Todo lo que llega del navegador se valida aquí antes de tocar la base.
// La base vuelve a validar con CHECK y RLS: si algo se salta esta capa, igual no entra.

const textoLimpio = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));

// Vacío o ausente = sin fecha / sin hora.
const fechaOpcional = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? s.trim() : null))
  .pipe(z.iso.date("Fecha no válida").nullable());

const horaOpcional = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? s.trim().slice(0, 5) : null))
  .pipe(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora no válida").nullable());

/** El inicio y el fin tienen que tener sentido; el error sale junto al campo que hay que corregir. */
const plazoConSentido = (p: Plazo, ctx: z.RefinementCtx) => {
  const error = revisarPlazo(p);
  if (error) ctx.addIssue({ code: "custom", message: error.mensaje, path: [error.campo] });
};

const idOpcional = z
  .string()
  .trim()
  .transform((s) => (s === "" ? null : s))
  .pipe(z.uuid().nullable());

// Campos que pueden no venir (vacío o ausente = ninguno).
const repetirOpcional = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? s.trim() : null))
  .pipe(z.enum(REPETICIONES).nullable());

const avisoOpcional = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? Number(s) : null))
  .pipe(z.union([z.literal(VALORES_AVISO), z.null()]));

export const esquemaId = z.uuid();
export const esquemaFecha = z.iso.date();
export const esquemaEstado = z.enum(ESTADOS);

export const esquemaCaptura = z.object({ texto: textoLimpio(300).pipe(z.string().min(1, "Escribe algo para guardar")) });

export const esquemaTarea = z
  .object({
    titulo: textoLimpio(200).pipe(z.string().min(1, "El título no puede quedar vacío")),
    notas: z.string().max(2000, "Las notas pueden tener hasta 2000 caracteres"),
    estado: esquemaEstado,
    prioridad: z.coerce.number().int().min(0).max(3),
    fecha: fechaOpcional,
    hora: horaOpcional,
    fecha_fin: fechaOpcional,
    hora_fin: horaOpcional,
    lista_id: idOpcional,
    repetir: repetirOpcional,
    aviso: avisoOpcional,
  })
  .superRefine(plazoConSentido)
  .refine((t) => t.repetir === null || t.fecha !== null, { message: "Para repetirla, elige la fecha de la primera vez", path: ["repetir"] })
  .transform((t) => limpiarPlazo(t));

export const esquemaSubtarea = z.object({ titulo: textoLimpio(200).pipe(z.string().min(1, "Escribe la subtarea")) });

export const esquemaLista = z.object({
  nombre: textoLimpio(60).pipe(z.string().min(1, "Ponle un nombre a la lista")),
  color: z.enum(COLORES_LISTA),
});

// ---------- Progreso: hábitos, metas, fechas importantes y foco ----------

const icono = (porDefecto: string) =>
  z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : porDefecto))
    .pipe(z.string().min(1).max(8, "Usa un solo emoji"));

const numeroPositivo = (mensaje: string) =>
  z
    .string()
    .trim()
    .transform((s) => Number(s.replace(",", ".")))
    .pipe(z.number({ error: mensaje }).positive(mensaje).max(1_000_000_000, "Ese número es demasiado grande"));

export const esquemaHabito = z.object({
  nombre: textoLimpio(60).pipe(z.string().min(1, "Ponle un nombre al hábito")),
  icono: icono("✅"),
  color: z.enum(COLORES_LISTA),
  dias_semana: z.coerce.number().int().min(1).max(7),
});

export const esquemaMeta = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("numero"),
    titulo: textoLimpio(120).pipe(z.string().min(1, "Escribe tu meta")),
    objetivo: numeroPositivo("Escribe cuánto quieres lograr (un número mayor que 0)"),
    unidad: textoLimpio(20),
    color: z.enum(COLORES_LISTA),
  }),
  z.object({
    tipo: z.literal("lista"),
    titulo: textoLimpio(120).pipe(z.string().min(1, "Escribe tu meta")),
    lista_id: z.uuid("Elige la lista que mide tu avance"),
    color: z.enum(COLORES_LISTA),
  }),
]);

export const esquemaFechaImportante = z
  .object({
    titulo: textoLimpio(80).pipe(z.string().min(1, "Escribe qué pasa ese día")),
    fecha: z.iso.date("Elige la fecha"),
    hora: horaOpcional,
    fecha_fin: fechaOpcional,
    hora_fin: horaOpcional,
    icono: icono("📅"),
    color: z.enum(COLORES_LISTA),
  })
  .superRefine(plazoConSentido)
  .transform((f) => limpiarPlazo(f));

export const esquemaSesionFoco = z.object({
  tarea_id: z.uuid().nullable(),
  inicio: z.iso.datetime({ offset: true }),
  minutos: z.number().int().min(1).max(180),
});

/** Convierte un FormData en objeto plano (solo campos de texto). */
export function datosDe(formData: FormData): Record<string, string> {
  const datos: Record<string, string> = {};
  formData.forEach((valor, campo) => {
    if (typeof valor === "string" && !campo.startsWith("$")) datos[campo] = valor;
  });
  return datos;
}

/** Primer mensaje de error de cada campo, para mostrarlo junto al campo. */
export function erroresDe(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const e of error.issues) {
    const campo = String(e.path[0] ?? "general");
    errores[campo] ??= e.message;
  }
  return errores;
}
