import "server-only";

/** Un error que se le muestra a la persona: el mensaje va tal cual en la respuesta. */
export class ErrorApi extends Error {
  constructor(
    public status: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export function respuestaDeError(e: unknown): Response {
  if (e instanceof ErrorApi) {
    // En un 429, "Retry-After" le dice a quien pidió cuántos segundos esperar (la ventana más corta de los límites es de 10 minutos).
    return Response.json({ error: e.message }, { status: e.status, headers: e.status === 429 ? { "Retry-After": "60" } : undefined });
  }
  console.error(e);
  return Response.json({ error: "Algo salió mal de nuestro lado. Intenta de nuevo." }, { status: 500 });
}

/** Lee el cuerpo JSON de la petición; si viene roto o no es JSON, es un error 400. */
export async function leerJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ErrorApi(400, "La petición no se entendió.");
  }
}
