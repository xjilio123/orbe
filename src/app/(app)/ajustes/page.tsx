import { cookies } from "next/headers";
import { accionesAjustes } from "@/app/acciones/conjunto";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { miEspacio } from "@/lib/datos/paginas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { COOKIE_TEMA, leerTema } from "@/lib/tema";

export const metadata = { title: "Ajustes · Orbe" };

export default async function Ajustes() {
  const { supabase, usuario } = await requerirSesion();
  const [{ data: perfil }, uso, galletas, { data: clave }, { count }] = await Promise.all([
    supabase.from("perfiles").select("nombre,calendario_ics").eq("id", usuario.id).maybeSingle(),
    miEspacio(supabase),
    cookies(),
    supabase.rpc("clave_publica_push"),
    supabase.from("suscripciones_push").select("id", { count: "exact", head: true }),
  ]);

  return (
    <VistaAjustes
      nombre={perfil?.nombre ?? ""}
      email={usuario.email}
      tema={leerTema(galletas.get(COOKIE_TEMA)?.value)}
      uso={uso}
      avisos={{ clavePublica: clave ?? null, dispositivos: count ?? 0 }}
      calendarioConectado={Boolean(perfil?.calendario_ics)}
      acciones={accionesAjustes}
    />
  );
}
