import "server-only";
import { TZDate } from "@date-fns/tz";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { instanteDe } from "@/lib/calendario";
import { MAX_BLOQUEOS, MAX_CLAVES, MAX_DIAS, MAX_NOMBRE, MAX_RESPUESTAS, MAX_TITULO } from "@/lib/limites";
import { MAX_TAGS_POR_REUNION } from "@/lib/perfil";
import { OPCIONES_BLOQUE, type Reunion, aMinutos, bloquesDelDia, problemas } from "@/lib/reunion";
import { type ReunionConRespuestas, totalFilas } from "@/lib/respuestas";
import { db } from "./db";
import { ErrorApi } from "./errores";
import { ponerTags } from "./tags";
import { nuevoSlug, nuevoTokenDueno } from "./slug";

// ---- validación de lo que llega del navegador ----

export const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const horaFin = z.union([hora, z.literal("24:00")]);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s));
const zona = z.string().refine((z) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: z });
    return true;
  } catch {
    return false;
  }
});

const esquemaReunion = z.object({
  titulo: z.string().trim().min(1).max(MAX_TITULO),
  zona,
  dias: z.array(fecha).min(1).max(MAX_DIAS),
  desde: hora,
  hasta: horaFin,
  bloqueMin: z.number().refine((n) => (OPCIONES_BLOQUE as readonly number[]).includes(n)),
  claves: z.number().int().min(0).max(MAX_CLAVES),
  bloqueos: z
    .array(z.object({ id: z.string().max(40), dias: z.array(fecha).max(MAX_DIAS), desde: hora, hasta: horaFin }))
    .max(MAX_BLOQUEOS),
  /** Nombre de quien organiza (sin cuenta): con él podrá cerrar la reunión desde cualquier dispositivo. */
  organizador: z.string().trim().max(MAX_NOMBRE).optional(),
});

/** Para comparar nombres como lo hace la pantalla al entrar a editar una respuesta: sin mayúsculas ni espacios de sobra. */
const mismoNombre = (a: string | null | undefined, b: string | null | undefined): boolean =>
  Boolean(a?.trim() && b?.trim() && a.trim().toLowerCase() === b.trim().toLowerCase());

/**
 * El nombre del organizador, aparte del resto de la reunión: así, si todavía no se corrió la migración que crea la columna
 * `owner_name`, solo falla esto (se trata como "sin nombre") y la reunión se sigue abriendo.
 */
async function nombreDelOrganizador(eventId: string): Promise<string | null> {
  const { data, error } = await db().from("events").select("owner_name").eq("id", eventId).maybeSingle();
  if (error) return null;
  return (data as { owner_name: string | null } | null)?.owner_name ?? null;
}

const esquemaRespuesta = z.object({
  nombre: z.string().trim().min(1).max(MAX_NOMBRE),
  clave: z.boolean(),
  /** Bloques en que puede, como "AAAA-MM-DD|fila" (la misma clave que usa la grilla). */
  bloques: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}\|\d{1,4}$/)).max(MAX_DIAS * 288),
});

// ---- hora de la reunión ↔ instante ----

/** El instante (ISO) en que empieza el bloque `fila` del día `dia`, contado en la zona de la reunión. */
const instante = (r: Pick<Reunion, "zona" | "desde" | "bloqueMin">, dia: string, fila: number): string => instanteDe(r, dia, fila).toISOString();

/** Lo inverso: el día y la fila a los que corresponde un instante guardado, o null si no cae en un bloque. */
function aBloque(r: Pick<Reunion, "zona" | "desde" | "bloqueMin">, iso: string): string | null {
  const t = new TZDate(iso, r.zona);
  const dia = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const desdeMedianoche = t.getHours() * 60 + t.getMinutes() - aMinutos(r.desde);
  if (desdeMedianoche < 0 || desdeMedianoche % r.bloqueMin !== 0) return null;
  return `${dia}|${desdeMedianoche / r.bloqueMin}`;
}

const hhmm = (t: string): string => t.slice(0, 5);

// ---- crear ----

/** Crea la reunión. Con `ownerId` (cuenta), queda en su perfil y se le ponen los `etiquetas` que vengan en la entrada. */
export async function crearReunion(entrada: unknown, ownerId: string | null = null): Promise<{ slug: string; tokenDueno: string }> {
  const parsed = esquemaReunion.safeParse(entrada);
  if (!parsed.success) throw new ErrorApi(400, "Los datos de la reunión no son válidos.");
  const r: Reunion = parsed.data;
  // Las mismas reglas que valida la pantalla antes de enviar.
  if (problemas(r).length) throw new ErrorApi(400, "Los datos de la reunión no son válidos.");

  const dias = [...new Set(r.dias)].sort();
  const tokenDueno = nuevoTokenDueno();
  for (let intento = 0; intento < 5; intento++) {
    const slug = nuevoSlug();
    const { data: id, error } = await db().rpc("create_event", {
      p_slug: slug,
      p_title: r.titulo.trim(),
      p_owner_id: ownerId,
      p_owner_token: tokenDueno,
      p_timezone: r.zona,
      p_days: dias,
      p_start: r.desde,
      p_end: r.hasta,
      p_slot: r.bloqueMin,
      p_max_key: r.claves,
      p_blocked: r.bloqueos.map((b) => ({ days: [...new Set(b.dias)].sort(), start: b.desde, end: b.hasta })),
    });
    if (!error) {
      const etiquetas = ownerId ? z.array(z.string()).max(MAX_TAGS_POR_REUNION).safeParse((entrada as { etiquetas?: unknown }).etiquetas) : null;
      // Los tags son un extra: si alguno falla (por ejemplo, el tope de la cuenta) la reunión ya está creada y se queda sin ellos.
      if (ownerId && etiquetas?.success && etiquetas.data.length) {
        await ponerTags(ownerId, id as string, etiquetas.data).catch((e) => console.error("tags de la reunión nueva", e));
      }
      // El nombre del organizador es un extra, como los tags: si no se pudo guardar (por ejemplo, falta correr la migración
      // que crea la columna), la reunión ya está creada y se cierra solo con la llave del navegador.
      const organizador = parsed.data.organizador;
      if (!ownerId && organizador) {
        const { error: eNombre } = await db().from("events").update({ owner_name: organizador }).eq("id", id as string);
        if (eNombre) console.error("nombre del organizador", eNombre.message);
      }
      return { slug, tokenDueno };
    }
    if (error.code !== "23505") throw error; // solo se reintenta si el slug ya existía
  }
  throw new Error("No se pudo generar un link único");
}

// ---- leer ----

type FilaReunion = {
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

const SLUG_VALIDO = /^[a-z0-9-]{1,40}$/;

/** La reunión con sus respuestas, y quién la creó (`duenoId`, solo para el servidor: no debe llegar al navegador). */
export type ReunionLeida = ReunionConRespuestas & { duenoId: string | null };

export async function leerReunion(slug: string): Promise<ReunionLeida | null> {
  if (!SLUG_VALIDO.test(slug)) return null;
  const { data, error } = await db()
    .from("events")
    .select(
      "id, slug, title, timezone, days, start_time, end_time, slot_minutes, max_key, status, chosen_start, owner_id, blocked_ranges(days, start_time, end_time), participants(name, is_key, created_at, availability(slot_start))",
    )
    .eq("slug", slug)
    .order("created_at", { referencedTable: "participants", ascending: true })
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const e = data as unknown as FilaReunion;

  const reunion: Reunion = {
    titulo: e.title,
    zona: e.timezone,
    dias: [...e.days].sort(),
    desde: hhmm(e.start_time),
    hasta: hhmm(e.end_time),
    bloqueMin: e.slot_minutes,
    claves: e.max_key,
    bloqueos: e.blocked_ranges.map((b, i) => ({ id: `b${i}`, dias: [...b.days].sort(), desde: hhmm(b.start_time), hasta: hhmm(b.end_time) })),
  };
  const personas = e.participants.map((p) => ({
    nombre: p.name,
    clave: p.is_key,
    disp: p.availability.map((a) => aBloque(reunion, a.slot_start)).filter((b): b is string => b !== null),
  }));
  const cerrada = e.status === "closed" && e.chosen_start ? aBloque(reunion, e.chosen_start) : null;
  return { slug: e.slug, reunion, personas, cerrada, duenoId: e.owner_id, organizador: await nombreDelOrganizador(e.id) };
}

/** Lo que se le manda al navegador: la reunión sin el dato de quién la creó. */
export const paraElNavegador = ({ duenoId, ...datos }: ReunionLeida): ReunionConRespuestas => {
  void duenoId;
  return datos;
};

// ---- cerrar y reabrir ----

type FilaCierre = Pick<FilaReunion, "id" | "status" | "owner_id" | "timezone" | "days" | "start_time" | "end_time" | "slot_minutes" | "blocked_ranges"> & {
  owner_token: string;
};

const COLUMNAS_CIERRE = "id, status, owner_id, owner_token, timezone, days, start_time, end_time, slot_minutes, blocked_ranges(days, start_time, end_time)";

/**
 * Carga la reunión y comprueba que quien pide es su creador: por su cuenta, por la llave que se guardó al crearla o por el
 * nombre de quien organizaba (como al editar una respuesta, basta con escribir el mismo nombre).
 */
async function reunionDelDueno(slug: string, tokenDueno: string | undefined, userId: string | null, nombre?: string): Promise<FilaCierre> {
  const { data, error } = SLUG_VALIDO.test(slug)
    ? await db().from("events").select(COLUMNAS_CIERRE).eq("slug", slug).maybeSingle()
    : { data: null, error: null };
  if (error) throw error;
  if (!data) throw new ErrorApi(404, "No encontramos esa reunión.");
  const e = data as unknown as FilaCierre;
  const porCuenta = userId !== null && e.owner_id === userId;
  const a = Buffer.from(tokenDueno ?? "");
  const b = Buffer.from(e.owner_token);
  const porLlave = a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
  const porNombre = !porCuenta && !porLlave && mismoNombre(nombre, await nombreDelOrganizador(e.id));
  if (!porCuenta && !porLlave && !porNombre) throw new ErrorApi(403, "Solo quien creó la reunión puede cerrarla o reabrirla.");
  return e;
}

const esquemaCierre = z.object({
  bloque: z.string().regex(/^\d{4}-\d{2}-\d{2}\|\d{1,4}$/).optional(),
  tokenDueno: z.string().max(100).optional(),
  /** El nombre con que quien organiza entró a la reunión. */
  nombre: z.string().trim().max(MAX_NOMBRE).optional(),
});

/** Cierra la reunión con el bloque elegido: desde entonces nadie puede cambiar respuestas. */
export async function cerrarReunion(slug: string, entrada: unknown, userId: string | null): Promise<void> {
  const parsed = esquemaCierre.safeParse(entrada);
  if (!parsed.success || !parsed.data.bloque) throw new ErrorApi(400, "Elige un horario para cerrar la reunión.");
  const e = await reunionDelDueno(slug, parsed.data.tokenDueno, userId, parsed.data.nombre);
  if (e.status === "closed") throw new ErrorApi(409, "Esta reunión ya está cerrada.");

  const r: Reunion = {
    titulo: "",
    zona: e.timezone,
    dias: e.days,
    desde: hhmm(e.start_time),
    hasta: hhmm(e.end_time),
    bloqueMin: e.slot_minutes,
    claves: 0,
    bloqueos: e.blocked_ranges.map((b, i) => ({ id: `b${i}`, dias: b.days, desde: hhmm(b.start_time), hasta: hhmm(b.end_time) })),
  };
  const [dia, filaTxt] = parsed.data.bloque.split("|");
  const fila = Number(filaTxt);
  if (!r.dias.includes(dia) || fila >= totalFilas(r) || !bloquesDelDia(r, dia)[fila]) {
    throw new ErrorApi(400, "Ese horario no existe en esta reunión o está bloqueado.");
  }

  const { error } = await db()
    .from("events")
    .update({ status: "closed", chosen_start: instante(r, dia, fila), closed_at: new Date().toISOString() })
    .eq("id", e.id);
  if (error) throw error;
  // Una reunión cerrada ya no espera respuestas: los avisos que seguían pendientes se cancelan.
  await db().from("notifications").update({ status: "cancelled" }).eq("event_id", e.id).eq("status", "pending");
}

/** Vuelve a abrir una reunión cerrada: se borra el horario elegido y se puede volver a responder. */
export async function reabrirReunion(slug: string, entrada: unknown, userId: string | null): Promise<void> {
  const parsed = esquemaCierre.safeParse(entrada);
  if (!parsed.success) throw new ErrorApi(400, "La petición no se entendió.");
  const e = await reunionDelDueno(slug, parsed.data.tokenDueno, userId, parsed.data.nombre);
  if (e.status === "open") return;
  const { error } = await db().from("events").update({ status: "open", chosen_start: null, closed_at: null }).eq("id", e.id);
  if (error) throw error;
}

// ---- guardar respuesta ----

/** `eventId` es solo para el servidor (por ejemplo, para revisar los avisos): no se le manda al navegador. */
export type ResultadoRespuesta = { claveDenegada: boolean; clave: boolean; eventId: string };

export async function guardarRespuesta(slug: string, entrada: unknown, userId: string | null = null): Promise<ResultadoRespuesta> {
  const parsed = esquemaRespuesta.safeParse(entrada);
  if (!parsed.success) throw new ErrorApi(400, "Tu respuesta no es válida.");
  const { nombre, clave, bloques } = parsed.data;

  const datos = SLUG_VALIDO.test(slug)
    ? await db().from("events").select("id, status, timezone, days, start_time, end_time, slot_minutes, blocked_ranges(days, start_time, end_time)").eq("slug", slug).maybeSingle()
    : { data: null, error: null };
  if (datos.error) throw datos.error;
  if (!datos.data) throw new ErrorApi(404, "No encontramos esa reunión.");
  const e = datos.data as unknown as Pick<FilaReunion, "id" | "timezone" | "days" | "start_time" | "end_time" | "slot_minutes" | "blocked_ranges"> & { status: string };
  if (e.status !== "open") throw new ErrorApi(409, "Esta reunión ya se cerró.");

  const r: Reunion = {
    titulo: "",
    zona: e.timezone,
    dias: e.days,
    desde: hhmm(e.start_time),
    hasta: hhmm(e.end_time),
    bloqueMin: e.slot_minutes,
    claves: 0,
    bloqueos: e.blocked_ranges.map((b, i) => ({ id: `b${i}`, dias: b.days, desde: hhmm(b.start_time), hasta: hhmm(b.end_time) })),
  };
  const filas = totalFilas(r);
  const dias = new Set(r.dias);
  const instantes: string[] = [];
  for (const b of new Set(bloques)) {
    const [dia, fila] = b.split("|");
    if (!dias.has(dia) || Number(fila) >= filas) throw new ErrorApi(400, "Tu respuesta tiene bloques que no existen en esta reunión.");
    instantes.push(instante(r, dia, Number(fila)));
  }

  const { data, error } = await db().rpc("save_response", {
    p_event: e.id,
    p_name: nombre,
    p_is_key: clave,
    p_user: userId,
    p_slots: instantes,
  });
  if (error) {
    if (error.message.includes(`máximo de ${MAX_RESPUESTAS} respuestas`)) throw new ErrorApi(409, `Esta reunión ya tiene el máximo de ${MAX_RESPUESTAS} respuestas.`);
    throw error;
  }
  const res = data as { is_key: boolean; key_denied: boolean };
  return { clave: res.is_key, claveDenegada: res.key_denied, eventId: e.id };
}
