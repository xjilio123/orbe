import { Logo } from "@/components/Logo";

export const metadata = { title: "Sin conexión · Orbe" };

// Pantalla que muestra el service worker cuando no hay internet. No contiene datos personales
// y funciona sin JavaScript (sus scripts podrían no estar en caché).
export default function SinConexion() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-8 text-center">
      <Logo className="size-28" etiqueta="Logo de Orbe" />
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-extrabold tracking-tight">Sin conexión</h1>
        <p className="text-[17px] leading-relaxed text-texto-2">
          Tus notas viven seguras en la nube. Vuelve a intentarlo cuando tengas internet.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga completa a propósito */}
      <a href="/" className="w-full rounded-[20px] bg-indigo-relleno py-4 text-[17px] font-bold text-white active:scale-[0.98]">
        Reintentar
      </a>
    </main>
  );
}
