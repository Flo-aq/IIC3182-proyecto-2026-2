// Lógica pura de la pantalla de crear reunión: fechas, bloques y validación.
// No usa el DOM ni la hora actual, así se puede probar sin navegador.

export const OPCIONES_BLOQUE = [10, 15, 20, 30, 60] as const;

export const ZONAS = [
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "UTC",
];

export type Bloqueo = { id: string; dia: string; desde: string; hasta: string };

export type Reunion = {
  titulo: string;
  zona: string;
  /** Días elegidos, formato AAAA-MM-DD, en la zona horaria de la reunión. */
  dias: string[];
  desde: string;
  hasta: string;
  bloqueMin: number;
  claves: number;
  limite: string;
  bloqueos: Bloqueo[];
};

export type Plantilla = {
  nombre: string;
  /** Qué configura, para que se entienda antes de elegirla. */
  detalle: string;
  bloqueMin: number;
  desde: string;
  hasta: string;
  claves: number;
  bloqueos: { desde: string; hasta: string }[];
};

export const PLANTILLAS: Plantilla[] = [
  {
    nombre: "Reunión de equipo",
    detalle: "Bloques de 30 min, de 9:00 a 18:00, sin contar el almuerzo",
    bloqueMin: 30,
    desde: "09:00",
    hasta: "18:00",
    claves: 0,
    bloqueos: [{ desde: "13:00", hasta: "14:00" }],
  },
  {
    nombre: "Ayudantía con profe y ayudante",
    detalle: "Bloques de 20 min, de 10:00 a 17:00, con 2 integrantes clave",
    bloqueMin: 20,
    desde: "10:00",
    hasta: "17:00",
    claves: 2,
    bloqueos: [{ desde: "13:00", hasta: "14:00" }],
  },
  {
    nombre: "Reunión express de mañana",
    detalle: "Bloques de 15 min, de 9:00 a 13:00, sin bloqueos",
    bloqueMin: 15,
    desde: "09:00",
    hasta: "13:00",
    claves: 0,
    bloqueos: [],
  },
];

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const aMinutos = (hora: string): number => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const aIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const desdeIso = (iso: string): Date => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

export const etiquetaDia = (iso: string, conMes = true): string => {
  const d = desdeIso(iso);
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}${conMes ? " " + MESES_CORTOS[d.getMonth()] : ""}`;
};

/** Medianoche del día siguiente a `hoy`: el primer día que se puede elegir. */
export const mananaDe = (hoy: Date): Date => {
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  d.setDate(d.getDate() + 1);
  return d;
};

export function proximosHabiles(hoy: Date, cantidad: number): string[] {
  const salida: string[] = [];
  const d = mananaDe(hoy);
  while (salida.length < cantidad) {
    if (d.getDay() > 0 && d.getDay() < 6) salida.push(aIso(d));
    d.setDate(d.getDate() + 1);
  }
  return salida;
}

type ConfigBloques = Pick<Reunion, "desde" | "hasta" | "bloqueMin" | "bloqueos">;

/** Un valor por bloque del día: true si queda disponible, false si un bloqueo lo cubre. */
export function bloquesDelDia(r: ConfigBloques, dia: string): boolean[] {
  const salida: boolean[] = [];
  for (let m = aMinutos(r.desde); m + r.bloqueMin <= aMinutos(r.hasta); m += r.bloqueMin) {
    const fin = m + r.bloqueMin;
    const bloqueado = r.bloqueos.some(
      (b) => b.dia === dia && aMinutos(b.desde) < fin && aMinutos(b.hasta) > m,
    );
    salida.push(!bloqueado);
  }
  return salida;
}

/** Cantidad de bloques disponibles por día; es un rango si los bloqueos afectan distinto a cada día. */
export function rangoBloques(r: Reunion): { min: number; max: number; texto: string } {
  const dias = r.dias.length ? r.dias : [""];
  const cuentas = dias.map((d) => bloquesDelDia(r, d).filter(Boolean).length);
  const min = Math.min(...cuentas);
  const max = Math.max(...cuentas);
  return { min, max, texto: min === max ? String(min) : `${min}–${max}` };
}

export function resumenBloques(r: Reunion): string {
  const rango = rangoBloques(r);
  return rango.max
    ? `${rango.texto} bloques de ${r.bloqueMin} min por día`
    : "No cabe ningún bloque en ese horario";
}

export function resumenDias(dias: string[]): string {
  const a = [...dias].sort();
  if (!a.length) return "Ningún día elegido";
  if (a.length <= 3) return a.map((i) => etiquetaDia(i)).join(", ");
  const primero = desdeIso(a[0]);
  const ultimo = desdeIso(a[a.length - 1]);
  const conMes = primero.getMonth() !== ultimo.getMonth();
  return `${a.length} días · ${etiquetaDia(a[0], conMes)} a ${etiquetaDia(a[a.length - 1])}`;
}

export const zonaCorta = (zona: string): string => zona.split("/").pop()!.replace(/_/g, " ");

export function aplicarPlantilla(r: Reunion, p: Plantilla, nuevoId: () => string): Reunion {
  const dias = [...r.dias].sort();
  return {
    ...r,
    bloqueMin: p.bloqueMin,
    desde: p.desde,
    hasta: p.hasta,
    claves: p.claves,
    // Cada regla vale para un solo día, así que se repite en cada día elegido.
    bloqueos: p.bloqueos.flatMap((b) =>
      (dias.length ? dias : [""]).map((dia) => ({ id: nuevoId(), dia, desde: b.desde, hasta: b.hasta })),
    ),
  };
}

/** Copia la regla `i` al siguiente día elegido (o al mismo día si hay uno solo). */
export function duplicarBloqueo(r: Reunion, i: number, nuevoId: () => string): Bloqueo[] {
  const b = r.bloqueos[i];
  const dias = [...r.dias].sort();
  const k = dias.indexOf(b.dia);
  const dia = dias.length ? dias[(k + 1) % dias.length] : b.dia;
  const copia = { ...b, id: nuevoId(), dia };
  return [...r.bloqueos.slice(0, i + 1), copia, ...r.bloqueos.slice(i + 1)];
}

/** Repite la última regla en todos los días elegidos que aún no la tengan. */
export function repetirUltimoBloqueo(r: Reunion, nuevoId: () => string): Bloqueo[] {
  const ultimo = r.bloqueos[r.bloqueos.length - 1];
  if (!ultimo) return r.bloqueos;
  const nuevos = r.dias
    .filter((d) => !r.bloqueos.some((b) => b.dia === d && b.desde === ultimo.desde && b.hasta === ultimo.hasta))
    .map((dia) => ({ id: nuevoId(), dia, desde: ultimo.desde, hasta: ultimo.hasta }));
  return [...r.bloqueos, ...nuevos];
}

export function validar(r: Reunion): string | null {
  if (!r.titulo.trim()) return "Escribe el nombre de la reunión.";
  if (!r.dias.length) return "Elige al menos un día.";
  if (aMinutos(r.hasta) <= aMinutos(r.desde)) return "La hora de término debe ser después de la de inicio.";
  const malo = r.bloqueos.findIndex((b) => aMinutos(b.hasta) <= aMinutos(b.desde));
  if (malo >= 0) return `En el horario bloqueado ${malo + 1}, "hasta" debe ser después de "desde".`;
  if (!rangoBloques(r).max) return "Con ese horario y esos bloqueos no queda ningún bloque disponible.";
  return null;
}
