import { cerrarSesion } from "@/app/acciones/generales";
import { SelectorTema } from "@/app/(app)/ajustes/SelectorTema";
import type { AccionesAjustes } from "@/app/acciones/tipos";
import { ActivarAvisos } from "@/components/ajustes/ActivarAvisos";
import { ConectarCalendario } from "@/components/ajustes/ConectarCalendario";
import { Icono } from "@/components/Icono";
import { Logo } from "@/components/Logo";
import { Medidor } from "@/components/Medidor";
import { Pantalla } from "@/components/ui";
import type { Tema } from "@/lib/tema";

type Uso = { archivos: number; archivosMax: number; texto: number; textoMax: number };

type Props = {
  nombre: string;
  email: string;
  tema: Tema;
  uso: Uso;
  avisos: { clavePublica: string | null; dispositivos: number };
  calendarioConectado: boolean;
  acciones: AccionesAjustes;
};

export function VistaAjustes({ nombre, email, tema, uso, avisos, calendarioConectado, acciones }: Props) {
  return (
    <Pantalla>
      <header className="pt-2">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Ajustes</h1>
      </header>

      <section className="flex items-center gap-4 rounded-[22px] bg-superficie p-4">
        <Logo className="size-14 shrink-0" etiqueta="Orbe" />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-[17px] font-semibold">{nombre || "Tu cuenta"}</p>
          <p className="truncate text-[15px] text-texto-2">{email}</p>
        </div>
      </section>

      <ActivarAvisos clavePublica={avisos.clavePublica} dispositivos={avisos.dispositivos} acciones={acciones} />

      <ConectarCalendario conectado={calendarioConectado} acciones={acciones} />

      <SelectorTema actual={tema} />

      <Medidor uso={uso} />

      <form action={cerrarSesion}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-superficie py-4 text-[17px] font-semibold text-rojo active:scale-[0.98]"
        >
          <Icono nombre="salir" className="size-5" />
          Cerrar sesión
        </button>
      </form>

      <p className="text-center text-[13px] text-texto-2">Orbe · Hecho en Lima</p>
    </Pantalla>
  );
}
