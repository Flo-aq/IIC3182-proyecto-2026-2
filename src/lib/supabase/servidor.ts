import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente de Supabase con la sesión de quien hace la petición (cookies). No usa la llave secreta. */
export async function supabaseServidor() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (lista) => {
        try {
          for (const { name, value, options } of lista) jar.set(name, value, options);
        } catch {
          // Desde un Server Component no se pueden escribir cookies; el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/** Quién hace la petición (verificado con Supabase), o null si no tiene cuenta. */
export async function usuarioActual(): Promise<{ id: string; email: string | undefined; nombre: string } | null> {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const nombre = u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? "Tu cuenta";
  return { id: u.id, email: u.email, nombre };
}

/** Solo rutas internas ("/perfil"): evita que /auth/login?next=https://otro.sitio mande a otro lado. */
export const destinoSeguro = (next: string | null): string => (next && /^\/(?![/\\])/.test(next) ? next : "/");
