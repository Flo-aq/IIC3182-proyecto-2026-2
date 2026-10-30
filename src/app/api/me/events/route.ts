import { exigirUsuario, listarReuniones } from "@/server/cuenta";
import { respuestaDeError } from "@/server/comun/errores";

/** Las reuniones del perfil: las que la cuenta creó y las que respondió, con sus tags. */
export async function GET() {
  try {
    const usuario = await exigirUsuario();
    return Response.json(await listarReuniones(usuario.id), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaDeError(e);
  }
}
