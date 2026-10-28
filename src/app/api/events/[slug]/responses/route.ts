import { leerJson, respuestaDeError } from "@/server/errores";
import { guardarRespuesta } from "@/server/reuniones";

/** Guarda (o reemplaza) la respuesta de una persona, identificada por su nombre. */
export async function PUT(req: Request, ctx: RouteContext<"/api/events/[slug]/responses">) {
  try {
    const { slug } = await ctx.params;
    const res = await guardarRespuesta(slug, await leerJson(req));
    return Response.json(res);
  } catch (e) {
    return respuestaDeError(e);
  }
}
