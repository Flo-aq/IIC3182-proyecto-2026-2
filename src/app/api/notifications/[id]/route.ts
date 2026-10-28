import { usuarioActual } from "@/lib/supabase/servidor";
import { quitarAviso } from "@/server/avisos";
import { respuestaDeError } from "@/server/errores";

/** Quita un aviso pendiente. Su dueño lo hace con su sesión; quien lo pidió sin cuenta, con la llave (`?token=`) que recibió al pedirlo. */
export async function DELETE(req: Request, ctx: RouteContext<"/api/notifications/[id]">) {
  try {
    const { id } = await ctx.params;
    const usuario = await usuarioActual();
    await quitarAviso(id, usuario?.id ?? null, new URL(req.url).searchParams.get("token"));
    return new Response(null, { status: 204 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
