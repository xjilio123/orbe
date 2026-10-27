import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { RegistrarServiceWorker } from "@/components/pwa/RegistrarServiceWorker";
import { COOKIE_TEMA, coloresDeTema, leerTema } from "@/lib/tema";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbe",
  description: "Tu día, tus notas y tus pendientes en un solo lugar.",
  applicationName: "Orbe",
  // "default": la hora y la batería del iPhone cambian de color con el tema.
  appleWebApp: { capable: true, title: "Orbe", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export async function generateViewport(): Promise<Viewport> {
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: coloresDeTema(tema),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // La CSP usa un nonce por request: todas las páginas se renderizan en cada visita.
  await connection();
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <html lang="es-PE" className="h-full antialiased" data-tema={tema === "auto" ? undefined : tema}>
      <body className="min-h-full">
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
