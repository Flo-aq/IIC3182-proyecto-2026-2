import { NextResponse } from "next/server";

import { destinoSeguro, supabaseServidor } from "@/lib/supabase/servidor";

/** Vuelta de Google: cambia el código por la sesión (queda en cookies) y manda a la persona de vuelta a donde estaba. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = destinoSeguro(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${url.origin}${next}`);
  }
  return NextResponse.redirect(`${url.origin}${next}${next.includes("?") ? "&" : "?"}error=login`);
}
