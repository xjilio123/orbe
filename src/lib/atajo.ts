import "server-only";
import { createHash, randomBytes } from "node:crypto";

// Claves del atajo de Siri: se muestran una sola vez; la base guarda solo su huella SHA-256.

export const PREFIJO = "orbe_";

/** Clave nueva: "orbe_" + 32 caracteres aleatorios (192 bits). */
export function generarClave(): string {
  return PREFIJO + randomBytes(24).toString("base64url");
}

/** Huella SHA-256 en hexadecimal (igual que encode(digest(clave, 'sha256'), 'hex') en la base). */
export const huella = (clave: string) => createHash("sha256").update(clave, "utf8").digest("hex");

/** Últimos 4 caracteres, para reconocer la clave en Ajustes sin mostrarla entera. */
export const pista = (clave: string) => clave.slice(-4);
