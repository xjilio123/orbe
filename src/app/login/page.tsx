import { Logo } from "@/components/Logo";
import { BotonGoogle } from "./BotonGoogle";

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[max(env(safe-area-inset-top),48px)] pb-[max(env(safe-area-inset-bottom),32px)]">
      {/* Logo y textos centrados en el espacio libre; el botón queda abajo, al alcance del pulgar. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <Logo className="size-40" etiqueta="Logo de Orbe: anillo de cuatro colores con un check al centro" />
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-[56px] font-extrabold leading-none tracking-tighter">
            Orbe
          </h1>
          <p className="text-[22px] font-semibold tracking-tight">Tu día, en un solo lugar.</p>
          <p className="max-w-80 text-[17px] leading-relaxed text-texto-2">
            Tareas, apuntes, recordatorios y agenda conectados, en todos tus dispositivos.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-2xl bg-rojo-relleno/12 px-4 py-3 text-[15px] font-medium text-rojo">
            No se pudo iniciar sesión. Esta app es privada: solo pueden entrar cuentas autorizadas.
          </p>
        )}
        <BotonGoogle />
        <p className="text-center text-[13px] text-texto-2">App personal. Tus notas solo las ves tú.</p>
      </div>
    </main>
  );
}
