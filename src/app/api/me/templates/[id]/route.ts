import { actualizarPlantilla, borrarPlantilla, exigirUsuario } from "@/server/cuenta";
import { leerJson, respuestaDeError } from "@/server/comun/errores";

/** Reemplaza una plantilla. `409` si el nombre ya lo tiene otra. */
export async function PUT(req: Request, ctx: RouteContext<"/api/me/templates/[id]">) {
  try {
    const usuario = await exigirUsuario();
    const { id } = await ctx.params;
    return Response.json(await actualizarPlantilla(usuario.id, id, await leerJson(req)));
  } catch (e) {
    return respuestaDeError(e);
  }
}

/** Borra una plantilla (las reuniones ya creadas con ella no cambian). */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/me/templates/[id]">) {
  try {
    const usuario = await exigirUsuario();
    const { id } = await ctx.params;
    await borrarPlantilla(usuario.id, id);
    return new Response(null, { status: 204 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
