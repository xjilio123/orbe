import { SelectorTema } from "@/app/(app)/ajustes/SelectorTema";
import type { AccionesAjustes } from "@/app/acciones/tipos";
import { ActivarAvisos } from "@/components/ajustes/ActivarAvisos";
import { BotonCerrarSesion } from "@/components/ajustes/BotonCerrarSesion";
import { ConectarCalendario } from "@/components/ajustes/ConectarCalendario";
import { Invitados, type Invitado } from "@/components/ajustes/Invitados";
import { MedidorIa, type UsoIa } from "@/components/ajustes/MedidorIa";
import { Icono } from "@/components/Icono";
import { Logo } from "@/components/Logo";
import { Medidor } from "@/components/Medidor";
import Link from "next/link";
import { IconoModulo, Pantalla, enlace } from "@/components/ui";
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
  base?: string;
  /** Solo para la administración (si no, null y la sección no aparece). */
  invitados?: Invitado[] | null;
  ia: { uso: UsoIa; configurada: boolean };
};

export function VistaAjustes({ nombre, email, tema, uso, avisos, calendarioConectado, acciones, base = "", invitados = null, ia }: Props) {
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

      <MedidorIa uso={ia.uso} configurada={ia.configurada} />

      <Medidor uso={uso} />

      <Link href={enlace(base, "/papelera")} className="flex items-center gap-3 rounded-[22px] bg-superficie px-4 py-3 active:scale-[0.99]">
        <IconoModulo nombre="papelera" color="rojo" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[17px] font-semibold">Papelera</span>
          <span className="text-[13px] text-texto-2">Lo borrado se guarda 30 días.</span>
        </span>
        <Icono nombre="adelante" className="size-4 text-texto-2" />
      </Link>

      {invitados && <Invitados invitados={invitados} acciones={acciones} />}

      <BotonCerrarSesion />

      <p className="text-center text-[13px] text-texto-2">Orbe · Hecho en Lima</p>
    </Pantalla>
  );
}
