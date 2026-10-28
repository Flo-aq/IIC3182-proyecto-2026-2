import type { Aviso } from "@/components/responder/notificar-dialog";

/** Lo que las pantallas piden al servidor sobre los avisos por correo. Los errores traen el mensaje listo para mostrar. */
async function pedir(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new Error("No pudimos conectarnos. Revisa tu internet e intenta de nuevo.");
  }
}

async function mensajeDeError(res: Response, porDefecto: string): Promise<Error> {
  return new Error((await res.json().catch(() => ({}))).error ?? porDefecto);
}

/** Pide un aviso para la reunión. Devuelve su id y la llave con que quien no tiene cuenta lo puede quitar. */
export async function pedirAviso(slug: string, aviso: Aviso): Promise<{ id: string; tokenCancelar: string }> {
  const res = await pedir(`/api/events/${slug}/notifications`, { method: "POST", body: JSON.stringify(aviso) });
  if (!res.ok) throw await mensajeDeError(res, "No pudimos activar el aviso.");
  return res.json();
}

/** Quita un aviso pendiente. Si ya no existe (por ejemplo, ya se envió), no es un error. */
export async function quitarAviso(id: string, token?: string): Promise<void> {
  const res = await pedir(`/api/notifications/${id}${token ? `?token=${encodeURIComponent(token)}` : ""}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) throw await mensajeDeError(res, "No pudimos quitar el aviso.");
}

/** El aviso pendiente de esta persona en la reunión: el de su cuenta, o el que pidió sin cuenta (con su id y llave). `null` si no hay. */
export async function avisoPendiente(slug: string, llave?: { id: string; token: string }): Promise<{ id: string; aviso: Aviso } | null> {
  const consulta = llave ? `?id=${encodeURIComponent(llave.id)}&token=${encodeURIComponent(llave.token)}` : "";
  const res = await pedir(`/api/events/${slug}/aviso${consulta}`);
  if (!res.ok) return null;
  return res.json();
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
