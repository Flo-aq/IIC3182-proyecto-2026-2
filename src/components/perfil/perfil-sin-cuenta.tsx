import { PAGINA, TITULO } from "@/lib/utilidades/estilos";
import { LogIn, User } from "lucide-react";
import Link from "next/link";

import { BarraSuperior } from "@/components/comunes/barra-superior";
import { buttonVariants } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { urlDeLogin } from "@/lib/cuenta/sesion";
import { cn } from "@/lib/utils";

/**
 * Lo que ve quien llega al perfil sin una cuenta. Escribir tu nombre sirve para responder una reunión, pero no es una cuenta:
 * el perfil guarda tus reuniones y tus tags, y solo se abre con un inicio de sesión real (Supabase Auth con Google).
 */
export function PerfilSinCuenta() {
  return (
    <div className={PAGINA}>
      <BarraSuperior />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
          <User aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h1 className={TITULO.grande}>Tus reuniones</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Para ver las reuniones que creaste y respondiste, y ponerles tags, necesitas una cuenta. Escribir tu nombre sirve para responder, pero no abre tu perfil.
          </p>
        </div>
        <a href={urlDeLogin("/perfil")} className={cn(buttonVariants({ variant: "outline" }), BOTON.secundario, "px-6")}>
          <LogIn />
          Iniciar sesión con Google
        </a>
        <Link href="/" className={buttonVariants({ variant: "ghost", className: BOTON.texto })}>
          Crear una reunión
        </Link>
      </main>
    </div>
  );
}
