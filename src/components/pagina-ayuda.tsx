import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BotonCuenta } from "@/components/boton-cuenta";
import { EnlacesAyuda } from "@/components/enlace-ayuda";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

/**
 * El marco de las páginas de ayuda (How to y FAQ): la barra de arriba ocupa todo el ancho, como en las demás pantallas
 * (logo para volver al inicio, vínculos de ayuda, "+" para crear una reunión y la cuenta), y el contenido va en una columna centrada.
 */
export function PaginaAyuda({ titulo, children, otra }: { titulo: string; children: ReactNode; otra: { href: string; texto: string } }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col bg-background lg:max-w-[88rem]">
      <header className={`flex h-12 shrink-0 items-center justify-between ${PAD}`}>
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
      <main className={`mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4 pb-12 ${PAD}`}>
        <h1 className="font-heading text-[1.7rem] leading-tight font-extrabold tracking-tight">{titulo}</h1>
        {children}
        <Link href={otra.href} className="self-start text-sm font-bold text-primary hover:underline">
          {otra.texto}
        </Link>
      </main>
    </div>
  );
}
