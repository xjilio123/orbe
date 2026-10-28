"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AccionesProgreso } from "@/app/acciones/tipos";
import { Icono } from "@/components/Icono";
import { Pantalla, enlace } from "@/components/ui";
import { formatoMinutos, formatoReloj } from "@/lib/progreso";

type Props = {
  base: string;
  tareas: { id: string; titulo: string }[];
  tareaInicial: string | null;
  minutosHoy: number;
  guardar: AccionesProgreso["guardarFoco"];
};

type Modo = "foco" | "descanso";
/** Lo que se guarda en el teléfono para que el reloj siga si cierras o recargas la pantalla. */
type Sesion = {
  modo: Modo;
  duracion: number;
  /** Hora (ms) en que termina, si está corriendo. */
  fin: number | null;
  /** Lo que faltaba al pausar (ms). */
  restante: number;
  /** Cuándo empezó la sesión de foco (ISO), para guardarla. */
  inicio: string | null;
  tareaId: string | null;
};

const CLAVE = "orbe-foco";
const DURACIONES = [15, 25, 50] as const;
const DESCANSO = 5;

const nueva = (modo: Modo, duracion: number, tareaId: string | null): Sesion => ({
  modo,
  duracion,
  fin: null,
  restante: duracion * 60_000,
  inicio: null,
  tareaId,
});

function leerGuardada(): Sesion | null {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE) ?? "null") as Sesion | null;
    return s && (s.modo === "foco" || s.modo === "descanso") && typeof s.duracion === "number" ? s : null;
  } catch {
    return null;
  }
}

/** Un "ding" corto con el sintetizador del navegador (sin archivos de audio). */
function sonar(audio: AudioContext | null) {
  if (!audio) return;
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, audio.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.9);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 1);
  } catch {
    // sin sonido no pasa nada
  }
}

/**
 * Modo foco (Pomodoro): el reloj se calcula con la hora de término, así sigue exacto aunque
 * el iPhone pause la app. Al terminar se guarda la sesión con su tarea.
 */
export function VistaFoco({ base, tareas, tareaInicial, minutosHoy, guardar }: Props) {
  const [sesion, setSesion] = useState<Sesion>(() => nueva("foco", 25, tareaInicial));
  const [ahora, setAhora] = useState(0);
  const [minutos, setMinutos] = useState(minutosHoy);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const restaurada = useRef(false);

  // Al abrir: retoma la sesión que quedó en el teléfono (si hay una).
  useEffect(() => {
    if (restaurada.current) return;
    restaurada.current = true;
    const guardada = leerGuardada();
    if (guardada) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el teléfono solo existe en el navegador
      setSesion(tareaInicial && !guardada.inicio ? { ...guardada, tareaId: tareaInicial } : guardada);
    }
  }, [tareaInicial]);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
      // modo privado: el reloj funciona igual, solo no se recuerda
    }
  }, [sesion]);

  const corriendo = sesion.fin !== null;
  const restante = corriendo ? Math.max(0, (sesion.fin ?? 0) - ahora) : sesion.restante;
  const total = sesion.duracion * 60_000;
  const fraccion = total > 0 ? 1 - restante / total : 0;

  // Mientras corre, actualiza el reloj 4 veces por segundo.
  useEffect(() => {
    if (!corriendo) return;
    const tic = () => setAhora(Date.now());
    tic();
    const intervalo = setInterval(tic, 250);
    return () => clearInterval(intervalo);
  }, [corriendo]);

  useEffect(() => {
    if (!corriendo) return;
    document.title = `${formatoReloj(restante)} · ${sesion.modo === "foco" ? "Foco" : "Descanso"}`;
    return () => {
      document.title = "Modo foco · Orbe";
    };
  }, [corriendo, restante, sesion.modo]);

  async function registrar(s: Sesion, ms: number) {
    const min = Math.floor(ms / 60_000);
    if (s.modo !== "foco" || !s.inicio || min < 1) return;
    setMinutos((m) => m + min);
    try {
      const r = await guardar({ tarea_id: s.tareaId, inicio: s.inicio, minutos: Math.min(180, min) });
      if (!r.ok) setMensaje({ texto: r.error ?? "No se pudo guardar la sesión.", error: true });
    } catch {
      setMensaje({ texto: "Sin conexión: esta sesión no se guardó.", error: true });
    }
  }

  // Al llegar a cero: guarda la sesión y propone el descanso (o vuelve al foco).
  useEffect(() => {
    if (!corriendo || ahora === 0 || restante > 0) return;
    const terminada = sesion;
    sonar(audio.current);
    if ("vibrate" in navigator) navigator.vibrate?.(300);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- el reloj llegó a cero
    setSesion(terminada.modo === "foco" ? nueva("descanso", DESCANSO, terminada.tareaId) : nueva("foco", 25, terminada.tareaId));
    setMensaje({
      texto: terminada.modo === "foco" ? `¡Bien! ${terminada.duracion} min de foco. Toma 5 minutos de descanso.` : "Descanso terminado. ¿Otra ronda?",
      error: false,
    });
    void registrar(terminada, terminada.duracion * 60_000);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo cuando el reloj llega a cero
  }, [corriendo, ahora, restante]);

  function empezar() {
    setMensaje(null);
    // El sonido final necesita un toque previo del usuario para funcionar en iPhone.
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {
      audio.current = null;
    }
    const inicio = Date.now();
    setAhora(inicio);
    setSesion((s) => ({ ...s, fin: inicio + s.restante, inicio: s.inicio ?? new Date(inicio).toISOString() }));
  }

  function pausar() {
    setSesion((s) => ({ ...s, fin: null, restante: Math.max(0, (s.fin ?? 0) - Date.now()) }));
  }

  function terminar() {
    const s = sesion;
    const hecho = total - (s.fin !== null ? Math.max(0, s.fin - Date.now()) : s.restante);
    setSesion(nueva("foco", s.modo === "foco" ? s.duracion : 25, s.tareaId));
    if (s.modo === "foco" && hecho >= 60_000) {
      setMensaje({ texto: `Guardé ${formatoMinutos(Math.floor(hecho / 60_000))} de foco.`, error: false });
      void registrar(s, hecho);
    } else setMensaje(null);
  }

  const enMarcha = sesion.inicio !== null || corriendo;
  const tarea = tareas.find((t) => t.id === sesion.tareaId);
  const radio = 120;
  const circ = 2 * Math.PI * radio;

  return (
    <Pantalla>
      <header className="flex items-center justify-between gap-4 pt-2">
        <Link href={enlace(base, "/progreso")} className="-ml-2 flex items-center gap-1 rounded-full px-2 py-1 text-[17px] text-azul active:opacity-60">
          <Icono nombre="atras" className="size-5" />
          Progreso
        </Link>
        <p className="text-[15px] text-texto-2">Hoy: {formatoMinutos(minutos)}</p>
      </header>
      <h1 className="-mt-2 text-[34px] font-bold leading-tight tracking-tight">Modo foco</h1>

      <section aria-label="Reloj" className="flex flex-col items-center gap-5">
        <div className="relative grid size-72 place-items-center">
          <svg viewBox="0 0 280 280" className={`absolute inset-0 -rotate-90 ${sesion.modo === "foco" ? "text-rojo-relleno" : "text-verde-relleno"}`} aria-hidden="true">
            <circle cx={140} cy={140} r={radio} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={14} />
            <circle
              cx={140}
              cy={140}
              r={radio}
              fill="none"
              stroke="currentColor"
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(0.001, fraccion) * circ} ${circ}`}
            />
          </svg>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[15px] font-semibold uppercase tracking-wide text-texto-2">{sesion.modo === "foco" ? "Foco" : "Descanso"}</p>
            <p className="text-[64px] font-semibold leading-none tabular-nums" role="timer" aria-live="off">
              {formatoReloj(restante)}
            </p>
            <p className="h-5 max-w-52 truncate text-[15px] text-texto-2">{tarea ? tarea.titulo : sesion.modo === "foco" ? "Sin tarea" : ""}</p>
          </div>
        </div>

        <div className="flex h-11 items-center gap-2" role="group" aria-label="Duración">
          {!enMarcha &&
            sesion.modo === "foco" &&
            DURACIONES.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={sesion.duracion === d}
                onClick={() => setSesion((s) => ({ ...s, duracion: d, restante: d * 60_000 }))}
                className={`rounded-full px-4 py-2 text-[15px] font-semibold active:scale-95 ${
                  sesion.duracion === d ? "bg-texto text-fondo" : "bg-superficie text-texto-2"
                }`}
              >
                {d} min
              </button>
            ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={terminar}
            disabled={!enMarcha}
            className="h-12 w-28 rounded-full bg-superficie text-[17px] font-semibold text-texto-2 active:scale-95 disabled:opacity-0"
          >
            Terminar
          </button>
          <button
            type="button"
            onClick={corriendo ? pausar : empezar}
            aria-label={corriendo ? "Pausar" : enMarcha ? "Seguir" : "Empezar"}
            className={`grid size-20 place-items-center rounded-full text-white shadow-lg active:scale-95 ${sesion.modo === "foco" ? "bg-rojo-relleno" : "bg-verde-relleno"}`}
          >
            <Icono nombre={corriendo ? "pausa" : "play"} className="size-9" />
          </button>
          <span className="w-28" aria-hidden="true" />
        </div>

        <p className={`h-10 text-center text-[15px] ${mensaje?.error ? "text-rojo" : "font-semibold text-verde"}`} aria-live="polite">
          {mensaje?.texto}
        </p>
      </section>

      <label className="flex flex-col gap-1.5">
        <span className="px-1 text-[13px] font-semibold text-texto-2">Tarea en la que te enfocas</span>
        <select
          value={sesion.tareaId ?? ""}
          disabled={enMarcha}
          onChange={(e) => setSesion((s) => ({ ...s, tareaId: e.target.value || null }))}
          className="w-full rounded-[16px] bg-superficie px-4 py-3 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40 disabled:opacity-60"
        >
          <option value="">Sin tarea</option>
          {tareas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo}
            </option>
          ))}
        </select>
      </label>

      <p className="px-1 text-[13px] leading-5 text-texto-2">
        En iPhone el reloj sigue aunque cambies de app, pero el aviso sonoro solo llega con Orbe abierta. Al volver, la sesión se guarda sola.
      </p>
    </Pantalla>
  );
}
