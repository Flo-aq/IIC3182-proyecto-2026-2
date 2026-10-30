import { crearPlantilla, exigirUsuario, listarPlantillas } from "@/server/cuenta";
import { leerJson, respuestaDeError } from "@/server/comun/errores";

/** Las plantillas de la cuenta, las más nuevas primero. */
export async function GET() {
  try {
    const usuario = await exigirUsuario();
    return Response.json(await listarPlantillas(usuario.id), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaDeError(e);
  }
}

/** Crea una plantilla. `409` si ya hay una con ese nombre. */
export async function POST(req: Request) {
  try {
    const usuario = await exigirUsuario();
    return Response.json(await crearPlantilla(usuario.id, await leerJson(req)), { status: 201 });
  } catch (e) {
    return respuestaDeError(e);
  }
}
