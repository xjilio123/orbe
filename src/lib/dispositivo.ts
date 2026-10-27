"use client";

// Detección del entorno del navegador para la PWA. Solo se usa en componentes de cliente.

export const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
export const esAndroid = () => /Android/i.test(navigator.userAgent);

export const estaInstalada = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
