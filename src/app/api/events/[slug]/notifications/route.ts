import { usuarioActual } from "@/lib/supabase/servidor";
import { crearAviso } from "@/server/avisos";
import { leerJson, respuestaDeError } from "@/server/comun/errores";
import { limitar } from "@/server/comun/limite";

/**
 * Pide un aviso por correo para la reunión: `{ tipo: "personas", personas, correo }`, `{ tipo: "fecha", fecha, correo }` o
 * `{ tipo: "fecha-hora", fecha, hora, correo }` (fecha y hora en la zona de la reunión). Devuelve el id y la llave para quitarlo.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/events/[slug]/notifications">) {
  try {
    const { slug } = await ctx.params;
    await limitar(req, "aviso", 20, 3600);
    const usuario = await usuarioActual();
    const creado = await crearAviso(slug, await leerJson(req), usuario?.id ?? null);
    return Response.json(creado, { status: 201 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
