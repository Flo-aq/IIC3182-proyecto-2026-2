import { leerJson, respuestaDeError } from "@/server/errores";
import { crearReunion } from "@/server/reuniones";

/** Crea una reunión. Devuelve el slug del link y la llave del creador. */
export async function POST(req: Request) {
  try {
    const { slug, tokenDueno } = await crearReunion(await leerJson(req));
    return Response.json({ slug, tokenDueno }, { status: 201 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
