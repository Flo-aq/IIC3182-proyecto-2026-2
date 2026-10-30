import "server-only";
import { randomBytes, randomInt } from "node:crypto";

// Sin letras que se confunden (0/o, 1/l/i) para que el link se pueda dictar.
const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";

export function nuevoSlug(largo = 8): string {
  return Array.from({ length: largo }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

/** Llave del creador: con ella se podrá cerrar la reunión sin cuenta. */
export const nuevoTokenDueno = (): string => randomBytes(24).toString("hex");
