"use client";

import { useSyncExternalStore } from "react";
import { Icono } from "@/components/Icono";
import { esAndroid, esIOS, estaInstalada } from "@/lib/dispositivo";
import { EVENTO_INSTALAR, instalar, puedeInstalar } from "@/lib/instalacion";

const CLAVE = "orbe:aviso-instalar-cerrado";

type Aviso = "ninguno" | "ios" | "android-boton" | "android-menu";

const suscribir = (avisar: () => void) => {
  window.addEventListener(EVENTO_INSTALAR, avisar);
  return () => window.removeEventListener(EVENTO_INSTALAR, avisar);
};

function queAviso(): Aviso {
  try {
    if (estaInstalada() || localStorage.getItem(CLAVE) === "1") return "ninguno";
    if (esIOS()) return "ios";
    if (esAndroid()) return puedeInstalar() ? "android-boton" : "android-menu";
    return "ninguno";
  } catch {
    return "ninguno";
  }
}

/**
 * Si Orbe todavía no está instalada, explica cómo instalarla. En iPhone y iPad se hace a mano desde
 * Compartir; en Android, Chrome permite instalarla con un botón (o desde su menú ⋮).
 *
 * Fluidez: solo se sabe si mostrarlo cuando la app ya cargó en el teléfono. Por eso flota sobre la
 * barra de pestañas y entra deslizándose: nunca empuja el contenido (antes causaba un "tirón" de ~140 px).
 */
export function AvisoInstalar() {
  const aviso = useSyncExternalStore(suscribir, queAviso, () => "ninguno" as Aviso);
  if (aviso === "ninguno") return null;

  function cerrar() {
    try {
      localStorage.setItem(CLAVE, "1");
    } catch {
      // Sin almacenamiento: el aviso volverá a aparecer, no es grave.
    }
    window.dispatchEvent(new Event(EVENTO_INSTALAR));
  }

  return (
    <>
      {/* Espacio al final de la página para poder leer lo último sin que el aviso lo tape. */}
      <div aria-hidden="true" className="h-32 shrink-0" />
      <div
        role="region"
        aria-label="Instalar Orbe"
        className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),16px)+84px)] z-30 mx-auto max-w-md px-5 motion-safe:animate-[entrar-desde-abajo_0.35s_ease-out]"
      >
        <div className="flex items-start gap-3 rounded-[22px] border border-black/5 bg-vidrio px-5 py-4 shadow-[0_8px_24px_rgb(0_0_0/0.14)] backdrop-blur-xl dark:border-white/10">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-relleno text-white">
            <Icono nombre={aviso === "ios" ? "compartir" : "mas"} className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-2 text-[15px] leading-snug">
            {aviso === "ios" ? (
              <p>
                <span className="block font-semibold">Instala Orbe en tu iPhone o iPad</span>
                Toca <span className="font-semibold">Compartir</span> y luego{" "}
                <span className="font-semibold">Añadir a pantalla de inicio</span>.
              </p>
            ) : (
              <p>
                <span className="block font-semibold">Instala Orbe en tu teléfono</span>
                {aviso === "android-boton" ? (
                  "Queda en tu pantalla de inicio y se abre a pantalla completa."
                ) : (
                  <>
                    En Chrome toca el menú <span className="font-semibold">⋮</span> y luego{" "}
                    <span className="font-semibold">Instalar app</span>.
                  </>
                )}
              </p>
            )}
            {aviso === "android-boton" && (
              <button
                type="button"
                onClick={() => void instalar()}
                className="w-fit rounded-full bg-indigo-relleno px-4 py-1.5 text-[15px] font-semibold text-white"
              >
                Instalar
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar aviso"
            className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full text-[22px] leading-none text-texto-2"
          >
            ×
          </button>
        </div>
      </div>
    </>
  );
}
