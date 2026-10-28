import type { ReunionDePerfil } from "./perfil";
import type { PlantillaDeCuenta } from "./plantillas";
import { type Plantilla, aIso } from "./reunion";

/** Lo que las pantallas de la cuenta piden al servidor (`/api/me/*`). Los errores traen el mensaje listo para mostrar. */
async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  } catch {
    throw new Error("No pudimos conectarnos. Revisa tu internet e intenta de nuevo.");
  }
  if (res.status === 204) return undefined as T;
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cuerpo.error ?? "Algo salió mal. Intenta de nuevo.");
  return cuerpo as T;
}

type ReunionDePerfilApi = Omit<ReunionDePerfil, "fecha"> & { fecha: string };

/** Las reuniones del perfil; la fecha llega como instante y aquí pasa al día en la zona de quien mira. */
export async function cargarReuniones(): Promise<ReunionDePerfil[]> {
  const rs = await pedir<ReunionDePerfilApi[]>("/api/me/events");
  return rs.map((r) => ({ ...r, fecha: aIso(new Date(r.fecha)) }));
}

export const cargarPlantillas = () => pedir<PlantillaDeCuenta[]>("/api/me/templates");

export async function cargarTags(): Promise<string[]> {
  return (await pedir<{ name: string }[]>("/api/me/tags")).map((t) => t.name);
}

export const agregarTag = (slug: string, nombre: string) =>
  pedir<void>(`/api/me/events/${slug}/tags`, { method: "POST", body: JSON.stringify({ nombre }) });

export const quitarTag = (slug: string, nombre: string) =>
  pedir<void>(`/api/me/events/${slug}/tags/${encodeURIComponent(nombre)}`, { method: "DELETE" });

const cuerpoDePlantilla = (p: Plantilla, tags: string[]) =>
  JSON.stringify({ nombre: p.nombre, bloqueMin: p.bloqueMin, desde: p.desde, hasta: p.hasta, claves: p.claves, bloqueos: p.bloqueos, tags });

export const crearPlantilla = (p: Plantilla, tags: string[]) =>
  pedir<PlantillaDeCuenta>("/api/me/templates", { method: "POST", body: cuerpoDePlantilla(p, tags) });

export const actualizarPlantilla = (id: string, p: Plantilla, tags: string[]) =>
  pedir<PlantillaDeCuenta>(`/api/me/templates/${id}`, { method: "PUT", body: cuerpoDePlantilla(p, tags) });

export const borrarPlantilla = (id: string) => pedir<void>(`/api/me/templates/${id}`, { method: "DELETE" });
