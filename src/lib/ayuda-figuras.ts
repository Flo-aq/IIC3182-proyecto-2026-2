// Fotos de la ayuda (How to), recortadas a lo que se explica. Cada marca lleva el número del paso del texto que ilustra
// (el mismo número que en la lista de pasos); sus cajas y la altura del número están en % de la foto.
// Se generan con las pantallas de ejemplo; si cambia el diseño, hay que volver a sacarlas.

export type Marca = { paso: number; x: number; y: number; w: number; h: number; numY: number };
export type Figura = { src: string; ancho: number; alto: number; marcas: Marca[] };

export const FIGURAS: Record<string, Figura> = {
  "crear": {
    "src": "/ayuda/crear.jpg",
    "ancho": 390,
    "alto": 766,
    "marcas": [
      {
        "paso": 1,
        "x": 2.56,
        "y": 2.35,
        "w": 94.87,
        "h": 7.83,
        "numY": 2.35
      },
      {
        "paso": 1,
        "x": 2.82,
        "y": 10.31,
        "w": 94.36,
        "h": 8.49,
        "numY": 10.31
      },
      {
        "paso": 2,
        "x": 2.82,
        "y": 17.23,
        "w": 94.36,
        "h": 8.49,
        "numY": 17.23
      },
      {
        "paso": 2,
        "x": 2.82,
        "y": 24.15,
        "w": 94.36,
        "h": 8.49,
        "numY": 24.15
      },
      {
        "paso": 3,
        "x": 2.82,
        "y": 31.07,
        "w": 94.36,
        "h": 8.49,
        "numY": 31.07
      },
      {
        "paso": 3,
        "x": 2.82,
        "y": 37.99,
        "w": 94.36,
        "h": 8.49,
        "numY": 37.99
      },
      {
        "paso": 4,
        "x": 2.56,
        "y": 90.34,
        "w": 94.87,
        "h": 8.88,
        "numY": 90.34
      }
    ]
  },
  "acceso": {
    "src": "/ayuda/acceso.jpg",
    "ancho": 390,
    "alto": 190,
    "marcas": [
      {
        "paso": 1,
        "x": 2.56,
        "y": 9.49,
        "w": 94.87,
        "h": 31.63,
        "numY": 9.49
      },
      {
        "paso": 2,
        "x": 2.56,
        "y": 42.17,
        "w": 94.87,
        "h": 48.34,
        "numY": 42.17
      }
    ]
  },
  "responder": {
    "src": "/ayuda/responder.jpg",
    "ancho": 390,
    "alto": 526,
    "marcas": [
      {
        "paso": 3,
        "x": 28.1,
        "y": 3.42,
        "w": 18.87,
        "h": 34.25,
        "numY": 3.42
      },
      {
        "paso": 3,
        "x": 11.28,
        "y": 17.63,
        "w": 86.15,
        "h": 9.39,
        "numY": 17.63
      },
      {
        "paso": 4,
        "x": 2.56,
        "y": 87.45,
        "w": 94.87,
        "h": 11.41,
        "numY": 87.45
      }
    ]
  },
  "respuestas": {
    "src": "/ayuda/respuestas.jpg",
    "ancho": 390,
    "alto": 615,
    "marcas": [
      {
        "paso": 1,
        "x": 2.56,
        "y": 2.93,
        "w": 94.87,
        "h": 80.37,
        "numY": 2.93
      },
      {
        "paso": 2,
        "x": 44.92,
        "y": 44.9,
        "w": 18.87,
        "h": 4.56,
        "numY": 44.9
      },
      {
        "paso": 2,
        "x": 2.56,
        "y": 83.51,
        "w": 94.87,
        "h": 13.56,
        "numY": 83.51
      }
    ]
  },
  "compartir": {
    "src": "/ayuda/compartir.jpg",
    "ancho": 390,
    "alto": 339,
    "marcas": [
      {
        "paso": 1,
        "x": 2.56,
        "y": 5.31,
        "w": 94.87,
        "h": 17.71,
        "numY": 5.31
      },
      {
        "paso": 2,
        "x": 2.56,
        "y": 59.27,
        "w": 94.87,
        "h": 17.71,
        "numY": 59.27
      },
      {
        "paso": 1,
        "x": 2.56,
        "y": 76.98,
        "w": 94.87,
        "h": 17.71,
        "numY": 76.98
      }
    ]
  },
  "perfil": {
    "src": "/ayuda/perfil.jpg",
    "ancho": 390,
    "alto": 139,
    "marcas": [
      {
        "paso": 2,
        "x": 2.56,
        "y": 13,
        "w": 27.44,
        "h": 34.66,
        "numY": 13
      },
      {
        "paso": 3,
        "x": 64.36,
        "y": 13,
        "w": 33.08,
        "h": 34.66,
        "numY": 31.77
      },
      {
        "paso": 4,
        "x": 73.85,
        "y": 49.1,
        "w": 23.59,
        "h": 34.66,
        "numY": 50.54
      },
      {
        "paso": 1,
        "x": 2.56,
        "y": 66.79,
        "w": 50,
        "h": 20.22,
        "numY": 69.31
      }
    ]
  },
  "escritorio": {
    "src": "/ayuda/escritorio.jpg",
    "ancho": 1280,
    "alto": 692,
    "marcas": [
      {
        "paso": 3,
        "x": 0.78,
        "y": 2.6,
        "w": 59.78,
        "h": 95.95,
        "numY": 2.6
      },
      {
        "paso": 3,
        "x": 61.5,
        "y": 2.6,
        "w": 37.72,
        "h": 95.95,
        "numY": 6.36
      }
    ]
  }
};
