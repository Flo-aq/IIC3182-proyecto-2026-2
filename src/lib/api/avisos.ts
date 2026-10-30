import type { Aviso } from "@/components/compartidos/notificar-dialog";
import { ErrorHttp, pedir } from "./";

/** Lo que las pantallas piden al servidor sobre los avisos por correo (con el cliente común de `lib/api/index.ts`). */

/** Pide un aviso para la reunión. Devuelve su id y la llave con que quien no tiene cuenta lo puede quitar. */
export const pedirAviso = (slug: string, aviso: Aviso) =>
  pedir<{ id: string; tokenCancelar: string }>(`/api/events/${slug}/notifications`, {
    method: "POST",
    body: JSON.stringify(aviso),
    porDefecto: "No pudimos activar el aviso.",
  });

/** Quita un aviso pendiente. Si ya no existe (por ejemplo, ya se envió), no es un error. */
export async function quitarAviso(id: string, token?: string): Promise<void> {
  try {
    await pedir<void>(`/api/notifications/${id}${token ? `?token=${encodeURIComponent(token)}` : ""}`, { method: "DELETE", porDefecto: "No pudimos quitar el aviso." });
  } catch (e) {
    if (!(e instanceof ErrorHttp && e.estado === 404)) throw e;
  }
}

/** El aviso pendiente de esta persona en la reunión: el de su cuenta, o el que pidió sin cuenta (con su id y llave). `null` si no hay. */
export async function avisoPendiente(slug: string, llave?: { id: string; token: string }): Promise<{ id: string; aviso: Aviso } | null> {
  const consulta = llave ? `?id=${encodeURIComponent(llave.id)}&token=${encodeURIComponent(llave.token)}` : "";
  try {
    return await pedir<{ id: string; aviso: Aviso } | null>(`/api/events/${slug}/aviso${consulta}`);
  } catch (e) {
    if (e instanceof ErrorHttp) return null;
    throw e;
  }
}

// ---- el aviso que se pidió sin cuenta: la llave queda en este navegador ----

type Guardado = { aviso: Aviso; id: string; token: string };
const clave = (slug: string) => `wemeet:aviso:${slug}`;

export function guardarAvisoLocal(slug: string, g: Guardado): void {
  try {
    localStorage.setItem(clave(slug), JSON.stringify(g));
  } catch {
    // Sin almacenamiento: el aviso igual se envía; solo no se podrá quitar desde este navegador al volver.
  }
}

export function leerAvisoLocal(slug: string): Guardado | null {
  try {
    const crudo = localStorage.getItem(clave(slug));
    return crudo ? (JSON.parse(crudo) as Guardado) : null;
  } catch {
    return null;
  }
}

export function borrarAvisoLocal(slug: string): void {
  try {
    localStorage.removeItem(clave(slug));
  } catch {
    // nada que borrar
  }
}
