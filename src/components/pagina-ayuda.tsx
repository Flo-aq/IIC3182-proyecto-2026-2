import Link from "next/link";
import type { ReactNode } from "react";

import { BarraSuperior, PAD } from "@/components/barra-superior";
import {
  SeccionesAyuda,
  type SeccionAyuda,
} from "@/components/secciones-ayuda";
import { cn } from "@/lib/utils";

/** El ancho del contenido: crece con la pantalla en vez de quedarse en una columna angosta. */
const ANCHO = "mx-auto w-full max-w-2xl md:max-w-3xl lg:max-w-5xl";

/**
 * Elige la sección y la pestaña de la dirección (por ejemplo, /how-to#perfil) antes de que el navegador pinte. El servidor
 * no conoce el `#`, así que sin esto se vería un instante la primera sección y después saltaría a la elegida.
 */
const ELEGIR_SECCION = `(function(){var h=location.hash.slice(1);var p=document.querySelectorAll('[data-seccion-ayuda]');var ok=false;p.forEach(function(e){if(e.getAttribute('data-seccion-ayuda')===h)ok=true});if(!ok)return;p.forEach(function(e){e.hidden=e.getAttribute('data-seccion-ayuda')!==h});document.querySelectorAll('[data-pestana-ayuda]').forEach(function(e){e.setAttribute('aria-selected',String(e.getAttribute('data-pestana-ayuda')===h))})})()`;

const Titulo = ({ titulo, intro }: { titulo: string; intro?: string }) => (
  <>
    <h1 className="font-heading text-[1.7rem] leading-tight font-extrabold tracking-tight">
      {titulo}
    </h1>
    {intro && <p className="text-sm text-muted-foreground">{intro}</p>}
  </>
);

/**
 * El marco de las páginas de ayuda (How to y FAQ): la barra de arriba compartida y el contenido en una columna centrada.
 * Con `secciones`, la barra, el título, la introducción y las pestañas quedan fijos arriba al hacer scroll y el contenido
 * se ve de a una sección; sin ellas, el contenido va en `children`.
 */
export function PaginaAyuda({
  titulo,
  intro,
  secciones,
  children,
  otra,
}: {
  titulo: string;
  intro?: string;
  secciones?: SeccionAyuda[];
  children?: ReactNode;
  otra: { href: string; texto: string };
}) {
  const enlace = (
    <Link
      href={otra.href}
      className="self-start text-sm font-bold text-primary hover:underline"
    >
      {otra.texto}
    </Link>
  );
  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col bg-background lg:max-w-[88rem]">
      {secciones ? (
        <SeccionesAyuda
          secciones={secciones}
          claseAncho={cn(ANCHO, PAD)}
          encabezado={
            <>
              <BarraSuperior />
              <div className={cn("flex flex-col gap-1 pt-4", ANCHO, PAD)}>
                <Titulo titulo={titulo} intro={intro} />
              </div>
            </>
          }
          pie={
            <>
              {enlace}
              <script dangerouslySetInnerHTML={{ __html: ELEGIR_SECCION }} />
            </>
          }
        />
      ) : (
        <>
          <BarraSuperior />
          <div className={cn("flex flex-col gap-1 pt-4 pb-2", ANCHO, PAD)}>
            <Titulo titulo={titulo} intro={intro} />
          </div>
          <main className={cn("flex flex-col gap-6 pt-3 pb-12", ANCHO, PAD)}>
            {children}
            {enlace}
          </main>
        </>
      )}
    </div>
  );
}
