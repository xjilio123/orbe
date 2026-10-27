import { Encabezado, Pantalla, Proximamente } from "@/components/ui";

export const metadata = { title: "Apuntes · Orbe" };

export default function Apuntes() {
  return (
    <Pantalla>
      <Encabezado titulo="Apuntes" />
      <Proximamente
        icono="apuntes"
        color="naranja"
        titulo="Páginas que crecen contigo"
        texto="Títulos, listas, código, tablas e imágenes, con páginas dentro de páginas, como en Notion."
        fase={1}
      />
    </Pantalla>
  );
}
