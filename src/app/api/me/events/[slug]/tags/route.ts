import { agregarTagAReunion, exigirUsuario } from "@/server/cuenta";
import { leerJson, respuestaDeError } from "@/server/comun/errores";

/** Pone un tag a una reunión de la cuenta (lo crea si no existe, sin distinguir mayúsculas). */
export async function POST(req: Request, ctx: RouteContext<"/api/me/events/[slug]/tags">) {
  try {
    const usuario = await exigirUsuario();
    const { slug } = await ctx.params;
    const cuerpo = (await leerJson(req)) as { nombre?: unknown };
    await agregarTagAReunion(usuario.id, slug, cuerpo?.nombre);
    return new Response(null, { status: 201 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
