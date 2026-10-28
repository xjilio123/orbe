import {
  alternarTarea,
  capturarTarea,
  crearLista,
  crearSubtarea,
  eliminarLista,
  eliminarTarea,
  guardarLista,
  guardarTarea,
  moverTarea,
} from "./tareas";
import type { AccionesTareas } from "./tipos";

/** Las acciones reales que reciben las pantallas (la vitrina usa unas que no hacen nada). */
export const accionesTareas: AccionesTareas = {
  capturar: capturarTarea,
  alternar: alternarTarea,
  mover: moverTarea,
  guardar: guardarTarea,
  eliminar: eliminarTarea,
  crearSubtarea,
  crearLista,
  guardarLista,
  eliminarLista,
};
