import type { NextConfig } from "next";

// Cabeceras de seguridad fijas. La Content-Security-Policy con nonce
// se genera en cada request dentro de src/proxy.ts. Por eso no se usa
// cacheComponents: una CSP con nonce exige renderizado dinámico.
const cabecerasSeguridad = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // Cámara y micrófono solo para el propio sitio (foto a texto y nota de voz con IA).
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Volver a una pestaña ya vista es instantáneo durante 60 s; guardar algo invalida esta caché.
    staleTimes: { dynamic: 60, static: 60 },
    // Subir fotos y PDF de hasta 4 MB (Vercel gratis acepta envíos de hasta 4.5 MB).
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: cabecerasSeguridad },
      {
        // El service worker nunca se cachea (siempre la última versión) y solo puede cargar código propio.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
