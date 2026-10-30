import { exigirUsuario, listarTags } from "@/server/cuenta";
import { respuestaDeError } from "@/server/comun/errores";

/** Los tags de la cuenta, con en cuántas reuniones y plantillas está cada uno. */
export async function GET() {
  try {
    const usuario = await exigirUsuario();
    return Response.json(await listarTags(usuario.id), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaDeError(e);
  }
}
