import { after } from "next/server";

import { usuarioActual } from "@/lib/supabase/servidor";
import { revisarAvisosPorCantidad } from "@/server/avisos";
import { leerJson, respuestaDeError } from "@/server/comun/errores";
import { limitar } from "@/server/comun/limite";
import { guardarRespuesta } from "@/server/reuniones";

/** Guarda (o reemplaza) la respuesta de una persona, identificada por su nombre. Con sesión, queda ligada a su cuenta. */
export async function PUT(req: Request, ctx: RouteContext<"/api/events/[slug]/responses">) {
  try {
    const { slug } = await ctx.params;
    await limitar(req, "responder", 300, 600);
    const usuario = await usuarioActual();
    const { eventId, ...res } = await guardarRespuesta(slug, await leerJson(req), usuario?.id ?? null);
    // Ya se respondió: con la respuesta guardada, se envían (sin hacer esperar a quien respondió) los avisos "cuando respondan N personas" que se cumplieron.
    const origen = new URL(req.url).origin;
    after(() => revisarAvisosPorCantidad(eventId, origen).catch((e) => console.error("avisos por cantidad", e)));
    return Response.json(res);
  } catch (e) {
    return respuestaDeError(e);
  }
}
