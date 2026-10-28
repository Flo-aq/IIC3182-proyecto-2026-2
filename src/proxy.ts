import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Mantiene viva la sesión: si el token de acceso venció, lo renueva y guarda las cookies nuevas. Solo actúa si hay sesión. */
export async function proxy(request: NextRequest) {
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return NextResponse.next();

  let respuesta = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        for (const { name, value } of lista) request.cookies.set(name, value);
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of lista) respuesta.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|ayuda/|icon.svg|favicon.ico).*)"],
};
