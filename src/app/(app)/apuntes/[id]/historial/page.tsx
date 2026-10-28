import { notFound } from "next/navigation";
import { accionesApuntes } from "@/app/acciones/conjunto";
import { VistaHistorial } from "@/components/vistas/VistaHistorial";
import type { Bloque } from "@/lib/bloques";
import { pagina as leerPagina } from "@/lib/datos/paginas";
import { requerirSesion } from "@/lib/supabase/servidor";
import { esquemaId } from "@/lib/validacion";

export const metadata = { title: "Historial · Orbe" };

export default async function Historial({ params }: PageProps<"/apuntes/[id]/historial">) {
  const { id } = await params;
  if (!esquemaId.safeParse(id).success) notFound();
  const { supabase } = await requerirSesion();
  const [pagina, { data }] = await Promise.all([
    leerPagina(supabase, id),
    supabase.from("versiones_pagina").select("hueco,titulo,icono,contenido,creado").eq("pagina_id", id).order("creado", { ascending: false }),
  ]);
  if (!pagina) notFound();

  const versiones = (data ?? []).map((v) => ({ ...v, contenido: Array.isArray(v.contenido) ? (v.contenido as unknown as Bloque[]) : [] }));
  return <VistaHistorial pagina={pagina} versiones={versiones} base="" acciones={accionesApuntes} />;
}
