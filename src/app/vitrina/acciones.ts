"use server";

import type { EstadoCaptura, EstadoFormulario } from "@/app/acciones/tipos";
import { vitrinaActiva } from "@/lib/vitrina";

// Acciones de la vitrina: no tocan ninguna base de datos. Fuera de la vitrina se niegan a todo.
function exigirVitrina() {
  if (!vitrinaActiva()) throw new Error("No disponible");
}

export async function capturarVitrina(anterior: EstadoCaptura): Promise<EstadoCaptura> {
  exigirVitrina();
  return { ok: true, n: anterior.n + 1 };
}

export async function subtareaVitrina(_padreId: string, anterior: EstadoCaptura): Promise<EstadoCaptura> {
  exigirVitrina();
  return { ok: true, n: anterior.n + 1 };
}

export async function guardarVitrina(): Promise<{ ok: boolean }> {
  exigirVitrina();
  return { ok: true };
}

export async function subirVitrina(): Promise<{ ok: false; error: string }> {
  exigirVitrina();
  return { ok: false, error: "En la vitrina no se suben archivos." };
}

export async function nadaVitrina(): Promise<void> {
  exigirVitrina();
}

export async function formularioVitrina(): Promise<EstadoFormulario> {
  exigirVitrina();
  return { ok: true };
}
