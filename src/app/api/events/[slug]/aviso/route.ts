import { usuarioActual } from "@/lib/supabase/servidor";
import { avisoDeLaCuenta, avisoPorLlave } from "@/server/avisos";
import { respuestaDeError } from "@/server/comun/errores";

/**
 * El aviso pendiente de quien pregunta en esta reunión, o `null`: el de su cuenta (con sesión) o, sin cuenta, el que pidió desde
 * este navegador (`?id=` y `?token=`, la llave que recibió al pedirlo).
 */
export async function GET(req: Request, ctx: RouteContext<"/api/events/[slug]/aviso">) {
  try {
    const { slug } = await ctx.params;
    const usuario = await usuarioActual();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const aviso = (usuario ? await avisoDeLaCuenta(usuario.id, slug) : null) ?? (id && token ? await avisoPorLlave(slug, id, token) : null);
    return Response.json(aviso, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaDeError(e);
  }
}
