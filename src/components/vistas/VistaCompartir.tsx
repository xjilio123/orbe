import { Icono } from "@/components/Icono";
import { Pantalla } from "@/components/ui";
import { tituloDe, type Compartido } from "@/lib/compartir";

type Props = {
  compartido: Compartido;
  error?: string;
  guardar: (como: "tarea" | "nota", formData: FormData) => Promise<void>;
};

const CAMPO = "w-full rounded-[12px] bg-control px-3 py-2.5 text-[17px] outline-none focus:ring-2 focus:ring-indigo-relleno/40";

/** Lo que compartiste desde otra app (Android): revísalo y guárdalo como tarea o como nota. */
export function VistaCompartir({ compartido: c, error, guardar }: Props) {
  return (
    <Pantalla>
      <header className="pt-2">
        <h1 className="text-[34px] leading-tight font-bold tracking-tight">Guardar en Orbe</h1>
      </header>
      <form className="flex flex-col gap-3 rounded-[22px] bg-superficie p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Título</span>
          <input name="titulo" defaultValue={tituloDe(c)} maxLength={200} className={CAMPO} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-texto-2">Texto</span>
          <textarea name="texto" defaultValue={c.texto} maxLength={5000} rows={5} className={`${CAMPO} resize-none`} />
        </label>
        {c.url && (
          <>
            <input type="hidden" name="url" value={c.url} />
            <p className="flex items-start gap-2 rounded-[12px] bg-control/60 px-3 py-2 text-[14px] break-all text-azul">
              <span aria-hidden="true">🔗</span>
              {c.url}
            </p>
          </>
        )}
        {error && <p className="text-[13px] text-rojo">{error === "vacio" ? "No llegó nada para guardar." : "No se pudo guardar. Intenta de nuevo."}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="submit"
            formAction={guardar.bind(null, "tarea")}
            className="flex items-center justify-center gap-2 rounded-[16px] bg-azul-relleno py-3.5 text-[17px] font-bold text-white active:scale-[0.98]"
          >
            <Icono nombre="tareas" className="size-5" />
            Como tarea
          </button>
          <button
            type="submit"
            formAction={guardar.bind(null, "nota")}
            className="flex items-center justify-center gap-2 rounded-[16px] bg-naranja-relleno py-3.5 text-[17px] font-bold text-[#1d1d1f] active:scale-[0.98]"
          >
            <Icono nombre="apuntes" className="size-5" />
            Como nota
          </button>
        </div>
      </form>
      <p className="px-1 text-[13px] leading-5 text-texto-2">
        La tarea va a tu Inbox con el enlace en sus notas. La nota queda en Apuntes. En Android, Orbe aparece en el menú Compartir una vez instalada.
      </p>
    </Pantalla>
  );
}
