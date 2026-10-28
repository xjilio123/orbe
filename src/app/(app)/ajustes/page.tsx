import { cookies } from "next/headers";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { requerirSesion } from "@/lib/supabase/servidor";
import { COOKIE_TEMA, leerTema } from "@/lib/tema";

export const metadata = { title: "Ajustes · Orbe" };

export default async function Ajustes() {
  const { supabase, usuario } = await requerirSesion();
  const { data: perfil } = await supabase.from("perfiles").select("nombre").eq("id", usuario.id).maybeSingle();
  const tema = leerTema((await cookies()).get(COOKIE_TEMA)?.value);

  return <VistaAjustes nombre={perfil?.nombre ?? ""} email={usuario.email} tema={tema} />;
}
