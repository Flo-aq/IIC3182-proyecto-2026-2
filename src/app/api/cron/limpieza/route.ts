import { db } from "@/server/db";
import { respuestaDeError } from "@/server/errores";

/**
 * Cron diario de Vercel: borra las reuniones sin respuestas hace 2 meses.
 * Al tocar la base una vez al día también evita que Supabase pause el proyecto por inactividad.
 */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    const { data, error } = await db().rpc("purge_stale_events");
    if (error) throw error;
    return Response.json({ borradas: data });
  } catch (e) {
    return respuestaDeError(e);
  }
}
