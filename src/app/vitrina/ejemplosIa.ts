import type { Plan, ResumenSemana } from "@/lib/ia/contenido";

// Resultados de IA ficticios para la vitrina (los usa la pantalla Hoy y las acciones de mentira).

export const PLAN_VITRINA: Plan = {
  bloques: [
    { hora: "15:30", minutos: 30, titulo: "Repasar window functions de SQL", tipo: "tarea", tarea_id: null },
    { hora: "16:00", minutos: 10, titulo: "Pausa", tipo: "pausa", tarea_id: null },
    { hora: "16:10", minutos: 50, titulo: "Enviar informe de ventas a Prediqt", tipo: "tarea", tarea_id: null },
    { hora: "19:00", minutos: 60, titulo: "Clase de inglés", tipo: "evento", tarea_id: null },
  ],
  consejo: "Empieza por el informe atrasado y deja el repaso para el final.",
};

export const SEMANA_VITRINA: ResumenSemana = {
  resumen: "Semana productiva: terminaste 12 tareas y avanzaste tus apuntes de SQL.",
  logros: ["Entregaste el informe de septiembre", "Repasaste window functions"],
  pendientes: ["Pagar la tarjeta BBVA"],
  sugerencia: "Agenda 30 minutos el lunes para lo vencido.",
};
