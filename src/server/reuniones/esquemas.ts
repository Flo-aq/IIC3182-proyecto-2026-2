import { z } from "zod";
import { MAX_BLOQUEOS, MAX_CLAVES, MAX_DIAS, MAX_NOMBRE, MAX_TITULO } from "@/lib/reunion/limites";
import { OPCIONES_BLOQUE } from "@/lib/reunion";

// ---- validación de lo que llega del navegador ----

export const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const horaFin = z.union([hora, z.literal("24:00")]);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s));
const zona = z.string().refine((z) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: z });
    return true;
  } catch {
    return false;
  }
});

export const esquemaReunion = z.object({
  titulo: z.string().trim().min(1).max(MAX_TITULO),
  zona,
  dias: z.array(fecha).min(1).max(MAX_DIAS),
  desde: hora,
  hasta: horaFin,
  bloqueMin: z.number().refine((n) => (OPCIONES_BLOQUE as readonly number[]).includes(n)),
  claves: z.number().int().min(0).max(MAX_CLAVES),
  bloqueos: z
    .array(z.object({ id: z.string().max(40), dias: z.array(fecha).max(MAX_DIAS), desde: hora, hasta: horaFin }))
    .max(MAX_BLOQUEOS),
  /** Nombre de quien organiza (sin cuenta): con él podrá cerrar la reunión desde cualquier dispositivo. */
  organizador: z.string().trim().max(MAX_NOMBRE).optional(),
});

export const esquemaRespuesta = z.object({
  nombre: z.string().trim().min(1).max(MAX_NOMBRE),
  clave: z.boolean(),
  /** Bloques en que puede, como "AAAA-MM-DD|fila" (la misma clave que usa la grilla). */
  bloques: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}\|\d{1,4}$/)).max(MAX_DIAS * 288),
});

export const esquemaCierre = z.object({
  bloque: z.string().regex(/^\d{4}-\d{2}-\d{2}\|\d{1,4}$/).optional(),
  tokenDueno: z.string().max(100).optional(),
  /** El nombre con que quien organiza entró a la reunión. */
  nombre: z.string().trim().max(MAX_NOMBRE).optional(),
});
