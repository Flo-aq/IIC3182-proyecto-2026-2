import "server-only";
import { z } from "zod";
import { MAX_TAGS_POR_REUNION } from "@/lib/cuenta/perfil";
import { type Reunion, problemas } from "@/lib/reunion";
import { db } from "../comun/db";
import { ErrorApi } from "../comun/errores";
import { nuevoSlug, nuevoTokenDueno } from "../comun/slug";
import { ponerTags } from "../cuenta/tags";
import { esquemaReunion } from "./esquemas";

/** Crea la reunión. Con `ownerId` (cuenta), queda en su perfil y se le ponen los `etiquetas` que vengan en la entrada. */
export async function crearReunion(entrada: unknown, ownerId: string | null = null): Promise<{ slug: string; tokenDueno: string }> {
  const parsed = esquemaReunion.safeParse(entrada);
  if (!parsed.success) throw new ErrorApi(400, "Los datos de la reunión no son válidos.");
  const r: Reunion = parsed.data;
  // Las mismas reglas que valida la pantalla antes de enviar.
  if (problemas(r).length) throw new ErrorApi(400, "Los datos de la reunión no son válidos.");

  const dias = [...new Set(r.dias)].sort();
  const tokenDueno = nuevoTokenDueno();
  for (let intento = 0; intento < 5; intento++) {
    const slug = nuevoSlug();
    const { data: id, error } = await db().rpc("create_event", {
      p_slug: slug,
      p_title: r.titulo.trim(),
      p_owner_id: ownerId,
      p_owner_token: tokenDueno,
      p_timezone: r.zona,
      p_days: dias,
      p_start: r.desde,
      p_end: r.hasta,
      p_slot: r.bloqueMin,
      p_max_key: r.claves,
      p_blocked: r.bloqueos.map((b) => ({ days: [...new Set(b.dias)].sort(), start: b.desde, end: b.hasta })),
    });
    if (!error) {
      const etiquetas = ownerId ? z.array(z.string()).max(MAX_TAGS_POR_REUNION).safeParse((entrada as { etiquetas?: unknown }).etiquetas) : null;
      // Los tags son un extra: si alguno falla (por ejemplo, el tope de la cuenta) la reunión ya está creada y se queda sin ellos.
      if (ownerId && etiquetas?.success && etiquetas.data.length) {
        await ponerTags(ownerId, id as string, etiquetas.data).catch((e) => console.error("tags de la reunión nueva", e));
      }
      // El nombre del organizador es un extra, como los tags: si no se pudo guardar (por ejemplo, falta correr la migración
      // que crea la columna), la reunión ya está creada y se cierra solo con la llave del navegador.
      const organizador = parsed.data.organizador;
      if (!ownerId && organizador) {
        const { error: eNombre } = await db().from("events").update({ owner_name: organizador }).eq("id", id as string);
        if (eNombre) console.error("nombre del organizador", eNombre.message);
      }
      return { slug, tokenDueno };
    }
    if (error.code !== "23505") throw error; // solo se reintenta si el slug ya existía
  }
  throw new Error("No se pudo generar un link único");
}
