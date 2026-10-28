import "server-only";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";

// Cliente con la llave secreta: se salta RLS, por eso solo vive en el servidor.
let cliente: SupabaseClient | undefined;

export function db() {
  if (!cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const llave = process.env.SUPABASE_SECRET_KEY;
    if (!url || !llave) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
    cliente = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return cliente;
}
