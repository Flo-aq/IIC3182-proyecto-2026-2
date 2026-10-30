import "server-only";
import type { Reunion } from "@/lib/reunion";
import type { ReunionConRespuestas } from "@/lib/reunion/respuestas";
import { db } from "../comun/db";
import { type FilaReunion, SLUG_VALIDO, aBloque, hhmm, nombreDelOrganizador } from "./filas";

/** La reunión con sus respuestas, y quién la creó (`duenoId`, solo para el servidor: no debe llegar al navegador). */
type ReunionLeida = ReunionConRespuestas & { duenoId: string | null };

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
