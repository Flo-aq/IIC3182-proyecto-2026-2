import { cantidad, plural } from "@/lib/utilidades/plural";
import "server-only";
import { TZDate } from "@date-fns/tz";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Aviso } from "@/components/compartidos/notificar-dialog";
import { type Persona, conjuntos, textoResumen } from "@/lib/reunion/respuestas";
import { enviarCorreo } from "./correo";
import { db } from "../comun/db";
import { ErrorApi } from "../comun/errores";
import { hora, leerReunion } from "../reuniones";

// ---- validación ----

const correo = z.string().trim().toLowerCase().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const esquemaAviso = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("personas"), personas: z.number().int().min(1).max(10_000), correo }),
  z.object({ tipo: z.literal("fecha"), fecha, correo }),
  z.object({ tipo: z.literal("fecha-hora"), fecha, hora, correo }),
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Máximo de avisos pendientes por correo y de avisos pedidos por reunión en una hora: frenan que se use WeMeet para mandar correos a otros. */
const MAX_PENDIENTES_POR_CORREO = 5;
const MAX_POR_REUNION_POR_HORA = 30;

// ---- horas en la zona de la reunión ----

/** El instante de `dia` a las `hhmm`, contado en la zona de la reunión. */
function instanteEn(zona: string, dia: string, hhmm: string): Date {
  const [a, m, d] = dia.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(new TZDate(a, m - 1, d, h, min, 0, zona).getTime());
}

const dos = (n: number): string => String(n).padStart(2, "0");

function diaYHoraEn(zona: string, instante: string): { fecha: string; hora: string } {
  const t = new TZDate(instante, zona);
  return { fecha: `${t.getFullYear()}-${dos(t.getMonth() + 1)}-${dos(t.getDate())}`, hora: `${dos(t.getHours())}:${dos(t.getMinutes())}` };
}

/** A qué hora llega un aviso "en una fecha" (sin hora): las 9 de la mañana de ese día. */
const HORA_DEL_AVISO_POR_FECHA = "09:00";

// ---- filas de la base ----

export type FilaAviso = {
  id: string;
  event_id: string;
  email: string;
  kind: "count" | "date" | "datetime";
  target_count: number | null;
  notify_at: string | null;
  cancel_token: string;
};

const COLUMNAS = "id, event_id, email, kind, target_count, notify_at, cancel_token";

/** Un aviso de la base como lo muestra la interfaz. */
export function comoAviso(f: Pick<FilaAviso, "email" | "kind" | "target_count" | "notify_at">, zona: string): Aviso {
  if (f.kind === "count") return { tipo: "personas", personas: f.target_count ?? 1, correo: f.email };
  const { fecha: dia, hora: h } = diaYHoraEn(zona, f.notify_at ?? new Date().toISOString());
  return f.kind === "date" ? { tipo: "fecha", fecha: dia, correo: f.email } : { tipo: "fecha-hora", fecha: dia, hora: h, correo: f.email };
}

// ---- pedir y quitar ----

/** Crea un aviso por correo. Con `userId`, queda ligado a la cuenta (aparece en su perfil). */
export async function crearAviso(slug: string, entrada: unknown, userId: string | null): Promise<{ id: string; tokenCancelar: string }> {
  const parsed = esquemaAviso.safeParse(entrada);
  if (!parsed.success) throw new ErrorApi(400, "Revisa los datos del aviso: el correo, la fecha o la cantidad no son válidos.");
  const a = parsed.data;

  const { data, error } = await db().from("events").select("id, status, timezone, participants(count)").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorApi(404, "No encontramos esa reunión.");
  const e = data as unknown as { id: string; status: string; timezone: string; participants: { count: number }[] };
  if (e.status !== "open") throw new ErrorApi(409, "Esta reunión ya se cerró: no necesita avisos.");
  const respondieron = e.participants[0]?.count ?? 0;

  let kind: FilaAviso["kind"];
  let target: number | null = null;
  let cuando: Date | null = null;
  if (a.tipo === "personas") {
    kind = "count";
    target = a.personas;
    if (target <= respondieron) throw new ErrorApi(400, `Ya respondieron ${respondieron} ${plural(respondieron, "persona", "personas")}: elige una cantidad mayor.`);
  } else {
    kind = a.tipo === "fecha" ? "date" : "datetime";
    cuando = instanteEn(e.timezone, a.fecha, a.tipo === "fecha" ? HORA_DEL_AVISO_POR_FECHA : a.hora);
    if (cuando.getTime() <= Date.now()) throw new ErrorApi(400, "Esa fecha y hora ya pasaron: elige una futura.");
  }

  const pendientes = await db().from("notifications").select("id", { count: "exact", head: true }).eq("email", a.correo).eq("status", "pending");
  if ((pendientes.count ?? 0) >= MAX_PENDIENTES_POR_CORREO) throw new ErrorApi(429, "Ese correo ya tiene muchos avisos pendientes. Espera a que lleguen o quítalos.");
  const haceUnaHora = new Date(Date.now() - 3_600_000).toISOString();
  const recientes = await db().from("notifications").select("id", { count: "exact", head: true }).eq("event_id", e.id).gte("created_at", haceUnaHora);
  if ((recientes.count ?? 0) >= MAX_POR_REUNION_POR_HORA) throw new ErrorApi(429, "Se pidieron demasiados avisos para esta reunión. Intenta de nuevo en un rato.");

  const { data: creado, error: e2 } = await db()
    .from("notifications")
    .insert({ event_id: e.id, user_id: userId, email: a.correo, kind, target_count: target, notify_at: cuando?.toISOString() ?? null })
    .select("id, cancel_token")
    .single();
  if (e2) {
    if (e2.code === "23505") throw new ErrorApi(409, "Ya hay un aviso pendiente para ese correo en esta reunión. Quítalo para pedir otro.");
    throw e2;
  }
  const c = creado as { id: string; cancel_token: string };
  return { id: c.id, tokenCancelar: c.cancel_token };
}

/** Quita un aviso pendiente: lo puede hacer su dueño (con sesión) o quien lo pidió sin cuenta, con su llave. */
export async function quitarAviso(id: string, userId: string | null, token: string | null): Promise<void> {
  const { data, error } = UUID.test(id)
    ? await db().from("notifications").select("id, user_id, cancel_token, status").eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (error) throw error;
  const n = data as { id: string; user_id: string | null; cancel_token: string; status: string } | null;
  if (!n || n.status !== "pending") throw new ErrorApi(404, "No encontramos ese aviso (quizás ya se envió).");
  const a = Buffer.from(token ?? "");
  const b = Buffer.from(n.cancel_token);
  const conLlave = a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
  if (!(userId !== null && n.user_id === userId) && !conLlave) throw new ErrorApi(403, "No puedes quitar ese aviso.");
  const { error: e2 } = await db().from("notifications").update({ status: "cancelled" }).eq("id", id).eq("status", "pending");
  if (e2) throw e2;
}

/** El aviso pendiente de la cuenta en esa reunión, si tiene. */
export async function avisoDeLaCuenta(userId: string, slug: string): Promise<{ id: string; aviso: Aviso } | null> {
  const { data, error } = await db()
    .from("notifications")
    .select("id, email, kind, target_count, notify_at, events!inner(slug, timezone)")
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("events.slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const f = data as unknown as FilaAviso & { events: { timezone: string } };
  return { id: f.id, aviso: comoAviso(f, f.events.timezone) };
}

/** El aviso pendiente que alguien pidió sin cuenta, si la llave que trae es la suya. */
export async function avisoPorLlave(slug: string, id: string, token: string): Promise<{ id: string; aviso: Aviso } | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db()
    .from("notifications")
    .select("id, email, kind, target_count, notify_at, cancel_token, events!inner(slug, timezone)")
    .eq("id", id)
    .eq("status", "pending")
    .eq("events.slug", slug)
    .maybeSingle();
  if (error) throw error;
  const f = data as unknown as (FilaAviso & { events: { timezone: string } }) | null;
  if (!f) return null;
  const a = Buffer.from(token);
  const b = Buffer.from(f.cancel_token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { id: f.id, aviso: comoAviso(f, f.events.timezone) };
}

// ---- el correo ----

const escapar = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cuantasPersonas = (n: number): string => cantidad(n, "persona", "personas");

function armarCorreo(n: FilaAviso, titulo: string, personas: Persona[], resumen: string, enlace: string) {
  const asunto = n.kind === "count" ? `Ya respondieron ${cuantasPersonas(personas.length)}: ${titulo}` : `Recordatorio: ${titulo}`;
  const intro =
    n.kind === "count"
      ? `Ya respondieron ${cuantasPersonas(personas.length)} en «${titulo}». Pediste que te avisáramos con ${cuantasPersonas(n.target_count ?? 0)}.`
      : `Este es el estado de «${titulo}», como pediste que te recordáramos.`;
  const pie = "Recibiste este correo porque pediste un aviso en WeMeet. No te escribiremos más por esta reunión.";
  const texto = `${intro}\n\n${resumen}\n\nVer la reunión: ${enlace}\n\n${pie}`;
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ec;padding:24px 12px;font-family:Inter,Arial,sans-serif;color:#141413">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:24px">
<p style="margin:0 0 4px;font-size:18px;font-weight:800;color:#4823ff">WeMeet</p>
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.3">${escapar(titulo)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.5">${escapar(intro)}</p>
<pre style="margin:0 0 20px;white-space:pre-wrap;font:14px/1.5 Inter,Arial,sans-serif;background:#f4f1ec;border-radius:14px;padding:14px">${escapar(resumen)}</pre>
<p style="margin:0 0 20px"><a href="${escapar(enlace)}" style="display:inline-block;background:#4823ff;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:12px 22px">Ver la reunión</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#6b6660">${escapar(pie)}</p>
</div></body></html>`;
  return { asunto, texto, html };
}

type Resultado = "enviado" | "cancelado" | "fallo" | "ya";

/** Un aviso con más de un día de atraso ya no se reintenta: si no se pudo enviar a tiempo, se descarta. */
const MAX_ATRASO_MS = 24 * 3_600_000;

async function enviarAviso(n: FilaAviso, origen: string): Promise<Resultado> {
  // Primero se reclama (pending → sent) para que dos procesos a la vez no manden el mismo correo dos veces.
  const { data: reclamado, error } = await db().from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", n.id).eq("status", "pending").select("id");
  if (error) throw error;
  if (!reclamado?.length) return "ya";

  try {
    const { data: ev, error: e1 } = await db().from("events").select("slug").eq("id", n.event_id).single();
    if (e1) throw e1;
    const datos = await leerReunion((ev as { slug: string }).slug);
    if (!datos || datos.cerrada !== null) {
      await db().from("notifications").update({ status: "cancelled", sent_at: null }).eq("id", n.id);
      return "cancelado";
    }
    const enlace = `${origen}/e/${datos.slug}`;
    const resumen = textoResumen(datos.reunion, conjuntos(datos.personas), enlace);
    const c = armarCorreo(n, datos.reunion.titulo, datos.personas, resumen, enlace);
    await enviarCorreo({ a: n.email, asunto: c.asunto, texto: c.texto, html: c.html });
    return "enviado";
  } catch (e) {
    console.error(`No se pudo enviar el aviso ${n.id}`, e);
    const atrasado = n.notify_at !== null && Date.now() - new Date(n.notify_at).getTime() > MAX_ATRASO_MS;
    await db().from("notifications").update({ status: atrasado ? "cancelled" : "pending", sent_at: null }).eq("id", n.id);
    return "fallo";
  }
}

async function respuestasPorReunion(ids: string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map();
  const { data, error } = await db().from("events").select("id, participants(count)").in("id", ids);
  if (error) throw error;
  return new Map((data as unknown as { id: string; participants: { count: number }[] }[]).map((e) => [e.id, e.participants[0]?.count ?? 0]));
}

async function enviarLosQueCumplen(pendientes: FilaAviso[], origen: string): Promise<Record<Resultado, number>> {
  const cuenta: Record<Resultado, number> = { enviado: 0, cancelado: 0, fallo: 0, ya: 0 };
  const respuestas = await respuestasPorReunion([...new Set(pendientes.filter((n) => n.kind === "count").map((n) => n.event_id))]);
  for (const n of pendientes) {
    if (n.kind === "count" && (respuestas.get(n.event_id) ?? 0) < (n.target_count ?? Infinity)) continue;
    cuenta[await enviarAviso(n, origen)]++;
  }
  return cuenta;
}

/** Después de guardar una respuesta: envía los avisos "cuando respondan N personas" que ya se cumplieron en esa reunión. */
export async function revisarAvisosPorCantidad(eventId: string, origen: string): Promise<void> {
  const { data, error } = await db().from("notifications").select(COLUMNAS).eq("event_id", eventId).eq("status", "pending").eq("kind", "count");
  if (error) throw error;
  if (data?.length) await enviarLosQueCumplen(data as FilaAviso[], origen);
}

/**
 * Lo que corre cada pocos minutos (GET /api/cron/avisos): envía los avisos de fecha o de fecha y hora que ya llegaron, y revisa
 * de nuevo los de cantidad por si alguno se quedó sin enviar.
 */
export async function procesarAvisos(origen: string): Promise<{ debidos: Record<Resultado, number>; porCantidad: Record<Resultado, number> }> {
  const { data: debidos, error } = await db()
    .from("notifications")
    .select(COLUMNAS)
    .eq("status", "pending")
    .in("kind", ["date", "datetime"])
    .lte("notify_at", new Date().toISOString())
    .order("notify_at")
    .limit(50);
  if (error) throw error;
  const a = await enviarLosQueCumplen((debidos ?? []) as FilaAviso[], origen);

  const { data: porCantidad, error: e2 } = await db().from("notifications").select(COLUMNAS).eq("status", "pending").eq("kind", "count").limit(200);
  if (e2) throw e2;
  const b = await enviarLosQueCumplen((porCantidad ?? []) as FilaAviso[], origen);
  return { debidos: a, porCantidad: b };
}
