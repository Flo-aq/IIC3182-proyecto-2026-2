// Lógica pura de la pantalla de responder una reunión: filas, semanas, conteos, colores y resumen.
// No usa el DOM, así se puede probar sin navegador.

import { type Reunion, aIso, aMinutos, bloquesDelDia, desdeIso, etiquetaDia, zonaCorta } from "./reunion";

/** Una persona que ya respondió. `disp` tiene una entrada "AAAA-MM-DD|fila" por cada bloque en que puede. */
export type Persona = { nombre: string; clave: boolean; disp: string[] };

export type ReunionConRespuestas = { slug: string; reunion: Reunion; personas: Persona[] };

/** Con más días que esto, la grilla muestra semanas de lunes a domingo y flechas para ir de una a otra. */
export const MAX_DIAS_SIN_SEMANAS = 7;

/** Cuántas columnas caben en un celular sin scroll; en modo semanal las 2 restantes se ven con scroll. */
export const COLUMNAS_VISIBLES = 5;

/** Con esta cantidad de respuestas (sin contar a los clave) el gris llega a su tono más oscuro. */
export const TOPE_RESPUESTAS = 8;

export const claveBloque = (dia: string, fila: number): string => `${dia}|${fila}`;

export function totalFilas(r: Pick<Reunion, "desde" | "hasta" | "bloqueMin">): number {
  return Math.floor((aMinutos(r.hasta) - aMinutos(r.desde)) / r.bloqueMin);
}

/** "08:30" para la fila 1 de una reunión que parte a las 08:00 con bloques de 30 min. */
export function horaDeFila(r: Pick<Reunion, "desde" | "bloqueMin">, fila: number): string {
  const total = aMinutos(r.desde) + fila * r.bloqueMin;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export const sumarDias = (iso: string, n: number): string => {
  const d = desdeIso(iso);
  d.setDate(d.getDate() + n);
  return aIso(d);
};

/** Lunes de la semana en que cae `iso`. */
export function lunesDe(iso: string): string {
  const d = desdeIso(iso);
  return sumarDias(iso, -((d.getDay() + 6) % 7));
}

export type Columna = { dia: string; activa: boolean };

export const esSemanal = (r: Pick<Reunion, "dias">): boolean => r.dias.length > MAX_DIAS_SIN_SEMANAS;

/** Semanas de lunes a domingo que cubren todos los días de la reunión; los días que no son de la encuesta quedan inactivos. */
export function semanasDe(dias: string[]): Columna[][] {
  const orden = [...dias].sort();
  if (!orden.length) return [];
  const elegidos = new Set(orden);
  const semanas: Columna[][] = [];
  const fin = orden[orden.length - 1];
  for (let lunes = lunesDe(orden[0]); lunes <= fin; lunes = sumarDias(lunes, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)).map((dia) => ({ dia, activa: elegidos.has(dia) })));
  }
  return semanas;
}

/** Las columnas que se muestran: todos los días si son 7 o menos, o la semana `semana` de lunes a domingo. */
export function columnasDe(r: Pick<Reunion, "dias">, semana: number): Columna[] {
  if (!esSemanal(r)) return [...r.dias].sort().map((dia) => ({ dia, activa: true }));
  const todas = semanasDe(r.dias);
  return todas[Math.min(Math.max(semana, 0), todas.length - 1)];
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const mesCorto = (iso: string): string => MESES_CORTOS[desdeIso(iso).getMonth()];


/** "27 oct – 2 nov": el rango de días que se ve. */
export function etiquetaRango(columnas: Columna[]): string {
  const a = columnas[0].dia;
  const b = columnas[columnas.length - 1].dia;
  const da = desdeIso(a);
  const db = desdeIso(b);
  const mesA = da.getMonth() === db.getMonth() ? "" : ` ${mesCorto(a)}`;
  return `${da.getDate()}${mesA} – ${db.getDate()} ${mesCorto(b)}`;
}

/** Conjuntos de bloques por persona, para consultar rápido. */
export type PersonaSet = { nombre: string; clave: boolean; puede: (dia: string, fila: number) => boolean; yo?: boolean };

export function conjuntos(personas: Persona[]): PersonaSet[] {
  return personas.map((p) => {
    const set = new Set(p.disp);
    return { nombre: p.nombre, clave: p.clave, puede: (dia, fila) => set.has(claveBloque(dia, fila)) };
  });
}

/** Los bloqueados por día: `bloqueado[dia][fila]` es true si un bloqueo de la reunión lo cubre. */
export function mapaBloqueados(r: Reunion): Record<string, boolean[]> {
  const salida: Record<string, boolean[]> = {};
  for (const dia of r.dias) salida[dia] = bloquesDelDia(r, dia).map((libre) => !libre);
  return salida;
}

// ---- colores del heatmap: gris cálido para la gente normal y violeta de la marca para los clave ----

type Rgb = [number, number, number];
const mezclar = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb;
const css = (c: Rgb): string => `rgb(${c.join(",")})`;

const GRIS_CLARO: Rgb = [226, 219, 209];
const GRIS_OSCURO: Rgb = [92, 84, 74];
const VIOLETA_CLARO: Rgb = [214, 205, 255];
const VIOLETA: Rgb = [72, 35, 255];

/** El tono más oscuro del gris sube con la cantidad de respuestas (sin contar a los clave), con un tope. */
export function grisMasOscuro(normales: number): Rgb {
  return mezclar(GRIS_CLARO, GRIS_OSCURO, 0.35 + 0.65 * Math.min(1, normales / TOPE_RESPUESTAS));
}

/** Gris para un bloque en que pueden `c` de las `normales` personas que no son clave. */
export function colorGris(c: number, normales: number): string {
  if (c <= 0 || normales <= 0) return "";
  const t = normales === 1 ? 1 : (c - 1) / (normales - 1);
  return css(mezclar(GRIS_CLARO, grisMasOscuro(normales), t));
}

/** Violeta para un bloque en que pueden todos los integrantes clave; más oscuro cuanta más gente normal puede. */
export function colorClave(c: number, normales: number): string {
  return css(mezclar(VIOLETA_CLARO, VIOLETA, normales > 0 ? 0.28 + 0.72 * (c / normales) : 1));
}

export const colorLeyendaGris = (normales: number): { claro: string; oscuro: string } => ({
  claro: css(GRIS_CLARO),
  oscuro: css(grisMasOscuro(Math.max(normales, 1))),
});

export const colorLeyendaClave = { claro: css(VIOLETA_CLARO), oscuro: css(VIOLETA) };

// ---- resumen para copiar al grupo ----

export type Tramo = { dia: string; desde: number; hasta: number; puedenN: number };

/** Los mejores tramos: bloques seguidos con la misma cantidad de gente; si hay clave, solo donde pueden todos. */
export function mejoresTramos(r: Reunion, personas: PersonaSet[], exigirClave: boolean): Tramo[] {
  const claves = personas.filter((p) => p.clave);
  const filas = totalFilas(r);
  const bloqueados = mapaBloqueados(r);
  const salida: Tramo[] = [];
  for (const dia of [...r.dias].sort()) {
    const cuenta = (f: number) => personas.filter((p) => p.puede(dia, f)).length;
    const sirve = (f: number) =>
      !bloqueados[dia][f] && cuenta(f) > 0 && (!exigirClave || (claves.length > 0 && claves.every((p) => p.puede(dia, f))));
    let f = 0;
    while (f < filas) {
      if (!sirve(f)) {
        f++;
        continue;
      }
      const c = cuenta(f);
      let q = f + 1;
      while (q < filas && sirve(q) && cuenta(q) === c) q++;
      if (q - f >= 2) salida.push({ dia, desde: f, hasta: q, puedenN: c });
      f = q;
    }
  }
  return salida.sort((x, y) => y.puedenN - x.puedenN || y.hasta - y.desde - (x.hasta - x.desde) || x.dia.localeCompare(y.dia)).slice(0, 3);
}

const plural = (n: number, uno: string, varios: string): string => (n === 1 ? uno : varios);

/** El texto para pegar en el chat del grupo: cuántos respondieron, los mejores horarios y qué falta. */
export function textoResumen(r: Reunion, personas: PersonaSet[], enlace: string): string {
  const total = personas.length;
  const claves = personas.filter((p) => p.clave);
  let texto = `${r.titulo}\nRespondieron ${total} ${plural(total, "persona", "personas")}: ${personas.map((p) => p.nombre).join(", ")}.\n`;
  if (r.claves) {
    texto += `Integrantes clave: ${claves.length} de ${r.claves} ${plural(claves.length, "ha respondido", "han respondido")}${claves.length ? ` (${claves.map((p) => p.nombre).join(", ")})` : ""}.\n`;
  }
  const exigir = claves.length > 0;
  let tramos = mejoresTramos(r, personas, exigir);
  let titulo = exigir ? "Mejores horarios con todos los integrantes clave" : "Mejores horarios";
  if (exigir && !tramos.length) {
    texto += "\nNingún horario le sirve a todos los integrantes clave.\n";
    tramos = mejoresTramos(r, personas, false);
    titulo = "Horarios con más gente";
  }
  if (tramos.length) {
    texto += `\n${titulo} (hora de ${zonaCorta(r.zona)}):\n`;
    texto += tramos
      .map((t) => {
        const faltan = personas
          .filter((p) => {
            for (let f = t.desde; f < t.hasta; f++) if (!p.puede(t.dia, f)) return true;
            return false;
          })
          .map((p) => p.nombre);
        return `- ${etiquetaDia(t.dia)}, ${horaDeFila(r, t.desde)} a ${horaDeFila(r, t.hasta)}: ${t.puedenN} de ${total}${faltan.length ? ` (no puede: ${faltan.join(", ")})` : ""}`;
      })
      .join("\n");
    texto += "\n";
  } else {
    texto += "\nAún no hay horarios en común.\n";
  }
  if (r.claves && claves.length < r.claves) {
    const falta = r.claves - claves.length;
    texto += `\nFalta que responda${falta === 1 ? " 1 integrante clave" : `n ${falta} integrantes clave`}.\n`;
  }
  texto += `\nSi aún no respondes, entra acá: ${enlace}`;
  return texto;
}
