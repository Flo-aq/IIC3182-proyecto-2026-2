import "server-only";
import { timingSafeEqual } from "node:crypto";
import { bloquesDelDia } from "@/lib/reunion";
import { totalFilas } from "@/lib/reunion/respuestas";
import { db } from "../comun/db";
import { ErrorApi } from "../comun/errores";
import { esquemaCierre } from "./esquemas";
import { type FilaReunion, SLUG_VALIDO, instante, mismoNombre, nombreDelOrganizador, reunionDeLaFila } from "./filas";

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

/** Cierra la reunión con el bloque elegido: desde entonces nadie puede cambiar respuestas. */
export async function cerrarReunion(slug: string, entrada: unknown, userId: string | null): Promise<void> {
  const parsed = esquemaCierre.safeParse(entrada);
  if (!parsed.success || !parsed.data.bloque) throw new ErrorApi(400, "Elige un horario para cerrar la reunión.");
  const e = await reunionDelDueno(slug, parsed.data.tokenDueno, userId, parsed.data.nombre);
  if (e.status === "closed") throw new ErrorApi(409, "Esta reunión ya está cerrada.");

  const r = reunionDeLaFila(e);
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
