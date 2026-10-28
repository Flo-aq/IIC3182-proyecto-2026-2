import { procesarAvisos } from "@/server/avisos";
import { respuestaDeError } from "@/server/errores";

/**
 * Lo llama un temporizador cada pocos minutos (el workflow `avisos.yml` de GitHub Actions; Vercel además lo llama una vez al día):
 * envía los avisos de fecha y de fecha y hora que ya llegaron. Pide `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  try {
    return Response.json(await procesarAvisos(new URL(req.url).origin));
  } catch (e) {
    return respuestaDeError(e);
  }
}
