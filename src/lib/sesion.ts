"use client";

/**
 * La sesión de la cuenta. Escribir el nombre para responder una reunión no cuenta: solo un inicio de sesión real
 * (Supabase Auth con Google) da acceso al perfil, las plantillas y los tags.
 *
 * Todavía no está conectado Supabase Auth, así que por ahora nadie tiene cuenta: "Sign in" queda desactivado y
 * `/perfil` pide iniciar sesión. Cuando se conecte, este hook lee la sesión real y es lo único que cambia en la interfaz.
 */
export function useSesion(): { conCuenta: boolean; nombre: string; cerrar: () => void } {
  return { conCuenta: false, nombre: "", cerrar: () => {} };
}
