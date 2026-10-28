import { z } from "zod";
import { REPETICIONES, VALORES_AVISO } from "./repeticion";
import { COLORES_LISTA, ESTADOS } from "./tareas";

// Todo lo que llega del navegador se valida aquí antes de tocar la base.
// La base vuelve a validar con CHECK y RLS: si algo se salta esta capa, igual no entra.

const textoLimpio = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .pipe(z.string().max(max));

const fechaOpcional = z
  .string()
  .trim()
  .transform((s) => (s === "" ? null : s))
  .pipe(z.iso.date().nullable());

const horaOpcional = z
  .string()
  .trim()
  .transform((s) => (s === "" ? null : s.slice(0, 5)))
  .pipe(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable());

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
    lista_id: idOpcional,
    repetir: repetirOpcional,
    aviso: avisoOpcional,
  })
  .refine((t) => t.hora === null || t.fecha !== null, { message: "Para poner hora, elige también una fecha", path: ["hora"] })
  .refine((t) => t.repetir === null || t.fecha !== null, { message: "Para repetirla, elige la fecha de la primera vez", path: ["repetir"] });

export const esquemaSubtarea = z.object({ titulo: textoLimpio(200).pipe(z.string().min(1, "Escribe la subtarea")) });

export const esquemaLista = z.object({
  nombre: textoLimpio(60).pipe(z.string().min(1, "Ponle un nombre a la lista")),
  color: z.enum(COLORES_LISTA),
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
