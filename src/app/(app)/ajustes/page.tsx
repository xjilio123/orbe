import { cookies, headers } from "next/headers";
import { crearClaveAtajo, revocarClaveAtajo } from "@/app/acciones/atajo";
import { accionesAjustes } from "@/app/acciones/conjunto";
import type { UsoIa } from "@/components/ajustes/MedidorIa";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { miEspacio } from "@/lib/datos/paginas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { COOKIE_TEMA, leerTema } from "@/lib/tema";
import { textoUso } from "@/lib/atajoClave";

/** Lo que devuelve mi_uso_ia(), con valores seguros si algo falta. */
function leerUsoIa(datos: unknown): UsoIa {
  const d = (datos ?? {}) as Partial<UsoIa>;
  return { usados: Number(d.usados ?? 0), tope: Number(d.tope ?? 15), funciones: Array.isArray(d.funciones) ? d.funciones : [] };
}

export const metadata = { title: "Ajustes · Orbe" };

export default async function Ajustes() {
  const { supabase, usuario } = await requerirSesion();
  const [{ data: perfil }, uso, galletas, { data: clave }, { count }, { data: admin }, { data: usoIa }, { data: claves }, cabeceras] = await Promise.all([
    supabase.from("perfiles").select("nombre,calendario_ics").eq("id", usuario.id).maybeSingle(),
    miEspacio(supabase),
    cookies(),
    supabase.rpc("clave_publica_push"),
    supabase.from("suscripciones_push").select("id", { count: "exact", head: true }),
    supabase.rpc("soy_admin"),
    supabase.rpc("mi_uso_ia"),
    supabase.from("claves_atajo").select("id,nombre,pista,ultimo_uso").order("creado"),
    headers(),
  ]);
  const host = cabeceras.get("host") ?? "orbe-nine-chi.vercel.app";
  const origen = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const invitados = admin ? ((await supabase.rpc("mis_invitados")).data ?? []) : null;

  return (
    <VistaAjustes
      nombre={perfil?.nombre ?? ""}
      email={usuario.email}
      tema={leerTema(galletas.get(COOKIE_TEMA)?.value)}
      uso={uso}
      avisos={{ clavePublica: clave ?? null, dispositivos: count ?? 0 }}
      calendarioConectado={Boolean(perfil?.calendario_ics)}
      acciones={accionesAjustes}
      invitados={invitados}
      ia={{ uso: leerUsoIa(usoIa), configurada: Boolean(process.env.GEMINI_API_KEY) }}
      atajo={{
        claves: (claves ?? []).map((c) => ({ id: c.id, nombre: c.nombre, pista: c.pista, uso: textoUso(c.ultimo_uso) })),
        origen,
        acciones: { crear: crearClaveAtajo, revocar: revocarClaveAtajo },
      }}
    />
  );
}
