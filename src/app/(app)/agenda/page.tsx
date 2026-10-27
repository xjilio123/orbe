import { Encabezado, Pantalla, Proximamente } from "@/components/ui";

export const metadata = { title: "Agenda · Orbe" };

export default function Agenda() {
  return (
    <Pantalla>
      <Encabezado titulo="Agenda" />
      <Proximamente
        icono="agenda"
        color="morado"
        titulo="Tu tiempo, a la vista"
        texto="Vista de día, semana y mes. Arrastra una tarea a una hora para agendarla y recibe el aviso a tiempo."
        fase={2}
      />
    </Pantalla>
  );
}
