import { PAD, TITULO } from "@/lib/utilidades/estilos";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BotonCuenta } from "@/components/comunes/boton-cuenta";
import { EnlacesAyuda } from "@/components/ayuda/enlace-ayuda";
import { Logo } from "@/components/comunes/logo";
import { buttonVariants } from "@/components/ui/button";

/**
 * El aviso amarillo de arriba (8 de alto). Si una pantalla lo tiene, va siempre encima de la barra; así el logo y los
 * botones quedan en la misma posición en todas las pantallas: a 0 sin aviso y a 2 rem con aviso.
 */
export function AvisoSuperior({ children }: { children: ReactNode }) {
  return <div className="flex h-8 shrink-0 items-center justify-center bg-lime px-4 text-center text-xs font-semibold text-foreground">{children}</div>;
}

/**
 * La barra de arriba, igual en todas las pantallas (mismo alto, ancho y lugar de cada botón): logo para volver al inicio,
 * vínculos de ayuda, "+" para crear una reunión y la cuenta. `cuenta` reemplaza al botón de cuenta (por ejemplo, el menú de quien responde).
 */
export function BarraSuperior({ cuenta }: { cuenta?: ReactNode }) {
  return (
    <div className="mx-auto w-full shrink-0 lg:max-w-[88rem]">
      <header className={`flex h-12 items-center justify-between ${PAD}`}>
        <Link href="/" className="flex items-center gap-1" aria-label="WeMeet, ir al inicio">
          <Logo className="size-6 text-primary" />
          <span className={TITULO.medio}>WeMeet</span>
        </Link>
        <div className="flex items-center gap-1">
          <EnlacesAyuda />
          <Link href="/" aria-label="Crear una reunión" title="Crear una reunión" className={buttonVariants({ size: "icon", className: "size-9 rounded-full" })}>
            <Plus />
          </Link>
          {cuenta ?? <BotonCuenta />}
        </div>
      </header>
    </div>
  );
}
