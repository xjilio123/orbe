/**
 * Tipo REAL de un archivo según sus primeros bytes ("firma"), sin confiar en el nombre ni en lo que
 * diga el navegador. Solo se aceptan fotos (WebP, JPEG, PNG) y PDF.
 */
export type TipoArchivo = "image/webp" | "image/jpeg" | "image/png" | "application/pdf";

export const EXTENSION: Record<TipoArchivo, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

/** 4 MB: Vercel gratis no acepta envíos más grandes (las fotos se comprimen antes a ~300 KB). */
export const MAX_ARCHIVO = 4 * 1024 * 1024;
export const MAX_ESPACIO_ARCHIVOS = 30 * 1024 * 1024;
export const MAX_ESPACIO_TEXTO = 8 * 1024 * 1024;

const empieza = (bytes: Uint8Array, firma: number[], desde = 0) => firma.every((b, i) => bytes[desde + i] === b);

export function detectarTipo(bytes: Uint8Array): TipoArchivo | null {
  if (bytes.length < 12) return null;
  if (empieza(bytes, [0x52, 0x49, 0x46, 0x46]) && empieza(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (empieza(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (empieza(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (empieza(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}

/** "1.2 MB", "350 KB". */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".0", "")} MB`;
}

/** Nombre de archivo seguro para mostrar (sin rutas ni caracteres de control). */
export function nombreSeguro(nombre: string): string {
  const limpio = nombre
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/g, "")
    .trim();
  return (limpio || "archivo").slice(0, 120);
}
