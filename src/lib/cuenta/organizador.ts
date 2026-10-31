// El nombre con que se creó una reunión sin cuenta. Se guarda en una cookie (y no en localStorage) para que el servidor lo lea
// al abrir la reunión: así quien organiza entra directo a Mi horario, sin volver a escribir el nombre ni ver la pantalla de acceso.
// Solo sirve para entrar más rápido; quién puede cerrar la reunión se decide en el servidor (cuenta, llave o nombre).

const DURACION = 60 * 60 * 24 * 60; // 60 días: las reuniones se borran 2 meses después de la última respuesta

/** Nombre de la cookie de esa reunión (el slug solo tiene letras, números y guiones). */
export const cookieDelOrganizador = (slug: string): string => `wemeet-org-${slug}`;

/** En el navegador, al crear la reunión. */
export function guardarOrganizador(slug: string, nombre: string): void {
  const segura = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${cookieDelOrganizador(slug)}=${encodeURIComponent(nombre)}; path=/; max-age=${DURACION}; samesite=lax${segura}`;
}
