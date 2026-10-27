import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

/** El marco de las páginas de ayuda (How to y FAQ): logo para volver al inicio, botón de crear reunión y el contenido. */
export function PaginaAyuda({ titulo, children, otra }: { titulo: string; children: ReactNode; otra: { href: string; texto: string } }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background md:max-w-xl">
      <header className={`flex h-12 shrink-0 items-center justify-between ${PAD}`}>
        <Link href="/" className="flex items-center gap-1" aria-label="WeMeet, ir al inicio">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">WeMeet</span>
        </Link>
        <Link href="/" className={buttonVariants({ className: "h-9 gap-1.5 rounded-full px-3.5 font-bold" })}>
          <Plus />
          Crear reunión
        </Link>
      </header>
      <main className={`flex flex-col gap-5 pt-3 pb-10 ${PAD}`}>
        <h1 className="font-heading text-[1.7rem] leading-tight font-extrabold tracking-tight">{titulo}</h1>
        {children}
        <Link href={otra.href} className="self-start text-sm font-bold text-primary hover:underline">
          {otra.texto}
        </Link>
      </main>
    </div>
  );
}
