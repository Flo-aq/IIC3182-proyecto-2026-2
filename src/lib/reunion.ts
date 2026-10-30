// Lógica pura de la pantalla de crear reunión: fechas, bloques y validación.
// No usa el DOM ni la hora actual, así se puede probar sin navegador.

export const OPCIONES_BLOQUE = [10, 15, 20, 30, 60] as const;

/** Horas con las que parte una reunión y un bloqueo nuevo; "Restablecer" en el selector de hora vuelve a ellas. */
export const POR_DEFECTO = { desde: "09:00", hasta: "18:00", bloqueoDesde: "13:00", bloqueoHasta: "14:00" } as const;

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

/** Una regla de bloqueo: un rango de horas que vale para uno o más de los días elegidos. */
export type Bloqueo = { id: string; dias: string[]; desde: string; hasta: string };

export type Reunion = {
  titulo: string;
  zona: string;
  /** Días elegidos, formato AAAA-MM-DD, en la zona horaria de la reunión. */
  dias: string[];
  desde: string;
  hasta: string;
  bloqueMin: number;
  claves: number;
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
    nombre: "Reunión de equipo · 30 min",
    detalle: "Bloques de 30 min, de 9:00 a 18:00, sin contar el almuerzo",
    bloqueMin: 30,
    desde: "09:00",
    hasta: "18:00",
    claves: 0,
    bloqueos: [{ desde: "13:00", hasta: "14:00" }],
  },
  {
    nombre: "Ayudantía con profe y ayudante · 20 min",
    detalle: "Bloques de 20 min, de 10:00 a 17:00, con 2 integrantes clave",
    bloqueMin: 20,
    desde: "10:00",
    hasta: "17:00",
    claves: 2,
    bloqueos: [{ desde: "13:00", hasta: "14:00" }],
  },
  {
    nombre: "Reunión express de mañana · 15 min",
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

/** Fin del día: no cabe en un selector de hora (llega hasta 23:59), por eso "Todo el día" lo pone aparte. */
export const FIN_DEL_DIA = "24:00";

export const esTodoElDia = (r: Pick<Reunion, "desde" | "hasta">): boolean =>
  r.desde === "00:00" && r.hasta === FIN_DEL_DIA;

export const textoHorario = (r: Pick<Reunion, "desde" | "hasta">): string =>
  esTodoElDia(r) ? "Todo el día" : `${r.desde} a ${r.hasta}`;

/** Suma (o resta, con un valor negativo) minutos a una hora HH:MM, sin salirse de 00:00 a 23:59. */
export function sumarMinutos(hora: string, minutos: number): string {
  const total = Math.max(0, Math.min(23 * 60 + 59, aMinutos(hora) + minutos));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export const aIso =(d: Date): string =>
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
      (b) => b.dias.includes(dia) && aMinutos(b.desde) < fin && aMinutos(b.hasta) > m,
    );
    salida.push(!bloqueado);
  }
  return salida;
}

/** Cantidad de bloques disponibles por día; es un rango si los bloqueos afectan distinto a cada día. */
function rangoBloques(r: Reunion): { min: number; max: number; texto: string } {
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

/** "Ningún día", "1 día" o "5 días": lo que se muestra como contador en la pantalla. */
export const textoCantidadDias = (n: number): string =>
  n === 0 ? "Ningún día" : n === 1 ? "1 día" : `${n} días`;

export const zonaCorta =(zona: string): string => zona.split("/").pop()!.replace(/_/g, " ");

export function aplicarPlantilla(r: Reunion, p: Plantilla, nuevoId: () => string): Reunion {
  const dias = [...r.dias].sort();
  return {
    ...r,
    bloqueMin: p.bloqueMin,
    desde: p.desde,
    hasta: p.hasta,
    claves: p.claves,
    // Cada regla de la plantilla vale para todos los días elegidos.
    bloqueos: p.bloqueos.map((b) => ({ id: nuevoId(), dias, desde: b.desde, hasta: b.hasta })),
  };
}

/** Pone una copia de la regla `i` justo debajo, con los mismos días y horas, para ajustarla. */
export function duplicarBloqueo(r: Reunion, i: number, nuevoId: () => string): Bloqueo[] {
  const copia = { ...r.bloqueos[i], id: nuevoId(), dias: [...r.bloqueos[i].dias] };
  return [...r.bloqueos.slice(0, i + 1), copia, ...r.bloqueos.slice(i + 1)];
}

/** Quita de las reglas los días que ya no están elegidos en "Días". */
export function podarBloqueos(bloqueos: Bloqueo[], dias: string[]): Bloqueo[] {
  return bloqueos.map((b) => ({ ...b, dias: b.dias.filter((d) => dias.includes(d)) }));
}

/** "Todos los días" si la regla cubre todos los elegidos; si no, la lista corta de días. */
export function textoDiasRegla(b: Bloqueo, dias: string[]): string {
  if (!b.dias.length) return "Elige uno o más días";
  if (dias.length > 1 && b.dias.length === dias.length) return "Todos los días";
  return resumenDias(b.dias);
}

export type Problema = {
  campo: "nombre" | "organizador" | "dias" | "horario" | "bloque" | "bloqueos";
  /** Nombre del campo tal como se lee en la pantalla. */
  etiqueta: string;
  mensaje: string;
  /** Id de la regla de bloqueo afectada, si el problema es de una regla. */
  regla?: string;
};

/** Todo lo que impide crear la reunión, en el orden en que aparece en la pantalla. */
export function problemas(r: Reunion): Problema[] {
  const salida: Problema[] = [];
  if (!r.titulo.trim()) salida.push({ campo: "nombre", etiqueta: "Nombre de la reunión", mensaje: "escribe un nombre." });
  if (!r.dias.length) salida.push({ campo: "dias", etiqueta: "Días", mensaje: "elige al menos un día." });
  const horarioBien = aMinutos(r.hasta) > aMinutos(r.desde);
  if (!horarioBien) {
    salida.push({ campo: "horario", etiqueta: "Horario", mensaje: "la hora de término debe ser después de la de inicio." });
  }
  r.bloqueos.forEach((b, i) => {
    const etiqueta = `Bloquear horarios, regla ${i + 1}`;
    if (!b.dias.length) salida.push({ campo: "bloqueos", etiqueta, mensaje: "elige al menos un día.", regla: b.id });
    else if (aMinutos(b.hasta) <= aMinutos(b.desde)) {
      salida.push({ campo: "bloqueos", etiqueta, mensaje: '"hasta" debe ser después de "desde".', regla: b.id });
    }
  });
  if (r.dias.length && horarioBien && !rangoBloques(r).max) {
    salida.push({ campo: "bloque", etiqueta: "Cada bloque dura", mensaje: "con ese horario y esos bloqueos no queda ningún bloque disponible." });
  }
  return salida;
}
