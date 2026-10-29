import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orbe",
    short_name: "Orbe",
    description: "Tu día, tus notas y tus pendientes en un solo lugar.",
    lang: "es-PE",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    // Android: Orbe aparece en el menú Compartir de otras apps (iPhone no lo permite a las apps web).
    share_target: {
      action: "/compartir",
      method: "GET",
      params: { title: "titulo", text: "texto", url: "url" },
    },
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
