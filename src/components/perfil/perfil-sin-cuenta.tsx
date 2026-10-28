import { LogIn, Plus, User } from "lucide-react";
import Link from "next/link";

import { BotonCuenta } from "@/components/boton-cuenta";
import { EnlacesAyuda } from "@/components/enlace-ayuda";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { urlDeLogin } from "@/lib/sesion";
import { cn } from "@/lib/utils";

/**
 * Lo que ve quien llega al perfil sin una cuenta. Escribir tu nombre sirve para responder una reunión, pero no es una cuenta:
 * el perfil guarda tus reuniones y tus tags, y solo se abre con un inicio de sesión real (Supabase Auth con Google).
 */
export function PerfilSinCuenta() {
  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col bg-background lg:max-w-[88rem]">
      <header className="flex h-12 shrink-0 items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link href="/" className="flex items-center gap-1" aria-label="WeMeet, ir al inicio">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">WeMeet</span>
        </Link>
        <div className="flex items-center gap-1">
          <EnlacesAyuda />
          <Link href="/" aria-label="Crear una reunión" title="Crear una reunión" className={buttonVariants({ size: "icon", className: "size-9 rounded-full" })}>
            <Plus />
          </Link>
          <BotonCuenta />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
          <User aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-extrabold tracking-tight">Tus reuniones</h1>
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
