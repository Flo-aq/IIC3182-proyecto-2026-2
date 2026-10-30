"use client";

import { PAGINA } from "@/lib/utilidades/estilos";
import { useEffect, useState } from "react";

import { BarraSuperior } from "@/components/comunes/barra-superior";
import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { cargarPlantillas, cargarReuniones } from "@/lib/api/cuenta";
import type { ReunionDePerfil } from "@/lib/cuenta/perfil";
import type { PlantillaDeCuenta } from "@/lib/cuenta/plantillas";
import { useSesion } from "@/lib/cuenta/sesion";
import { Perfil } from "./perfil";
import { PerfilSinCuenta } from "./perfil-sin-cuenta";

type Datos = { reuniones: ReunionDePerfil[]; plantillas: PlantillaDeCuenta[] };

/**
 * El perfil solo se abre con una cuenta (ver lib/cuenta/sesion.ts): sin ella, se pide iniciar sesión.
 * Las reuniones y plantillas vienen de GET /api/me/events y GET /api/me/templates.
 */
export function PerfilConSesion() {
  const { conCuenta, cargando } = useSesion();
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!conCuenta) return;
    let vigente = true;
    Promise.all([cargarReuniones(), cargarPlantillas()])
      .then(([reuniones, plantillas]) => {
        if (!vigente) return;
        setError(null);
        setDatos({ reuniones, plantillas });
      })
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [conCuenta, intento]);

  if (cargando) return <div className="h-dvh bg-background" />;
  if (!conCuenta) return <PerfilSinCuenta />;

  if (error && !datos) {
    return (
      <div className={PAGINA}>
        <BarraSuperior />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" className={`${BOTON.secundario} px-6`} onClick={() => { setError(null); setIntento((n) => n + 1); }}>
            Reintentar
          </Button>
        </main>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className={PAGINA}>
        <BarraSuperior />
        <main className="flex flex-1 items-center justify-center pb-16 text-sm text-muted-foreground" aria-live="polite">
          Cargando tu perfil…
        </main>
      </div>
    );
  }

  return <Perfil reunionesIniciales={datos.reuniones} plantillasIniciales={datos.plantillas} />;
}
