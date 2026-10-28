import { respuestaDeError } from "@/server/errores";
import { leerReunion } from "@/server/reuniones";

/** La reunión con las respuestas de todos. */
export async function GET(_req: Request, ctx: RouteContext<"/api/events/[slug]">) {
  try {
    const { slug } = await ctx.params;
    const datos = await leerReunion(slug);
    if (!datos) return Response.json({ error: "No encontramos esa reunión." }, { status: 404 });
    return Response.json(datos, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaDeError(e);
  }
}
