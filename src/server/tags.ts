import "server-only";
import { normalizarTag } from "@/lib/perfil";
import { db } from "./db";
import { ErrorApi } from "./errores";

type FilaTag = { id: string; name: string };

/** Convierte los errores de las reglas de la base (topes de tags) en mensajes para la persona; el resto se vuelve a lanzar. */
function traducirError(e: { message?: string; code?: string }): never {
  const m = e.message ?? "";
  if (m.includes("hasta 30 tags")) throw new ErrorApi(409, "Una cuenta puede tener hasta 30 tags.");
  if (m.includes("reunión puede tener hasta 5 tags")) throw new ErrorApi(409, "Una reunión puede tener hasta 5 tags.");
  if (m.includes("plantilla puede tener hasta 5 tags")) throw new ErrorApi(409, "Una plantilla puede tener hasta 5 tags.");
  throw e;
}

export async function tagsDeLaCuenta(userId: string): Promise<FilaTag[]> {
  const { data, error } = await db().from("tags").select("id, name").eq("user_id", userId);
  if (error) throw error;
  return data as FilaTag[];
}

/** El tag de la cuenta con ese nombre (sin distinguir mayúsculas); si no existe, lo crea. */
async function asegurarTag(userId: string, nombre: string, existentes?: FilaTag[]): Promise<FilaTag> {
  const n = normalizarTag(nombre);
  if (!n) throw new ErrorApi(400, "El tag no puede estar vacío.");
  const lista = existentes ?? (await tagsDeLaCuenta(userId));
  const hay = lista.find((t) => t.name.toLowerCase() === n.toLowerCase());
  if (hay) return hay;
  const { data, error } = await db().from("tags").insert({ user_id: userId, name: n }).select("id, name").single();
  if (error) traducirError(error);
  const nuevo = data as FilaTag;
  lista.push(nuevo);
  return nuevo;
}

/** Borra los tags de la cuenta que quedaron sin ninguna reunión ni plantilla (por ejemplo, si un tope impidió ponerlos). */
async function purgarHuerfanos(userId: string): Promise<void> {
  const { data } = await db().from("tags").select("id, event_tags(count), template_tags(count)").eq("user_id", userId);
  const sinUso = (data as unknown as { id: string; event_tags: { count: number }[]; template_tags: { count: number }[] }[] | null)
    ?.filter((t) => !(t.event_tags[0]?.count ?? 0) && !(t.template_tags[0]?.count ?? 0))
    .map((t) => t.id);
  if (sinUso?.length) await db().from("tags").delete().in("id", sinUso);
}

/** Pone los tags a una reunión (los que ya tenía se mantienen). */
export async function ponerTags(userId: string, eventId: string, nombres: string[]): Promise<void> {
  const existentes = await tagsDeLaCuenta(userId);
  try {
    for (const nombre of nombres) {
      const tag = await asegurarTag(userId, nombre, existentes);
      const { error } = await db().from("event_tags").upsert({ event_id: eventId, tag_id: tag.id }, { onConflict: "event_id,tag_id", ignoreDuplicates: true });
      if (error) traducirError(error);
    }
  } catch (e) {
    await purgarHuerfanos(userId);
    throw e;
  }
}

/** Quita un tag de una reunión; si queda sin uso en la cuenta, la base lo borra sola. */
export async function quitarTag(userId: string, eventId: string, nombre: string): Promise<void> {
  const tag = (await tagsDeLaCuenta(userId)).find((t) => t.name.toLowerCase() === nombre.trim().toLowerCase());
  if (!tag) return;
  const { error } = await db().from("event_tags").delete().eq("event_id", eventId).eq("tag_id", tag.id);
  if (error) throw error;
}

/** Deja la plantilla con exactamente estos tags. */
export async function fijarTagsDePlantilla(userId: string, templateId: string, nombres: string[]): Promise<void> {
  try {
    await fijarTags(userId, templateId, nombres);
  } catch (e) {
    await purgarHuerfanos(userId);
    throw e;
  }
}

async function fijarTags(userId: string, templateId: string, nombres: string[]): Promise<void> {
  const existentes = await tagsDeLaCuenta(userId);
  const unicos = [...new Map(nombres.map((n) => [normalizarTag(n).toLowerCase(), n] as const)).values()].filter((n) => normalizarTag(n));
  const ids: string[] = [];
  for (const n of unicos) ids.push((await asegurarTag(userId, n, existentes)).id);

  const { data: actuales, error } = await db().from("template_tags").select("tag_id").eq("template_id", templateId);
  if (error) throw error;
  const hoy = (actuales as { tag_id: string }[]).map((r) => r.tag_id);

  const sobran = hoy.filter((id) => !ids.includes(id));
  if (sobran.length) {
    const { error: e } = await db().from("template_tags").delete().eq("template_id", templateId).in("tag_id", sobran);
    if (e) throw e;
  }
  const faltan = ids.filter((id) => !hoy.includes(id));
  if (faltan.length) {
    const { error: e } = await db().from("template_tags").insert(faltan.map((tag_id) => ({ template_id: templateId, tag_id })));
    if (e) traducirError(e);
  }
}
