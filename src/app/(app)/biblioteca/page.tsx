import { accionesColeccion } from "@/app/acciones/conjunto";
import { VistaBiblioteca } from "@/components/vistas/VistaBiblioteca";
import { esEstado } from "@/lib/coleccion";
import { miBiblioteca } from "@/lib/datos/coleccion";
import { hoyLima } from "@/lib/fechas";
import { anioDe } from "@/lib/progreso";
import { requerirSesion } from "@/lib/supabase/servidor";

export const metadata = { title: "Biblioteca · Orbe" };

export default async function Biblioteca({ searchParams }: PageProps<"/biblioteca">) {
  const [{ supabase }, { estado }] = await Promise.all([requerirSesion(), searchParams]);
  const obras = await miBiblioteca(supabase);
  return (
    <VistaBiblioteca
      obras={obras}
      estado={typeof estado === "string" && esEstado(estado) ? estado : "en_curso"}
      anio={anioDe(hoyLima())}
      base=""
      acciones={accionesColeccion}
    />
  );
}
