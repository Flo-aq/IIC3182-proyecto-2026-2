import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { ErrorApi } from "./errores";

/** La IP de quien hace la petición (Vercel la pone en `x-real-ip` y `x-forwarded-for`). */
function ipDe(req: Request): string {
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
}

/**
 * Límite de peticiones por IP: cuenta una petición de `nombre` y, si ya se pasó de `max` en `ventanaSegundos`, responde 429.
 * La IP no se guarda: se convierte en un código (con una sal) y solo ese código queda en la base, hasta que vence la ventana.
 *
 * Los límites son holgados a propósito: en una sala de clases todos comparten la IP del wifi, y esto solo busca frenar
 * programas que repiten la misma petición, no a personas. Si el contador falla (por ejemplo, la base no responde), se deja
 * pasar: es preferible no limitar que dejar a todos sin poder usar WeMeet.
 */
export async function limitar(req: Request, nombre: string, max: number, ventanaSegundos: number): Promise<void> {
  const codigo = createHash("sha256").update(`${ipDe(req)}:${process.env.CRON_SECRET ?? ""}`).digest("hex").slice(0, 32);
  const { data, error } = await db().rpc("rate_limit", { p_clave: `${nombre}:${codigo}`, p_max: max, p_ventana_segundos: ventanaSegundos });
  if (error) {
    console.error("límite de peticiones", error.message);
    return;
  }
  if (data === false) throw new ErrorApi(429, "Hiciste muchas peticiones seguidas. Espera un momento e intenta de nuevo.");
}
