"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { AccionesIa } from "@/app/acciones/tipos";
import { Destello } from "@/components/ia/BotonIa";
import { enlace } from "@/components/ui";
import type { Bloque } from "@/lib/bloques";

type Props = {
  paginaId: string;
  base: string;
  ia: Pick<AccionesIa, "tarjetas" | "foto" | "audio">;
  /** Lo que hay ahora en el editor (incluye lo que todavía no se guardó). */
  leer: () => { titulo: string; bloques: Bloque[] };
  /** Agrega bloques al final de la página (se pueden deshacer). */
  agregar: (bloques: Bloque[]) => void;
  avisar: (texto: string | null, error?: boolean) => void;
  ocupada: boolean;
};

const MAX_SEGUNDOS = 120;

/** Tarjetas de estudio, foto a texto y nota de voz. La foto y el audio se envían a la IA y no se guardan. */
export function HerramientasIa({ paginaId, base, ia, leer, agregar, avisar, ocupada }: Props) {
  const router = useRouter();
  const [trabajando, iniciar] = useTransition();
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const grabadora = useRef<MediaRecorder | null>(null);
  const foto = useRef<HTMLInputElement>(null);

  const ocupado = ocupada || trabajando || grabando;

  // Corta la grabación a los 2 minutos.
  useEffect(() => {
    if (!grabando) return;
    const reloj = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(reloj);
  }, [grabando]);
  useEffect(() => {
    if (grabando && segundos >= MAX_SEGUNDOS) grabadora.current?.stop();
  }, [grabando, segundos]);

  function ejecutar(tarea: () => Promise<void>, pensando: string) {
    avisar(pensando);
    iniciar(async () => {
      try {
        await tarea();
      } catch {
        avisar("Sin conexión: la IA necesita internet.", true);
      }
    });
  }

  function crearTarjetas() {
    ejecutar(async () => {
      const { titulo, bloques } = leer();
      const r = await ia.tarjetas(paginaId, titulo, bloques);
      if (!r.ok) return avisar(r.error, true);
      avisar("Tarjetas listas. Abriendo…");
      router.push(enlace(base, `/apuntes/${r.datos.id}`));
    }, "La IA está creando tus tarjetas…");
  }

  function leerFoto(archivo: File) {
    ejecutar(async () => {
      const { comprimirFoto } = await import("@/lib/imagen");
      const { blob } = await comprimirFoto(archivo);
      const datos = new FormData();
      datos.append("foto", blob, "foto");
      const r = await ia.foto(datos);
      if (!r.ok) return avisar(r.error, true);
      agregar(r.datos.bloques);
      avisar(`Agregué ${r.datos.bloques.length} bloques desde la foto (la foto no se guardó).`);
    }, "La IA está leyendo la foto…");
  }

  async function grabar() {
    if (grabando) {
      grabadora.current?.stop();
      return;
    }
    avisar(null);
    let flujo: MediaStream;
    try {
      flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      avisar("Orbe necesita permiso para usar el micrófono.", true);
      return;
    }
    const tipo = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const rec = new MediaRecorder(flujo, { mimeType: tipo, audioBitsPerSecond: 32_000 });
    const partes: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size > 0 && partes.push(e.data);
    rec.onstop = () => {
      flujo.getTracks().forEach((p) => p.stop());
      setGrabando(false);
      const audio = new Blob(partes, { type: tipo });
      if (audio.size < 2_000) return avisar("La grabación quedó vacía. Intenta de nuevo.", true);
      ejecutar(async () => {
        const datos = new FormData();
        datos.append("audio", audio, "nota");
        const r = await ia.audio(datos);
        if (!r.ok) return avisar(r.error, true);
        agregar(r.datos.bloques);
        avisar(`Agregué tu nota de voz (${r.datos.bloques.length} bloques). El audio no se guardó.`);
      }, "La IA está escuchando tu nota…");
    };
    grabadora.current = rec;
    setSegundos(0);
    setGrabando(true);
    rec.start(1000);
  }

  const boton =
    "flex items-center gap-1.5 rounded-full bg-morado-relleno/12 px-3 py-1.5 text-[14px] font-semibold text-morado active:scale-95 disabled:opacity-50";
  const reloj = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

  return (
    <>
      <button type="button" onClick={crearTarjetas} disabled={ocupado} className={boton}>
        <Destello className="size-3.5" />
        Tarjetas de estudio
      </button>
      <button type="button" onClick={() => foto.current?.click()} disabled={ocupado} className={boton}>
        <Destello className="size-3.5" />
        Foto a texto
      </button>
      <button
        type="button"
        onClick={grabar}
        disabled={ocupada || trabajando}
        aria-pressed={grabando}
        className={`${boton} ${grabando ? "bg-rojo-relleno text-white" : ""}`}
      >
        {grabando ? <span className="size-2.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden="true" /> : <Destello className="size-3.5" />}
        {grabando ? `Terminar · ${reloj}` : "Dictar nota"}
      </button>
      <input
        ref={foto}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) leerFoto(f);
        }}
      />
    </>
  );
}
