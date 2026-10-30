import { cantidad } from "../utilidades/plural";
import { type Bloqueo, type Plantilla, type Reunion, aMinutos, esTodoElDia } from "../reunion";

/** Una plantilla de la cuenta: lo que se repite de una reunión a otra (los días no, porque cambian cada vez), con sus tags. */
export type PlantillaDeCuenta = Plantilla & { id: string; tags: string[] };

/** El texto con que se describe una plantilla: "Bloques de 30 min, de 09:00 a 18:00, 1 bloqueo y 2 integrantes clave". */
export function detalleDe(p: Pick<Plantilla, "bloqueMin" | "desde" | "hasta" | "claves" | "bloqueos">): string {
  const bloqueos = p.bloqueos.length ? cantidad(p.bloqueos.length, "bloqueo", "bloqueos") : "sin bloqueos";
  const claves = p.claves ? cantidad(p.claves, "integrante clave", "integrantes clave") : "sin integrantes clave";
  const horario = esTodoElDia(p) ? "todo el día" : `de ${p.desde} a ${p.hasta}`;
  return `Bloques de ${p.bloqueMin} min, ${horario}, ${bloqueos} y ${claves}`;
}

/** Una plantilla como una reunión sin días, para editarla con los mismos campos que al crear una reunión. */
export function comoReunion(p: Plantilla, nuevoId: () => string): Reunion {
  return {
    titulo: p.nombre,
    zona: "",
    dias: [],
    desde: p.desde,
    hasta: p.hasta,
    bloqueMin: p.bloqueMin,
    claves: p.claves,
    bloqueos: p.bloqueos.map((b) => ({ id: nuevoId(), dias: [], desde: b.desde, hasta: b.hasta })),
  };
}

/** Lo contrario: de la reunión que se editó, la plantilla que se guarda. */
export function comoPlantilla(r: Reunion): Plantilla {
  const nombre = r.titulo.trim();
  const base = { bloqueMin: r.bloqueMin, desde: r.desde, hasta: r.hasta, claves: r.claves, bloqueos: r.bloqueos.map((b) => ({ desde: b.desde, hasta: b.hasta })) };
  return { nombre, detalle: detalleDe(base), ...base };
}

type ProblemaDePlantilla = { campo: "nombre" | "horario" | "bloqueos"; mensaje: string };

/** Lo que falta o está mal en la plantilla que se está editando. */
export function problemasDePlantilla(r: Reunion, otrosNombres: string[]): ProblemaDePlantilla[] {
  const ps: ProblemaDePlantilla[] = [];
  const nombre = r.titulo.trim();
  if (!nombre) ps.push({ campo: "nombre", mensaje: "Escribe un nombre" });
  else if (otrosNombres.some((n) => n.trim().toLowerCase() === nombre.toLowerCase())) ps.push({ campo: "nombre", mensaje: "Ya tienes una plantilla con ese nombre" });
  if (aMinutos(r.hasta) <= aMinutos(r.desde)) ps.push({ campo: "horario", mensaje: "La hora de término debe ser posterior a la de inicio" });
  if (r.bloqueos.some((b: Bloqueo) => aMinutos(b.hasta) <= aMinutos(b.desde))) ps.push({ campo: "bloqueos", mensaje: "Cada horario bloqueado debe terminar después de empezar" });
  return ps;
}
