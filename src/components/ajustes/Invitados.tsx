"use client";

import { useActionState } from "react";
import type { AccionesAjustes } from "@/app/acciones/tipos";

export type Invitado = { email: string; activo: boolean; registrado: boolean };

type Props = {
  invitados: Invitado[];
  acciones: Pick<AccionesAjustes, "invitar" | "quitarInvitado">;
};

const MAXIMO = 30;

/** Solo para la administración: quién puede entrar a Orbe (máximo 30 personas). */
export function Invitados({ invitados, acciones }: Props) {
  const [estado, enviar, enviando] = useActionState(acciones.invitar, {});
  const activos = invitados.filter((i) => i.activo);
  const quitados = invitados.filter((i) => !i.activo);

  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4" aria-labelledby="titulo-invitados">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-invitados" className="text-[17px] font-semibold">
          Invitados
        </h2>
        <span className={`text-[15px] tabular-nums ${activos.length >= MAXIMO ? "font-semibold text-rojo" : "text-texto-2"}`}>
          {activos.length} de {MAXIMO}
        </span>
      </div>
      <p className="text-[15px] leading-5 text-texto-2">Solo estos correos de Google pueden entrar. Quitar a alguien no borra su cuenta: le impide entrar por primera vez.</p>

      <form action={enviar} className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Correo de Google a invitar</span>
            <input
              name="email"
              type="email"
              inputMode="email"
              autoComplete="off"
              autoCapitalize="none"
              required
              maxLength={254}
              placeholder="correo@gmail.com"
              aria-invalid={Boolean(estado.errores?.email)}
              className="w-full rounded-[12px] bg-control px-3 py-2.5 text-[16px] outline-none focus:ring-2 focus:ring-indigo-relleno/40"
            />
          </label>
          <button
            type="submit"
            disabled={enviando || activos.length >= MAXIMO}
            className="shrink-0 rounded-[12px] bg-indigo-relleno px-4 text-[15px] font-semibold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {enviando ? "…" : "Invitar"}
          </button>
        </div>
        {estado.errores?.email && <span className="text-[13px] text-rojo">{estado.errores.email}</span>}
      </form>

      {activos.length > 0 && (
        <ul className="divide-y divide-separador/60 overflow-hidden rounded-[14px] bg-superficie-2">
          {activos.map((i) => (
            <li key={i.email} className="flex items-center gap-3 px-3 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px]">{i.email}</span>
                <span className={`text-[13px] ${i.registrado ? "text-verde" : "text-texto-2"}`}>{i.registrado ? "Ya entró" : "Aún no entra"}</span>
              </span>
              <form action={acciones.quitarInvitado.bind(null, i.email)}>
                <button type="submit" aria-label={`Quitar a ${i.email}`} className="rounded-full px-3 py-1.5 text-[15px] font-semibold text-rojo active:bg-control">
                  Quitar
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {quitados.length > 0 && (
        <p className="text-[13px] text-texto-2">
          Quitados: {quitados.map((i) => i.email).join(", ")}. Puedes volver a invitarlos.
        </p>
      )}
    </section>
  );
}
