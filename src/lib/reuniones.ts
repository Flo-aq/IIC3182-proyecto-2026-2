import type { ReunionConRespuestas } from "./respuestas";

/**
 * La reunión de un link, con todas sus respuestas.
 *
 * Todavía no hay base de datos, así que ninguna reunión existe y todo link da 404. Cuando se conecte Supabase, esto pasa a
 * leer la reunión por su `slug` (ver GET /api/events/[slug] en ARQUITECTURA.md).
 */
export async function obtenerReunion(slug: string): Promise<ReunionConRespuestas | null> {
  void slug;
  return null;
}
