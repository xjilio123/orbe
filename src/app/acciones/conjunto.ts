import { alternarFavorita, crearPagina, eliminarAdjunto, eliminarPagina, guardarPagina, subirAdjunto } from "./apuntes";
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
import type { AccionesApuntes, AccionesTareas } from "./tipos";

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

export const accionesApuntes: AccionesApuntes = {
  crear: crearPagina,
  guardar: guardarPagina,
  favorita: alternarFavorita,
  eliminar: eliminarPagina,
  subir: subirAdjunto,
  eliminarAdjunto,
};
