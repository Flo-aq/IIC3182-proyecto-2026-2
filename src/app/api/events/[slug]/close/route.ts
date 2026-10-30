import { usuarioActual } from "@/lib/supabase/servidor";
import { leerJson, respuestaDeError } from "@/server/comun/errores";
import { limitar } from "@/server/comun/limite";
import { cerrarReunion } from "@/server/reuniones";

/** Cierra la reunión con el horario elegido. Solo su creador: por su cuenta o con la llave (`tokenDueno`) que se guardó al crearla. */
export async function POST(req: Request, ctx: RouteContext<"/api/events/[slug]/close">) {
  try {
    const { slug } = await ctx.params;
    await limitar(req, "cerrar", 60, 3600);
    const usuario = await usuarioActual();
    await cerrarReunion(slug, await leerJson(req), usuario?.id ?? null);
    return Response.json({ ok: true });
  } catch (e) {
    return respuestaDeError(e);
  }
}
