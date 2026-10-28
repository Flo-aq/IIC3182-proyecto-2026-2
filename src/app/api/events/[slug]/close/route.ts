import { usuarioActual } from "@/lib/supabase/servidor";
import { leerJson, respuestaDeError } from "@/server/errores";
import { cerrarReunion } from "@/server/reuniones";

/** Cierra la reunión con el horario elegido. Solo su creador: por su cuenta o con la llave (`tokenDueno`) que se guardó al crearla. */
export async function POST(req: Request, ctx: RouteContext<"/api/events/[slug]/close">) {
  try {
    const { slug } = await ctx.params;
    const usuario = await usuarioActual();
    await cerrarReunion(slug, await leerJson(req), usuario?.id ?? null);
    return Response.json({ ok: true });
  } catch (e) {
    return respuestaDeError(e);
  }
}
