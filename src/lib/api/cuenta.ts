import { pedir } from "./";
import type { ReunionDePerfil } from "../cuenta/perfil";
import type { PlantillaDeCuenta } from "../cuenta/plantillas";
import { type Plantilla, aIso } from "../reunion";

/** Lo que las pantallas de la cuenta piden al servidor (`/api/me/*`), con el cliente común de `lib/api/index.ts`. */
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
