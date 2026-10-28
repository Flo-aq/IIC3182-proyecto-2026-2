"use client";

import { useSyncExternalStore } from "react";

// La llave del creador de una reunión sin cuenta: se guarda en este navegador al crearla y permite cerrarla o reabrirla.
// Si se cambia de dispositivo o se borran los datos del navegador, se pierde (con una cuenta no hace falta).

const clave = (slug: string) => `wemeet:dueno:${slug}`;

export function guardarLlave(slug: string, llave: string): void {
  try {
    localStorage.setItem(clave(slug), llave);
  } catch {
    // Sin almacenamiento (modo privado, por ejemplo): la reunión se crea igual, pero solo se podrá cerrar con una cuenta.
  }
}

export function leerLlave(slug: string): string | undefined {
  try {
    return localStorage.getItem(clave(slug)) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Si este navegador guardó la llave de esa reunión (en el servidor, siempre falso). */
export function useTieneLlave(slug: string): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => leerLlave(slug) !== undefined,
    () => false,
  );
}
