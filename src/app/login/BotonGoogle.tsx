"use client";

import { useState } from "react";
import { LogoGoogle } from "@/components/Icono";

const RECARGADA = "orbe-login-recargada";

export function BotonGoogle() {
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function entrar() {
    setCargando(true);
    setFallo(false);

    // Fluidez: el cliente de Supabase (~90 KB) se descarga recién al tocar el botón, no al abrir el login.
    let modulo: typeof import("@/lib/supabase/navegador");
    try {
      modulo = await import("@/lib/supabase/navegador");
    } catch {
      // Una pestaña abierta desde antes de una actualización pide un archivo que ya no existe.
      // Se recarga una vez para traer la versión nueva (si vuelve a fallar, se avisa).
      let yaRecargo = false;
      try {
        yaRecargo = sessionStorage.getItem(RECARGADA) === "1";
        sessionStorage.setItem(RECARGADA, "1");
      } catch {
        // modo privado: igual se intenta recargar una vez
      }
      if (!yaRecargo) {
        window.location.reload();
        return;
      }
      setCargando(false);
      setFallo(true);
      return;
    }

    try {
      sessionStorage.removeItem(RECARGADA);
    } catch {
      // sin almacenamiento: no pasa nada
    }

    try {
      const { error } = await modulo.crearClienteNavegador().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch {
      // Sin conexión o Google no respondió: el botón vuelve a quedar disponible.
      setCargando(false);
      setFallo(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={entrar}
        disabled={cargando}
        className="flex w-full items-center justify-center gap-3 rounded-[20px] bg-texto py-4 text-[17px] font-bold text-fondo transition active:scale-[0.98] disabled:opacity-60"
      >
        <span className="grid size-7 place-items-center rounded-full bg-white">
          <LogoGoogle className="size-[18px]" />
        </span>
        {cargando ? "Abriendo Google…" : "Continuar con Google"}
      </button>
      {fallo && (
        <p role="alert" className="text-center text-[15px] text-rojo">
          No se pudo conectar con Google. Revisa tu conexión y vuelve a tocar el botón (o recarga la página).
        </p>
      )}
    </>
  );
}
