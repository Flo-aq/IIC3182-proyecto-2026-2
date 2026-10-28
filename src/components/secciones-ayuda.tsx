"use client";

import { type ReactNode, useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

export type SeccionAyuda = { id: string; corto: string; contenido: ReactNode };

/**
 * El contenido de una página de ayuda separado en secciones, una por pantalla de la aplicación: se ve una a la vez, para no
 * saturar. La sección elegida queda en la dirección (por ejemplo, /how-to#perfil), así que se puede enlazar a una sección,
 * pero la página es siempre la misma.
 *
 * La cabecera (`encabezado`: la barra de arriba, el título y la introducción) y las pestañas quedan fijas al hacer scroll.
 * Las pestañas se dibujan también en el servidor, para que aparezcan junto con el resto de la página al recargar; la
 * sección de la dirección la elige antes de pintar un script que va en `pie` (ver PaginaAyuda).
 */
export function SeccionesAyuda({
  secciones,
  encabezado,
  claseAncho,
  pie,
}: {
  secciones: SeccionAyuda[];
  encabezado: ReactNode;
  /** Clases del ancho y los márgenes del contenido, iguales a las del encabezado. */
  claseAncho: string;
  pie?: ReactNode;
}) {
  const base = useId();
  const [activa, setActiva] = useState(secciones[0].id);

  // La sección de la dirección solo se conoce en el navegador: se lee al abrir y cada vez que cambia.
  useEffect(() => {
    const leer = () => {
      const id = window.location.hash.slice(1);
      if (secciones.some((s) => s.id === id)) setActiva(id);
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, [secciones]);

  const elegir = (id: string) => {
    setActiva(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-background">
        {encabezado}
        <div className={cn("pt-2 pb-1", claseAncho)}>
          <div
            role="tablist"
            aria-label="Pantallas"
            className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2"
          >
            {secciones.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`${base}-t-${s.id}`}
                aria-selected={activa === s.id}
                aria-controls={`${base}-p-${s.id}`}
                // Un script de PaginaAyuda ya marcó la pestaña de la dirección antes de pintar.
                data-pestana-ayuda={s.id}
                suppressHydrationWarning
                onClick={() => elegir(s.id)}
                className="h-9 shrink-0 rounded-full border-[1.5px] px-4 text-[0.8125rem] font-bold aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-foreground aria-[selected=false]:text-muted-foreground aria-[selected=false]:hover:text-foreground"
              >
                {s.corto}
              </button>
            ))}
          </div>
        </div>
      </div>
      <main className={cn("flex flex-col gap-6 pt-3 pb-12", claseAncho)}>
        <div className="flex flex-col gap-4">
          {secciones.map((s) => (
            <div
              key={s.id}
              role="tabpanel"
              id={`${base}-p-${s.id}`}
              aria-labelledby={`${base}-t-${s.id}`}
              hidden={activa !== s.id}
              data-seccion-ayuda={s.id}
              suppressHydrationWarning
            >
              {s.contenido}
            </div>
          ))}
        </div>
        {pie}
      </main>
    </>
  );
}
