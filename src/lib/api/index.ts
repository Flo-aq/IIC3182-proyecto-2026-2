/** Un error de la API con el código HTTP con que respondió (para distinguir, por ejemplo, un 404 de otros fallos). */
export class ErrorHttp extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
  ) {
    super(mensaje);
  }
}

type Opciones = RequestInit & {
  /** El mensaje si el servidor responde con un error sin explicación. */
  porDefecto?: string;
};

/**
 * Lo que las pantallas piden al servidor: llama a la API de WeMeet (JSON) y devuelve su respuesta ya leída. Los errores traen el
 * mensaje listo para mostrar a la persona: el que mande el servidor, `porDefecto`, o uno de conexión si no hay internet.
 */
export async function pedir<T>(url: string, { porDefecto = "Algo salió mal. Intenta de nuevo.", ...init }: Opciones = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  } catch {
    throw new Error("No pudimos conectarnos. Revisa tu internet e intenta de nuevo.");
  }
  if (res.status === 204) return undefined as T;
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErrorHttp(cuerpo.error ?? porDefecto, res.status);
  return cuerpo as T;
}
