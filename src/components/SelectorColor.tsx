import { FONDO_COLOR } from "@/components/ui";
import { COLORES_LISTA, type ColorLista } from "@/lib/tareas";

export const NOMBRE_COLOR: Record<ColorLista, string> = {
  indigo: "Índigo",
  azul: "Azul",
  rojo: "Rojo",
  morado: "Morado",
  naranja: "Naranja",
  verde: "Verde",
  celeste: "Celeste",
};

/** Siete círculos de color (radio buttons) para listas, hábitos, metas y fechas. */
export function SelectorColor({ color = "azul", nombre = "color" }: { color?: ColorLista; nombre?: string }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-semibold text-texto-2">Color</legend>
      <div className="flex justify-between">
        {COLORES_LISTA.map((c) => (
          <label key={c} className="relative">
            <input type="radio" name={nombre} value={c} defaultChecked={c === color} className="peer sr-only" aria-label={NOMBRE_COLOR[c]} />
            <span
              className={`block size-9 rounded-full ${FONDO_COLOR[c]} ring-offset-2 ring-offset-superficie peer-checked:ring-2 peer-checked:ring-texto peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-relleno`}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
