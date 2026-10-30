import { usuarioActual } from "@/lib/supabase/servidor";
import { leerJson, respuestaDeError } from "@/server/comun/errores";
import { reabrirReunion } from "@/server/reuniones";

/** Reabre una reunión cerrada. Solo su creador (cuenta o llave). */
export async function POST(req: Request, ctx: RouteContext<"/api/events/[slug]/reopen">) {
  try {
    const { slug } = await ctx.params;
    const usuario = await usuarioActual();
    await reabrirReunion(slug, await leerJson(req), usuario?.id ?? null);
    return Response.json({ ok: true });
  } catch (e) {
    return respuestaDeError(e);
  }
}
