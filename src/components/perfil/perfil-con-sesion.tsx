"use client";

import { useSesion } from "@/lib/sesion";
import { Perfil } from "./perfil";
import { PerfilSinCuenta } from "./perfil-sin-cuenta";

/**
 * El perfil solo se abre con una cuenta (ver lib/sesion.ts): sin ella, se pide iniciar sesión.
 * Las listas parten vacías: con la base de datos vendrán de GET /api/me/events y GET /api/me/templates.
 */
export function PerfilConSesion() {
  const { conCuenta } = useSesion();
  return conCuenta ? <Perfil reunionesIniciales={[]} plantillasIniciales={[]} /> : <PerfilSinCuenta />;
}
