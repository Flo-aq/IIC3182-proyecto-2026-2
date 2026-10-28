import { usuarioActual } from "@/lib/supabase/servidor";
import { leerJson, respuestaDeError } from "@/server/errores";
import { guardarRespuesta } from "@/server/reuniones";

/** Guarda (o reemplaza) la respuesta de una persona, identificada por su nombre. Con sesión, queda ligada a su cuenta. */
export async function PUT(req: Request, ctx: RouteContext<"/api/events/[slug]/responses">) {
  try {
    const { slug } = await ctx.params;
    const usuario = await usuarioActual();
    const res = await guardarRespuesta(slug, await leerJson(req), usuario?.id ?? null);
    return Response.json(res);
  } catch (e) {
    return respuestaDeError(e);
  }
}
