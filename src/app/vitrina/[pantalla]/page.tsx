import { notFound } from "next/navigation";
import Agenda from "@/app/(app)/agenda/page";
import Apuntes from "@/app/(app)/apuntes/page";
import Tareas from "@/app/(app)/tareas/page";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { VistaHoy } from "@/components/vistas/VistaHoy";
import { vitrinaActiva } from "@/lib/vitrina";

// Pantallas reales con datos FICTICIOS. Solo existe con ORBE_VITRINA=1 fuera de Vercel (ver lib/vitrina.ts).
export default async function Pantalla({ params }: PageProps<"/vitrina/[pantalla]">) {
  if (!vitrinaActiva()) notFound();
  const { pantalla } = await params;

  switch (pantalla) {
    case "hoy":
      return <VistaHoy fecha="martes 27 oct" saludo="Buenas tardes" nombre="Ana" />;
    case "tareas":
      return <Tareas />;
    case "apuntes":
      return <Apuntes />;
    case "agenda":
      return <Agenda />;
    case "ajustes":
      return <VistaAjustes nombre="Ana Prueba" email="ana@ejemplo.com" tema="auto" />;
    default:
      notFound();
  }
}
