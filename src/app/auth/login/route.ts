import { NextResponse } from "next/server";

import { destinoSeguro, supabaseServidor } from "@/lib/supabase/servidor";

/** Empieza el inicio de sesión con Google y vuelve a `?next=` (una ruta de la app) al terminar. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = destinoSeguro(url.searchParams.get("next"));
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return NextResponse.redirect(`${url.origin}${next}${next.includes("?") ? "&" : "?"}error=login`);
  return NextResponse.redirect(data.url);
}
