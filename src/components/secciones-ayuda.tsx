"use client";

import { type ReactNode, useEffect, useId, useState } from "react";

import { cn } from "@/lib/utils";

export type SeccionAyuda = { id: string; corto: string; contenido: ReactNode };

/**
 * El contenido de una página de ayuda separado en secciones, una por pantalla de la aplicación: se ve una a la vez, para no
 * saturar. La sección elegida queda en la dirección (por ejemplo, /how-to#perfil), así que se puede enlazar a una sección,
 * pero la página es siempre la misma.
 */
export function SeccionesAyuda({ secciones }: { secciones: SeccionAyuda[] }) {
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
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Pantallas" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2">
        {secciones.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`${base}-t-${s.id}`}
            aria-selected={activa === s.id}
            aria-controls={`${base}-p-${s.id}`}
            onClick={() => elegir(s.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border-[1.5px] px-4 text-[0.8125rem] font-bold",
              activa === s.id ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.corto}
          </button>
        ))}
      </div>
      {secciones.map((s) => (
        <div key={s.id} role="tabpanel" id={`${base}-p-${s.id}`} aria-labelledby={`${base}-t-${s.id}`} hidden={activa !== s.id}>
          {s.contenido}
        </div>
      ))}
    </div>
  );
}
