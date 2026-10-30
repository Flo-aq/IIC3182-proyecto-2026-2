import { instanteDeBloque } from "@/lib/reunion/calendario";
import { respuestaDeError } from "@/server/comun/errores";
import { crearIcs } from "@/server/reuniones/ics";
import { leerReunion } from "@/server/reuniones";

/** El .ics de la reunión confirmada, para agregarla al calendario. `404` si no existe o todavía no se cierra. */
export async function GET(req: Request, ctx: RouteContext<"/api/events/[slug]/ics">) {
  try {
    const { slug } = await ctx.params;
    const datos = await leerReunion(slug);
    if (!datos || !datos.cerrada) return Response.json({ error: "Esta reunión todavía no tiene un horario confirmado." }, { status: 404 });
    const ics = crearIcs({
      slug: datos.slug,
      titulo: datos.reunion.titulo,
      inicio: instanteDeBloque(datos.reunion, datos.cerrada),
      minutos: datos.reunion.bloqueMin,
      enlace: `${new URL(req.url).origin}/e/${datos.slug}`,
    });
    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="wemeet-${datos.slug}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return respuestaDeError(e);
  }
}
