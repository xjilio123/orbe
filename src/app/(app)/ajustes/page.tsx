import { cookies } from "next/headers";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { miEspacio } from "@/lib/datos/paginas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { COOKIE_TEMA, leerTema } from "@/lib/tema";

export const metadata = { title: "Ajustes · Orbe" };

export default async function Ajustes() {
  const { supabase, usuario } = await requerirSesion();
  const [{ data: perfil }, uso, galletas] = await Promise.all([
    supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle(),
    miEspacio(supabase),
    cookies(),
  ]);

  return <VistaAjustes nombre={perfil?.nombre ?? ""} email={usuario.email} tema={leerTema(galletas.get(COOKIE_TEMA)?.value)} uso={uso} />;
}
