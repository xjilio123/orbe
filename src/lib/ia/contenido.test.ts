import { describe, expect, it } from "vitest";
import { aBloques, plan, semana, tarjetas, tipoDeAudio } from "./contenido";

describe("plan del día", () => {
  it("ordena por hora, descarta bloques sin hora y no inventa tareas", () => {
    const r = plan.validar.parse({
      bloques: [
        { hora: "15:00", minutos: 600, titulo: "Informe", tipo: "tarea", tarea_id: "t1" },
        { hora: "las 9", minutos: 30, titulo: "Sin hora", tipo: "tarea", tarea_id: null },
        { hora: "09:30", minutos: 1, titulo: "Daily", tipo: "evento", tarea_id: null },
        { hora: "10:00", minutos: 45, titulo: "Inventada", tipo: "tarea", tarea_id: "no-existe" },
      ],
      consejo: "  Empieza por lo vencido. ",
    });
    expect(plan.limpiar(r, ["t1"])).toEqual({
      bloques: [
        { hora: "09:30", minutos: 5, titulo: "Daily", tipo: "evento", tarea_id: null },
        { hora: "10:00", minutos: 45, titulo: "Inventada", tipo: "tarea", tarea_id: null },
        { hora: "15:00", minutos: 240, titulo: "Informe", tipo: "tarea", tarea_id: "t1" },
      ],
      consejo: "Empieza por lo vencido.",
    });
  });
});

describe("resumen semanal y tarjetas", () => {
  it("deja máximo 5 logros y 5 pendientes", () => {
    const r = semana.limpiar({ resumen: "Bien", logros: ["1", "2", "", "3", "4", "5", "6"], pendientes: [], sugerencia: "Seguir" });
    expect(r.logros).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("las tarjetas se guardan como una página para repasar", () => {
    const pagina = tarjetas.aPagina("SQL", [
      { pregunta: "¿Qué hace ROW_NUMBER?", respuesta: "Numera filas." },
      { pregunta: "", respuesta: "Sin pregunta" },
    ]);
    expect(pagina.titulo).toBe("Tarjetas: SQL");
    expect(pagina.contenido.map((b) => b.tipo)).toEqual(["aviso", "h3", "p", "separador"]);
    expect(pagina.contenido[1].texto).toBe("1. ¿Qué hace ROW_NUMBER?");
  });
});

describe("foto y nota de voz", () => {
  it("convierte la respuesta en bloques del editor, sin vacíos", () => {
    const r = aBloques.validar.parse({ titulo: "Pizarra", bloques: [{ tipo: "todo", texto: "Comprar tiza" }, { tipo: "video", texto: "x" }, { tipo: "p", texto: "  " }] });
    const limpio = aBloques.limpiar(r);
    expect(limpio.bloques.map((b) => [b.tipo, b.texto])).toEqual([
      ["todo", "Comprar tiza"],
      ["p", "x"],
    ]);
    expect(limpio.bloques[0].hecho).toBe(false);
  });

  it("reconoce el audio por sus bytes, no por el nombre", () => {
    const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const m4a = new Uint8Array([0, 0, 0, 0x20, ...new TextEncoder().encode("ftypM4A "), 0]);
    expect(tipoDeAudio(webm)).toBe("audio/webm");
    expect(tipoDeAudio(m4a)).toBe("audio/m4a");
    expect(tipoDeAudio(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
  });
});
