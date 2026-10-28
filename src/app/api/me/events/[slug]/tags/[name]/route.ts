import { exigirUsuario, quitarTagDeReunion } from "@/server/cuenta";
import { respuestaDeError } from "@/server/errores";

/** Quita un tag de una reunión de la cuenta. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/me/events/[slug]/tags/[name]">) {
  try {
    const usuario = await exigirUsuario();
    const { slug, name } = await ctx.params;
    await quitarTagDeReunion(usuario.id, slug, name);
    return new Response(null, { status: 204 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
