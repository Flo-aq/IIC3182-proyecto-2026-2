import { toast } from "sonner";

/** Copia un texto al portapapeles. Devuelve false si el navegador no lo permite (por ejemplo, sin permiso o sin https). */
export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Copia un texto y avisa con un toast: el `exito` (con su `descripcion`, si la hay) o, si no se pudo, el `fallo`. */
export async function copiarConAviso(
  texto: string,
  { exito, descripcion, fallo = "No se pudo copiar. Selecciona el texto y cópialo a mano." }: { exito: string; descripcion?: string; fallo?: string },
): Promise<boolean> {
  const ok = await copiar(texto);
  if (ok) toast.success(exito, descripcion ? { description: descripcion } : undefined);
  else toast.error(fallo);
  return ok;
}
