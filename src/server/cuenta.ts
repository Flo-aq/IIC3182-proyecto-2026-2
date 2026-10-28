import "server-only";
import { z } from "zod";
import { MAX_BLOQUEOS, MAX_CLAVES } from "@/lib/limites";
import { MAX_TAGS_POR_REUNION, type ReunionDePerfil } from "@/lib/perfil";
import { type PlantillaDeCuenta, detalleDe } from "@/lib/plantillas";
import { OPCIONES_BLOQUE, aMinutos } from "@/lib/reunion";
import { usuarioActual } from "@/lib/supabase/servidor";
import { db } from "./db";
import { ErrorApi } from "./errores";
import { hora, horaFin } from "./reuniones";
import { fijarTagsDePlantilla, ponerTags, quitarTag } from "./tags";

/** Quien hace la petición; si no tiene sesión, es un 401. */
export async function exigirUsuario(): Promise<{ id: string }> {
  const u = await usuarioActual();
  if (!u) throw new ErrorApi(401, "Inicia sesión para continuar.");
  return u;
}

// ---- reuniones del perfil ----

/** Una reunión del perfil tal como la devuelve el servidor: igual que `ReunionDePerfil`, pero con la fecha como instante (ISO). */
export type ReunionDePerfilApi = Omit<ReunionDePerfil, "fecha"> & { fecha: string };

type FilaPerfil = { event_id: string; slug: string; title: string; role: "creada" | "respondida"; role_date: string; response_count: number };

export async function listarReuniones(userId: string): Promise<ReunionDePerfilApi[]> {
  const { data, error } = await db().from("profile_events").select("event_id, slug, title, role, role_date, response_count").eq("user_id", userId);
  if (error) throw error;

  // Si respondió la misma reunión con más de un nombre, sale una sola vez (la creada gana; luego, la más antigua).
  const porSlug = new Map<string, FilaPerfil>();
  for (const f of (data as FilaPerfil[]).sort((a, b) => a.role_date.localeCompare(b.role_date))) {
    const previa = porSlug.get(f.slug);
    if (!previa || (f.role === "creada" && previa.role !== "creada")) porSlug.set(f.slug, f);
  }
  const filas = [...porSlug.values()];
  if (!filas.length) return [];

  const { data: etiquetas, error: e2 } = await db()
    .from("event_tags")
    .select("event_id, tags!inner(name, user_id)")
    .in("event_id", filas.map((f) => f.event_id))
    .eq("tags.user_id", userId);
  if (e2) throw e2;
  const tagsPorEvento = new Map<string, string[]>();
  for (const t of etiquetas as unknown as { event_id: string; tags: { name: string } }[]) {
    tagsPorEvento.set(t.event_id, [...(tagsPorEvento.get(t.event_id) ?? []), t.tags.name]);
  }

  return filas.map((f) => ({
    slug: f.slug,
    titulo: f.title,
    tags: (tagsPorEvento.get(f.event_id) ?? []).sort((a, b) => a.localeCompare(b, "es")),
    respuestas: Number(f.response_count),
    rol: f.role,
    fecha: f.role_date,
    aviso: null,
  }));
}

/** La reunión por su link, si la cuenta la creó o la respondió; si no, 404 (no se revela si existe). */
async function reunionDeLaCuenta(userId: string, slug: string): Promise<string> {
  const { data, error } = await db().from("events").select("id, owner_id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  const e = data as { id: string; owner_id: string | null } | null;
  if (!e) throw new ErrorApi(404, "No encontramos esa reunión.");
  if (e.owner_id !== userId) {
    const { data: p, error: e2 } = await db().from("participants").select("id").eq("event_id", e.id).eq("user_id", userId).limit(1);
    if (e2) throw e2;
    if (!p?.length) throw new ErrorApi(404, "No encontramos esa reunión.");
  }
  return e.id;
}

export async function agregarTagAReunion(userId: string, slug: string, nombre: unknown): Promise<void> {
  const n = z.string().trim().min(1).max(60).safeParse(nombre);
  if (!n.success) throw new ErrorApi(400, "El tag no es válido.");
  await ponerTags(userId, await reunionDeLaCuenta(userId, slug), [n.data]);
}

export async function quitarTagDeReunion(userId: string, slug: string, nombre: string): Promise<void> {
  await quitarTag(userId, await reunionDeLaCuenta(userId, slug), nombre);
}

export async function listarTags(userId: string): Promise<{ name: string; count: number }[]> {
  const { data, error } = await db().from("tags").select("name, event_tags(count), template_tags(count)").eq("user_id", userId);
  if (error) throw error;
  return (data as unknown as { name: string; event_tags: { count: number }[]; template_tags: { count: number }[] }[])
    .map((t) => ({ name: t.name, count: (t.event_tags[0]?.count ?? 0) + (t.template_tags[0]?.count ?? 0) }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

// ---- plantillas ----

const esquemaPlantilla = z
  .object({
    nombre: z.string().trim().min(1).max(50),
    bloqueMin: z.number().refine((n) => (OPCIONES_BLOQUE as readonly number[]).includes(n)),
    desde: hora,
    hasta: horaFin,
    claves: z.number().int().min(0).max(MAX_CLAVES),
    bloqueos: z.array(z.object({ desde: hora, hasta: horaFin })).max(MAX_BLOQUEOS),
    tags: z.array(z.string().max(60)).max(MAX_TAGS_POR_REUNION).default([]),
  })
  .refine((p) => aMinutos(p.hasta) > aMinutos(p.desde) && p.bloqueos.every((b) => aMinutos(b.hasta) > aMinutos(b.desde)));

type FilaPlantilla = {
  id: string;
  name: string;
  slot_minutes: number;
  start_time: string;
  end_time: string;
  max_key: number;
  blocked: { start: string; end: string }[];
  template_tags: { tags: { name: string } }[];
};

const COLUMNAS_PLANTILLA = "id, name, slot_minutes, start_time, end_time, max_key, blocked, template_tags(tags(name))";

function comoPlantillaDeCuenta(f: FilaPlantilla): PlantillaDeCuenta {
  const base = {
    bloqueMin: f.slot_minutes,
    desde: f.start_time.slice(0, 5),
    hasta: f.end_time.slice(0, 5),
    claves: f.max_key,
    bloqueos: f.blocked.map((b) => ({ desde: b.start.slice(0, 5), hasta: b.end.slice(0, 5) })),
  };
  return {
    id: f.id,
    nombre: f.name,
    detalle: detalleDe(base),
    ...base,
    tags: f.template_tags.map((t) => t.tags.name).sort((a, b) => a.localeCompare(b, "es")),
  };
}

export async function listarPlantillas(userId: string): Promise<PlantillaDeCuenta[]> {
  const { data, error } = await db().from("templates").select(COLUMNAS_PLANTILLA).eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as FilaPlantilla[]).map(comoPlantillaDeCuenta);
}

async function leerPlantilla(userId: string, id: string): Promise<PlantillaDeCuenta> {
  const { data, error } = await db().from("templates").select(COLUMNAS_PLANTILLA).eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErrorApi(404, "No encontramos esa plantilla.");
  return comoPlantillaDeCuenta(data as unknown as FilaPlantilla);
}

function filaDeBase(p: z.infer<typeof esquemaPlantilla>) {
  return {
    name: p.nombre,
    slot_minutes: p.bloqueMin,
    start_time: p.desde,
    end_time: p.hasta,
    max_key: p.claves,
    blocked: p.bloqueos.map((b) => ({ start: b.desde, end: b.hasta })),
  };
}

const NOMBRE_REPETIDO = "Ya tienes una plantilla con ese nombre.";

export async function crearPlantilla(userId: string, entrada: unknown): Promise<PlantillaDeCuenta> {
  const p = esquemaPlantilla.safeParse(entrada);
  if (!p.success) throw new ErrorApi(400, "Los datos de la plantilla no son válidos.");
  const { data, error } = await db().from("templates").insert({ user_id: userId, ...filaDeBase(p.data) }).select("id").single();
  if (error) {
    if (error.code === "23505") throw new ErrorApi(409, NOMBRE_REPETIDO);
    throw error;
  }
  const id = (data as { id: string }).id;
  try {
    await fijarTagsDePlantilla(userId, id, p.data.tags);
  } catch (e) {
    await db().from("templates").delete().eq("id", id); // sin sus tags no se deja a medias
    throw e;
  }
  return leerPlantilla(userId, id);
}

export async function actualizarPlantilla(userId: string, id: string, entrada: unknown): Promise<PlantillaDeCuenta> {
  const p = esquemaPlantilla.safeParse(entrada);
  if (!p.success) throw new ErrorApi(400, "Los datos de la plantilla no son válidos.");
  const { data, error } = await db()
    .from("templates")
    .update({ ...filaDeBase(p.data), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error) {
    if (error.code === "23505") throw new ErrorApi(409, NOMBRE_REPETIDO);
    throw error;
  }
  if (!data?.length) throw new ErrorApi(404, "No encontramos esa plantilla.");
  await fijarTagsDePlantilla(userId, id, p.data.tags);
  return leerPlantilla(userId, id);
}

export async function borrarPlantilla(userId: string, id: string): Promise<void> {
  const { error } = await db().from("templates").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
