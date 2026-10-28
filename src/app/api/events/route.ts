import { usuarioActual } from "@/lib/supabase/servidor";
import { leerJson, respuestaDeError } from "@/server/errores";
import { limitar } from "@/server/limite";
import { crearReunion } from "@/server/reuniones";

/** Crea una reunión. Devuelve el slug del link y la llave del creador. Con sesión, la reunión queda en el perfil de quien la crea. */
export async function POST(req: Request) {
  try {
    await limitar(req, "crear", 30, 3600);
    const usuario = await usuarioActual();
    const { slug, tokenDueno } = await crearReunion(await leerJson(req), usuario?.id ?? null);
    return Response.json({ slug, tokenDueno }, { status: 201 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
