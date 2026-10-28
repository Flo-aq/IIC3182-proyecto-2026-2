// Fotos de How to › Crear, una por ajuste. Van sin números; `toques` marca dónde se toca (en % de la foto).
// Se generan con la interfaz real; si cambia el diseño, hay que volver a sacarlas.

export type Toque = { x: number; y: number; w: number; h: number };
export type FotoLimpia = { src: string; ancho: number; alto: number; toques: Toque[] };

export const FOTOS_CREAR: Record<string, FotoLimpia> = {
  "crear-desplegable-cerrado": {
    "src": "/ayuda/crear-desplegable-cerrado.png",
    "ancho": 372,
    "alto": 69,
    "toques": [
      {
        "x": 2.15,
        "y": 11.59,
        "w": 95.7,
        "h": 75.36
      }
    ]
  },
  "crear-desplegable-abierto": {
    "src": "/ayuda/crear-desplegable-abierto.png",
    "ancho": 372,
    "alto": 532,
    "toques": [
      {
        "x": 2.15,
        "y": 1.5,
        "w": 95.7,
        "h": 9.77
      }
    ]
  },
  "crear-nombre": {
    "src": "/ayuda/crear-nombre.png",
    "ancho": 374,
    "alto": 220,
    "toques": []
  },
  "crear-horario": {
    "src": "/ayuda/crear-horario.png",
    "ancho": 372,
    "alto": 216,
    "toques": []
  },
  "crear-bloque": {
    "src": "/ayuda/crear-bloque.png",
    "ancho": 372,
    "alto": 189,
    "toques": []
  },
  "crear-bloqueos": {
    "src": "/ayuda/crear-bloqueos.png",
    "ancho": 372,
    "alto": 303,
    "toques": []
  },
  "crear-claves": {
    "src": "/ayuda/crear-claves.png",
    "ancho": 372,
    "alto": 185,
    "toques": []
  },
  "crear-plantilla": {
    "src": "/ayuda/crear-plantilla.png",
    "ancho": 374,
    "alto": 95,
    "toques": []
  },
  "crear-boton-celular": {
    "src": "/ayuda/crear-boton-celular.png",
    "ancho": 374,
    "alto": 128,
    "toques": []
  },
  "crear-boton-computador": {
    "src": "/ayuda/crear-boton-computador.png",
    "ancho": 632,
    "alto": 72,
    "toques": []
  }
};
