"use client";

/**
 * Comprime una foto EN EL TELÉFONO antes de subirla: máximo 1600 px de lado, WebP (o JPEG si el
 * navegador no sabe crear WebP). Una foto de iPhone de ~4 MB queda en ~300 KB: cuida los 30 MB por persona.
 */
export async function comprimirFoto(archivo: File, ladoMaximo = 1600): Promise<{ blob: Blob; ancho: number; alto: number }> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
  const ancho = Math.max(1, Math.round(imagen.width * escala));
  const alto = Math.max(1, Math.round(imagen.height * escala));

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Sin lienzo");
  ctx.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const crear = (tipo: string, calidad: number) =>
    new Promise<Blob | null>((listo) => lienzo.toBlob(listo, tipo, calidad));
  let blob = await crear("image/webp", 0.8);
  if (!blob || blob.type !== "image/webp") blob = await crear("image/jpeg", 0.82);
  if (!blob) throw new Error("No se pudo comprimir");
  return { blob, ancho, alto };
}
