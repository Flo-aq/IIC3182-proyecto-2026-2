"use client";

import { useEffect, useState } from "react";

import { supabaseNavegador } from "@/lib/supabase/navegador";

/**
 * La sesión de la cuenta (Supabase Auth con Google). Escribir el nombre para responder una reunión no cuenta: solo un
 * inicio de sesión real da acceso al perfil, las plantillas y los tags.
 *
 * `cargando` es verdadero hasta que se lee la sesión (en el servidor siempre), para no mostrar "Sign in" un instante
 * a quien ya inició sesión.
 */
export function useSesion(): { conCuenta: boolean; nombre: string; cargando: boolean; cerrar: () => Promise<void> } {
  const [estado, setEstado] = useState<{ cargando: boolean; nombre: string | null }>({ cargando: true, nombre: null });

  useEffect(() => {
    const supabase = supabaseNavegador();
    // Avisa al suscribirse (sesión actual) y cada vez que se inicia o cierra sesión.
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      const u = sesion?.user;
      const nombre = u ? (u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? "Tu cuenta") : null;
      setEstado({ cargando: false, nombre });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return {
    conCuenta: estado.nombre !== null,
    nombre: estado.nombre ?? "",
    cargando: estado.cargando,
    cerrar: async () => {
      await supabaseNavegador().auth.signOut();
    },
  };
}

/** Dirección que inicia sesión con Google y vuelve a la ruta indicada. Es un enlace normal (no `next/link`): redirige fuera de la app. */
export const urlDeLogin = (volverA: string): string => `/auth/login?next=${encodeURIComponent(volverA)}`;
