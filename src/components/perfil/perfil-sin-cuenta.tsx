import { LogIn, User } from "lucide-react";
import Link from "next/link";

import { EnlacesAyuda } from "@/components/enlace-ayuda";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";

/**
 * Lo que ve quien llega al perfil sin una cuenta. Escribir tu nombre sirve para responder una reunión, pero no es una cuenta:
 * el perfil guarda tus reuniones y tus tags, y solo se abre con un inicio de sesión real (Supabase Auth, todavía no conectado).
 */
export function PerfilSinCuenta() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link href="/" className="flex items-center gap-1" aria-label="WeMeet, ir al inicio">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">WeMeet</span>
        </Link>
        <EnlacesAyuda />
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
        <Button type="button" variant="outline" disabled className={`${BOTON.secundario} px-6`} title="Próximamente: iniciar sesión con Google">
          <LogIn />
          Iniciar sesión
        </Button>
        <p className="text-xs text-muted-foreground">Próximamente.</p>
        <Link href="/" className={buttonVariants({ variant: "ghost", className: BOTON.texto })}>
          Crear una reunión
        </Link>
      </main>
    </div>
  );
}
