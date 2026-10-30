import { TZDate } from "@date-fns/tz";
import { instanteDe } from "@/lib/reunion/calendario";
import { type Reunion, aMinutos } from "@/lib/reunion";
import { db } from "../comun/db";

/** Una reunión como la guarda la base de datos, con lo que se pide según el caso. */
export type FilaReunion = {
  id: string;
  slug: string;
  title: string;
  timezone: string;
  days: string[];
  start_time: string;
  end_time: string;
  slot_minutes: number;
  max_key: number;
  status: "open" | "closed";
  chosen_start: string | null;
  owner_id: string | null;
  blocked_ranges: { days: string[]; start_time: string; end_time: string }[];
  participants: { name: string; is_key: boolean; availability: { slot_start: string }[] }[];
};

export const SLUG_VALIDO = /^[a-z0-9-]{1,40}$/;

export const hhmm = (t: string): string => t.slice(0, 5);

type Horario = Pick<FilaReunion, "timezone" | "days" | "start_time" | "end_time" | "slot_minutes" | "blocked_ranges">;

/** La reunión sin título ni integrantes clave: lo que hace falta para calcular horarios y bloques. */
export const reunionDeLaFila = (e: Horario): Reunion => ({
  titulo: "",
  zona: e.timezone,
  dias: e.days,
  desde: hhmm(e.start_time),
  hasta: hhmm(e.end_time),
  bloqueMin: e.slot_minutes,
  claves: 0,
  bloqueos: e.blocked_ranges.map((b, i) => ({ id: `b${i}`, dias: b.days, desde: hhmm(b.start_time), hasta: hhmm(b.end_time) })),
});

// ---- hora de la reunión ↔ instante ----

/** El instante (ISO) en que empieza el bloque `fila` del día `dia`, contado en la zona de la reunión. */
export const instante = (r: Pick<Reunion, "zona" | "desde" | "bloqueMin">, dia: string, fila: number): string => instanteDe(r, dia, fila).toISOString();

/** Lo inverso: el día y la fila a los que corresponde un instante guardado, o null si no cae en un bloque. */
export function aBloque(r: Pick<Reunion, "zona" | "desde" | "bloqueMin">, iso: string): string | null {
  const t = new TZDate(iso, r.zona);
  const dia = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const desdeMedianoche = t.getHours() * 60 + t.getMinutes() - aMinutos(r.desde);
  if (desdeMedianoche < 0 || desdeMedianoche % r.bloqueMin !== 0) return null;
  return `${dia}|${desdeMedianoche / r.bloqueMin}`;
}

// ---- quien organiza ----

/** Para comparar nombres como lo hace la pantalla al entrar a editar una respuesta: sin mayúsculas ni espacios de sobra. */
export const mismoNombre = (a: string | null | undefined, b: string | null | undefined): boolean =>
  Boolean(a?.trim() && b?.trim() && a.trim().toLowerCase() === b.trim().toLowerCase());

/**
 * El nombre del organizador, aparte del resto de la reunión: así, si todavía no se corrió la migración que crea la columna
 * `owner_name`, solo falla esto (se trata como "sin nombre") y la reunión se sigue abriendo.
 */
export async function nombreDelOrganizador(eventId: string): Promise<string | null> {
  const { data, error } = await db().from("events").select("owner_name").eq("id", eventId).maybeSingle();
  if (error) return null;
  return (data as { owner_name: string | null } | null)?.owner_name ?? null;
}
