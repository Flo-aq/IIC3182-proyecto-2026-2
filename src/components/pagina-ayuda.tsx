import Link from "next/link";
import type { ReactNode } from "react";

import { BarraSuperior, PAD } from "@/components/barra-superior";

/**
 * El marco de las páginas de ayuda (How to y FAQ): la barra de arriba compartida y el contenido en una columna centrada.
 */
export function PaginaAyuda({ titulo, children, otra }: { titulo: string; children: ReactNode; otra: { href: string; texto: string } }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col bg-background lg:max-w-[88rem]">
      <BarraSuperior />
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
