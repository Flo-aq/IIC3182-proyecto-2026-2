"use client";

import { useEffect, useState } from "react";

import { cargarPlantillas, cargarTags } from "@/lib/api-cuenta";
import type { PlantillaDeCuenta } from "@/lib/plantillas";
import { useSesion } from "@/lib/sesion";
import { CrearReunion } from "./crear-reunion";

type Datos = { plantillas: PlantillaDeCuenta[]; tags: string[] };

/**
 * La pantalla de crear reunión con los datos de la cuenta, si la hay: sus plantillas (GET /api/me/templates) y sus tags
 * (GET /api/me/tags). La pantalla se muestra de inmediato (sin esperar) y esos datos se suman cuando llegan, sin reiniciarla.
 * Si no se pueden cargar, se crea la reunión igual, sin ellos.
 */
export function CrearReunionConCuenta() {
  const { conCuenta } = useSesion();
  const [datos, setDatos] = useState<Datos | null>(null);

  useEffect(() => {
    if (!conCuenta) return;
    let vigente = true;
    Promise.all([cargarPlantillas(), cargarTags()])
      .then(([plantillas, tags]) => vigente && setDatos({ plantillas, tags }))
      .catch(() => vigente && setDatos({ plantillas: [], tags: [] }));
    return () => {
      vigente = false;
    };
  }, [conCuenta]);

  return <CrearReunion plantillasPropias={datos?.plantillas ?? []} tagsDeLaCuenta={datos?.tags ?? []} />;
}
