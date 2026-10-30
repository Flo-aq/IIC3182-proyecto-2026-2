import "server-only";
import { MAX_RESPUESTAS } from "@/lib/reunion/limites";
import { totalFilas } from "@/lib/reunion/respuestas";
import { db } from "../comun/db";
import { ErrorApi } from "../comun/errores";
import { esquemaRespuesta } from "./esquemas";
import { type FilaReunion, SLUG_VALIDO, instante, reunionDeLaFila } from "./filas";

/** `eventId` es solo para el servidor (por ejemplo, para revisar los avisos): no se le manda al navegador. */
type ResultadoRespuesta = { claveDenegada: boolean; clave: boolean; eventId: string };

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

  const r = reunionDeLaFila(e);
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
