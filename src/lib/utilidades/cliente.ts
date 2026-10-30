"use client";

import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};

/** Desde este ancho (lg) las pantallas muestran su versión de escritorio. */
const ANCHO = "(min-width: 1024px)";

const suscribirAncho = (aviso: () => void) => {
  const m = window.matchMedia(ANCHO);
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
};

/** Si la pantalla es lo bastante ancha para la versión de escritorio (en el servidor, siempre falso). */
export function useEsPantallaAncha(): boolean {
  return useSyncExternalStore(
    suscribirAncho,
    () => window.matchMedia(ANCHO).matches,
    () => false,
  );
}

/** El origen de la página, para armar el link de una reunión. */
export function useOrigen(): string {
  return useSyncExternalStore(sinSuscripcion, () => window.location.origin, () => "https://wemeet.app");
}
