// Lógica pura de cerrar una reunión: qué horarios se ofrecen para elegir, ordenados en grupos.
// No usa el DOM, así se puede probar sin navegador.

import { type Reunion, etiquetaDia } from "./reunion";
import { type PersonaSet, horaDeFila, mapaBloqueados, totalFilas } from "./respuestas";

export type OpcionCierre = {
  dia: string;
  fila: number;
  /** El bloque como lo usa la grilla: "AAAA-MM-DD|fila". */
  bloque: string;
  /** Quiénes no pueden en este bloque (primero la gente, después los integrantes clave). */
  faltan: { nombre: string; clave: boolean }[];
};

export type GrupoCierre = {
  /** 1 es el mejor: están todos los clave y toda la gente; 4 es el que menos cumple. */
  id: 1 | 2 | 3 | 4;
  titulo: string;
  opciones: OpcionCierre[];
};

const quienes = (faltan: number): string => (faltan === 0 ? "Puede toda la gente" : faltan === 1 ? "Falta 1 persona" : `Faltan ${faltan} personas`);

/**
 * Todos los horarios que se pueden elegir, en hasta cuatro grupos (del mejor al peor):
 *  1. están todos los integrantes clave y toda la gente;
 *  2. están todos los clave y a la gente le falta 1;
 *  3. está toda la gente, pero falta algún integrante clave;
 *  4. a la gente le falta 1 y falta algún integrante clave.
 * "Toda la gente" no cuenta a los integrantes clave. Si en ningún bloque está toda la gente, los grupos bajan un nivel
 * (falta 1 y faltan 2), y así hasta el menor número de ausentes que haya. Un bloque en que no puede nadie no se ofrece.
 * Sin integrantes clave que hayan respondido, solo hay grupos 1 y 2.
 */
export function gruposDeCierre(r: Reunion, personas: PersonaSet[]): GrupoCierre[] {
  const claves = personas.filter((p) => p.clave);
  const gente = personas.filter((p) => !p.clave);
  const bloqueados = mapaBloqueados(r);
  const filas = totalFilas(r);

  const bloques: { dia: string; fila: number; faltanGente: PersonaSet[]; faltanClaves: PersonaSet[] }[] = [];
  for (const dia of [...r.dias].sort()) {
    for (let fila = 0; fila < filas; fila++) {
      if (bloqueados[dia][fila]) continue;
      const faltanGente = gente.filter((p) => !p.puede(dia, fila));
      const faltanClaves = claves.filter((p) => !p.puede(dia, fila));
      if (faltanGente.length + faltanClaves.length === personas.length) continue;
      bloques.push({ dia, fila, faltanGente, faltanClaves });
    }
  }
  if (!bloques.length) return [];

  const base = Math.min(...bloques.map((b) => b.faltanGente.length));
  const hayClaves = claves.length > 0;
  const grupos = new Map<GrupoCierre["id"], GrupoCierre>();

  for (const b of bloques) {
    const m = b.faltanGente.length;
    if (m !== base && m !== base + 1) continue;
    const completos = b.faltanClaves.length === 0;
    const id = (m === base ? (completos ? 1 : 3) : completos ? 2 : 4) as GrupoCierre["id"];
    let g = grupos.get(id);
    if (!g) {
      const claveTxt = hayClaves ? (completos ? " · con todos los integrantes clave" : " · falta algún integrante clave") : "";
      g = { id, titulo: `${quienes(m)}${claveTxt}`, opciones: [] };
      grupos.set(id, g);
    }
    g.opciones.push({
      dia: b.dia,
      fila: b.fila,
      bloque: `${b.dia}|${b.fila}`,
      faltan: [...b.faltanGente, ...b.faltanClaves].map((p) => ({ nombre: p.nombre, clave: p.clave })),
    });
  }
  return [...grupos.values()].sort((a, b) => a.id - b.id);
}

/** "mar 3 nov, 10:00 a 10:30": el bloque en la zona de la reunión. */
export function textoBloque(r: Pick<Reunion, "desde" | "bloqueMin">, bloque: string): string {
  const [dia, fila] = bloque.split("|");
  const f = Number(fila);
  return `${etiquetaDia(dia)}, ${horaDeFila(r, f)} a ${horaDeFila(r, f + 1)}`;
}
