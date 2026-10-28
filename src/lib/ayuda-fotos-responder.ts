// Fotos de How to › Responder, Mi horario. Van sin números; `toques` encierra lo que se explica (en % de la foto).
// Se generan con la interfaz real; si cambia el diseño, hay que volver a sacarlas.

import type { FotoLimpia } from "./ayuda-fotos-crear";

export const FOTOS_RESPONDER: Record<string, FotoLimpia> = {
  "responder-horario": {
    src: "/ayuda/responder-horario.png",
    ancho: 390,
    alto: 699,
    toques: [],
  },
  "responder-conteo": {
    src: "/ayuda/responder-conteo.png",
    ancho: 390,
    alto: 86,
    toques: [
      {
        x: 27.95,
        y: 5.81,
        w: 44.1,
        h: 24.42,
      },
    ],
  },
  "responder-guardar": {
    src: "/ayuda/responder-guardar.png",
    ancho: 374,
    alto: 64,
    toques: [],
  },
};
