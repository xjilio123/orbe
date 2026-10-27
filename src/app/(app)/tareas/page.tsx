import { Encabezado, Pantalla, Proximamente } from "@/components/ui";

export const metadata = { title: "Tareas · Orbe" };

export default function Tareas() {
  return (
    <Pantalla>
      <Encabezado titulo="Tareas" />
      <Proximamente
        icono="tareas"
        color="azul"
        titulo="Tus pendientes, en orden"
        texto="Listas y proyectos con subtareas, prioridad, fecha de entrega y tareas que se repiten."
        fase={1}
      />
    </Pantalla>
  );
}
