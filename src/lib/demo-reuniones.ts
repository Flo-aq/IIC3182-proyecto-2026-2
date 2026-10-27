// Reuniones de ejemplo para evaluar la pantalla de responder mientras no hay base de datos.
// Cada una cubre un caso distinto: el caso normal, bloques cortos, más de 7 días, un día entero y bloques de 10 min.

import { type Reunion } from "./reunion";
import { type Persona, type ReunionConRespuestas, claveBloque, totalFilas, horaDeFila } from "./respuestas";
import { aMinutos } from "./reunion";

type Rango = [dia: string, desde: string, hasta: string];

/** Pasa rangos de horas a los bloques "AAAA-MM-DD|fila" en que cabe cada uno (los bloqueados no se cuentan). */
function bloques(r: Reunion, rangos: Rango[]): string[] {
  const salida: string[] = [];
  const filas = totalFilas(r);
  for (const [dia, desde, hasta] of rangos) {
    for (let f = 0; f < filas; f++) {
      const ini = aMinutos(horaDeFila(r, f));
      const fin = ini + r.bloqueMin;
      const bloqueado = r.bloqueos.some((b) => b.dias.includes(dia) && aMinutos(b.desde) < fin && aMinutos(b.hasta) > ini);
      if (!bloqueado && ini >= aMinutos(desde) && fin <= aMinutos(hasta)) salida.push(claveBloque(dia, f));
    }
  }
  return salida;
}

const persona = (r: Reunion, nombre: string, clave: boolean, rangos: Rango[]): Persona => ({ nombre, clave, disp: bloques(r, rangos) });

const equipo: Reunion = {
  titulo: "Reunión de equipo IHC",
  zona: "America/Santiago",
  dias: ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02"],
  desde: "08:00",
  hasta: "22:00",
  bloqueMin: 30,
  claves: 2,
  bloqueos: [{ id: "b1", dias: ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02"], desde: "13:00", hasta: "14:00" }],
};

const ayudantia: Reunion = {
  titulo: "Ayudantía con profe y ayudante",
  zona: "America/Santiago",
  dias: ["2026-10-28", "2026-10-29", "2026-10-30"],
  desde: "09:00",
  hasta: "13:00",
  bloqueMin: 15,
  claves: 2,
  bloqueos: [{ id: "b1", dias: ["2026-10-28", "2026-10-29", "2026-10-30"], desde: "11:00", hasta: "11:15" }],
};

const retiro: Reunion = {
  titulo: "Retiro del curso",
  zona: "America/Santiago",
  // 10 días entre dos semanas: el viernes 6 al domingo 15; la grilla se muestra por semanas.
  dias: ["2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"],
  desde: "10:00",
  hasta: "20:00",
  bloqueMin: 30,
  claves: 1,
  bloqueos: [],
};

const maraton: Reunion = {
  titulo: "Maratón de estudio",
  zona: "America/Santiago",
  dias: ["2026-11-07"],
  desde: "00:00",
  hasta: "24:00",
  bloqueMin: 30,
  claves: 0,
  bloqueos: [],
};

const express: Reunion = {
  titulo: "Reunión express de mañana",
  zona: "America/Santiago",
  dias: ["2026-10-28", "2026-10-29"],
  desde: "14:00",
  hasta: "17:00",
  bloqueMin: 10,
  claves: 2,
  bloqueos: [{ id: "b1", dias: ["2026-10-28", "2026-10-29"], desde: "15:30", hasta: "15:50" }],
};

const curso: Reunion = {
  titulo: "Reunión general del curso",
  zona: "America/Santiago",
  dias: ["2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03"],
  desde: "09:00",
  hasta: "18:00",
  bloqueMin: 30,
  claves: 2,
  bloqueos: [{ id: "b1", dias: ["2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03"], desde: "13:00", hasta: "14:00" }],
};

const SEMANA_1 = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"];
const SEMANA_2 = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"];
const HABILES = [...SEMANA_1.slice(0, 5), ...SEMANA_2.slice(0, 5)];

// Dos semanas completas con las 24 horas del día y varios bloqueos: de noche, a la hora de almuerzo y en clases.
const guardia: Reunion = {
  titulo: "Turnos del proyecto (2 semanas, 24 h)",
  zona: "America/Santiago",
  dias: [...SEMANA_1, ...SEMANA_2],
  desde: "00:00",
  hasta: "24:00",
  bloqueMin: 30,
  claves: 2,
  bloqueos: [
    { id: "b1", dias: [...SEMANA_1, ...SEMANA_2], desde: "00:00", hasta: "07:00" },
    { id: "b2", dias: HABILES, desde: "13:00", hasta: "14:00" },
    { id: "b3", dias: ["2026-11-02", "2026-11-04", "2026-11-09", "2026-11-11"], desde: "10:00", hasta: "11:30" },
    { id: "b4", dias: ["2026-11-03", "2026-11-05", "2026-11-10", "2026-11-12"], desde: "15:30", hasta: "17:00" },
  ],
};

const NOMBRES_CURSO = ["Profe Carla", "Ayud. Tomás", "Ana", "Benja", "Cata", "Dani", "Eli", "Fabi", "Gaspar", "Hana", "Ignacio", "Javiera", "Kevin", "Laura", "Mateo", "Nicole"];

/** Una respuesta distinta por persona: cada una puede en una franja que cambia con su posición. */
function respuestaDelCurso(i: number): Persona {
  const hora = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const rangos: Rango[] = curso.dias.flatMap((dia, d): Rango[] => {
    if ((i + d) % 4 === 3) return [];
    const desde = 9 + ((i * 3 + d * 2) % 6);
    return [[dia, hora(desde), hora(Math.min(18, desde + 3 + ((i + d) % 3)))]];
  });
  return persona(curso, NOMBRES_CURSO[i], i < 2, rangos);
}

export const REUNIONES_DE_EJEMPLO: ReunionConRespuestas[] = [
  {
    slug: "equipo-ihc",
    reunion: equipo,
    personas: [
      persona(equipo, "Marta", true, [["2026-10-27", "10:00", "13:00"], ["2026-10-28", "11:00", "13:00"], ["2026-10-29", "14:30", "17:30"], ["2026-10-30", "09:00", "12:00"]]),
      persona(equipo, "Luis", true, [["2026-10-27", "10:30", "12:30"], ["2026-10-28", "11:00", "13:30"], ["2026-10-29", "15:00", "18:00"], ["2026-11-02", "09:00", "12:00"]]),
      persona(equipo, "Camila", false, [["2026-10-27", "08:00", "12:30"], ["2026-10-28", "10:00", "15:00"], ["2026-10-29", "14:00", "20:00"], ["2026-11-02", "09:00", "14:00"]]),
      persona(equipo, "Diego", false, [["2026-10-28", "09:00", "13:00"], ["2026-10-29", "15:00", "19:00"], ["2026-10-30", "08:00", "17:00"]]),
      persona(equipo, "Sofía", false, [["2026-10-27", "10:00", "12:00"], ["2026-10-28", "11:00", "14:30"], ["2026-10-29", "14:00", "17:00"], ["2026-11-02", "08:00", "11:00"]]),
    ],
  },
  {
    slug: "ayudantia",
    reunion: ayudantia,
    personas: [
      persona(ayudantia, "Prof. Rojas", true, [["2026-10-28", "09:30", "11:00"], ["2026-10-29", "10:00", "12:30"], ["2026-10-30", "09:00", "10:30"]]),
      persona(ayudantia, "Ayud. Pía", true, [["2026-10-28", "10:00", "12:00"], ["2026-10-29", "10:00", "12:00"], ["2026-10-30", "09:00", "11:00"]]),
      persona(ayudantia, "Joaquín", false, [["2026-10-28", "09:00", "13:00"], ["2026-10-29", "11:30", "13:00"]]),
      persona(ayudantia, "Valentina", false, [["2026-10-29", "10:00", "12:30"], ["2026-10-30", "09:30", "12:00"]]),
    ],
  },
  {
    slug: "retiro-curso",
    reunion: retiro,
    personas: [
      persona(retiro, "Nico", true, [["2026-11-07", "10:00", "18:00"], ["2026-11-08", "12:00", "20:00"], ["2026-11-14", "10:00", "16:00"]]),
      persona(retiro, "Ale", false, [["2026-11-07", "10:00", "14:00"], ["2026-11-08", "10:00", "20:00"], ["2026-11-14", "12:00", "18:00"], ["2026-11-15", "10:00", "13:00"]]),
      persona(retiro, "Fran", false, [["2026-11-06", "16:00", "20:00"], ["2026-11-07", "11:00", "17:00"], ["2026-11-08", "13:00", "19:00"]]),
      persona(retiro, "Rocío", false, [["2026-11-08", "10:00", "16:00"], ["2026-11-14", "10:00", "20:00"]]),
    ],
  },
  {
    slug: "maraton",
    reunion: maraton,
    personas: [
      persona(maraton, "Ema", false, [["2026-11-07", "09:00", "13:00"], ["2026-11-07", "15:00", "22:00"]]),
      persona(maraton, "Tomás", false, [["2026-11-07", "10:00", "14:00"], ["2026-11-07", "20:00", "24:00"]]),
      persona(maraton, "Pía", false, [["2026-11-07", "08:00", "12:00"], ["2026-11-07", "16:00", "21:00"]]),
    ],
  },
  {
    slug: "curso-completo",
    reunion: curso,
    personas: NOMBRES_CURSO.map((_, i) => respuestaDelCurso(i)),
  },
  {
    slug: "dos-semanas",
    reunion: guardia,
    personas: [
      persona(guardia, "Marta", true, [["2026-11-02", "14:00", "20:00"], ["2026-11-03", "08:00", "12:00"], ["2026-11-05", "18:00", "23:00"], ["2026-11-10", "09:00", "15:00"], ["2026-11-14", "10:00", "18:00"]]),
      persona(guardia, "Luis", true, [["2026-11-02", "16:00", "22:00"], ["2026-11-04", "12:00", "20:00"], ["2026-11-10", "10:00", "15:00"], ["2026-11-14", "08:00", "16:00"]]),
      persona(guardia, "Camila", false, [["2026-11-02", "12:00", "23:30"], ["2026-11-06", "07:00", "13:00"], ["2026-11-10", "08:00", "15:30"], ["2026-11-13", "14:00", "24:00"]]),
      persona(guardia, "Diego", false, [["2026-11-04", "14:00", "24:00"], ["2026-11-07", "09:00", "22:00"], ["2026-11-10", "11:00", "17:00"], ["2026-11-15", "10:00", "20:00"]]),
      persona(guardia, "Sofía", false, [["2026-11-03", "07:00", "15:00"], ["2026-11-05", "17:00", "24:00"], ["2026-11-10", "09:00", "15:00"], ["2026-11-14", "12:00", "20:00"]]),
    ],
  },
  {
    slug: "express",
    reunion: express,
    personas: [
      persona(express, "Marta", true, [["2026-10-28", "14:00", "15:30"], ["2026-10-29", "14:30", "16:30"]]),
      persona(express, "Camila", false, [["2026-10-28", "14:20", "16:00"], ["2026-10-29", "15:00", "17:00"]]),
      persona(express, "Diego", false, [["2026-10-28", "15:00", "17:00"], ["2026-10-29", "14:00", "16:00"]]),
    ],
  },
];

export const reunionDeEjemplo = (slug: string): ReunionConRespuestas | undefined =>
  REUNIONES_DE_EJEMPLO.find((r) => r.slug === slug);
