import { guardarCalendario, guardarSuscripcion, invitar, probarAvisos, quitarCalendario, quitarInvitado, quitarSuscripcion } from "./ajustes";
import {
  alternarFavorita,
  alternarPlantilla,
  crearPagina,
  eliminarAdjunto,
  eliminarPagina,
  guardarPagina,
  restaurarVersion,
  subirAdjunto,
} from "./apuntes";
import { eliminarDefinitivo, restaurar, vaciarPapelera } from "./papelera";
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
import type { AccionesAjustes, AccionesApuntes, AccionesPapelera, AccionesTareas } from "./tipos";

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
  plantilla: alternarPlantilla,
  restaurarVersion,
};

export const accionesPapelera: AccionesPapelera = { restaurar, eliminar: eliminarDefinitivo, vaciar: vaciarPapelera };

export const accionesAjustes: AccionesAjustes = {
  guardarSuscripcion,
  quitarSuscripcion,
  probarAvisos,
  guardarCalendario,
  quitarCalendario,
  invitar,
  quitarInvitado,
};
