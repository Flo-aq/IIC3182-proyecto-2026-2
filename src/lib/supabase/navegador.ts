import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para el navegador, con la llave pública: solo sirve para la sesión (la base de datos no tiene políticas públicas). */
export const supabaseNavegador = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
