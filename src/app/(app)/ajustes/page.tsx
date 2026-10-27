import { cookies } from "next/headers";
import { cerrarSesion } from "@/app/acciones";
import { Icono } from "@/components/Icono";
import { Logo } from "@/components/Logo";
import { Pantalla } from "@/components/ui";
import { requerirSesion } from "@/lib/supabase/servidor";
import { COOKIE_TEMA, leerTema } from "@/lib/tema";
import { SelectorTema } from "./SelectorTema";

export const metadata = { title: "Ajustes · Orbe" };

export default async function Ajustes() {
  const { supabase, usuario } = await requerirSesion();
  const { data: perfil } = await supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle();
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return (
    <Pantalla>
      <header className="pt-2">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Ajustes</h1>
      </header>

      <section className="flex items-center gap-4 rounded-[22px] bg-superficie p-4">
        <Logo className="size-14 shrink-0" etiqueta="Orbe" />
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-[17px] font-semibold">{perfil?.nombre || "Tu cuenta"}</p>
          <p className="truncate text-[15px] text-texto-2">{usuario.email}</p>
        </div>
      </section>

      <SelectorTema actual={tema} />

      <form action={cerrarSesion}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-superficie py-4 text-[17px] font-semibold text-rojo active:scale-[0.98]"
        >
          <Icono nombre="salir" className="size-5" />
          Cerrar sesión
        </button>
      </form>

      <p className="text-center text-[13px] text-texto-2">Orbe · Fase 0 · Hecho en Lima</p>
    </Pantalla>
  );
}
