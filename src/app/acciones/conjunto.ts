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
import { capturaIa, dividirIa, ordenarInboxIa, resumirIa, textoIa } from "./ia";
import { audioIa, fotoIa, planIa, semanaIa, tarjetasIa } from "./iaContenido";
import { preguntarIa } from "./iaNotas";
import { crearPaginaEnlazada, importarMarkdown } from "./notas";
import { eliminarDefinitivo, restaurar, vaciarPapelera } from "./papelera";
import {
  avanzarMeta,
  crearFechaImportante,
  crearHabito,
  crearMeta,
  eliminarFechaImportante,
  eliminarHabito,
  eliminarMeta,
  guardarFoco,
  marcarHabito,
} from "./progreso";
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
import type { AccionesAjustes, AccionesApuntes, AccionesIa, AccionesNotas, AccionesPapelera, AccionesProgreso, AccionesTareas } from "./tipos";

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

export const accionesIa: AccionesIa = {
  captura: capturaIa,
  dividir: dividirIa,
  ordenarInbox: ordenarInboxIa,
  texto: textoIa,
  resumir: resumirIa,
  plan: planIa,
  semana: semanaIa,
  tarjetas: tarjetasIa,
  foto: fotoIa,
  audio: audioIa,
  preguntar: preguntarIa,
};

export const accionesProgreso: AccionesProgreso = {
  crearHabito,
  eliminarHabito,
  marcarHabito,
  crearMeta,
  avanzarMeta,
  eliminarMeta,
  crearFecha: crearFechaImportante,
  eliminarFecha: eliminarFechaImportante,
  guardarFoco,
};

export const accionesNotas: AccionesNotas = { crearEnlazada: crearPaginaEnlazada, importar: importarMarkdown };
