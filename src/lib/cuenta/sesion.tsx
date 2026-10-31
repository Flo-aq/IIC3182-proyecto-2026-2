"use client";

import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

import { supabaseNavegador } from "@/lib/supabase/navegador";

type Sesion = { conCuenta: boolean; nombre: string; cerrar: () => Promise<void> };

const Contexto = createContext<Sesion | null>(null);

/**
 * La sesión de la cuenta (Supabase Auth con Google), para toda la app. Escribir el nombre para responder una reunión no
 * cuenta: solo un inicio de sesión real da acceso al perfil, las plantillas y los tags.
 *
 * Parte de lo que el servidor leyó de las cookies (`nombreInicial`), así que la primera pantalla ya sale correcta, sin
 * esperar a que el navegador consulte la sesión; después se mantiene al día con los inicios y cierres de sesión.
 */
export function SesionProvider({ nombreInicial, children }: { nombreInicial: string | null; children: ReactNode }) {
  const [nombre, setNombre] = useState<string | null>(nombreInicial);

  useEffect(() => {
    const supabase = supabaseNavegador();
    // Avisa al suscribirse (sesión actual) y cada vez que se inicia o cierra sesión.
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      const u = sesion?.user;
      setNombre(u ? (u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email ?? "Tu cuenta") : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const valor: Sesion = {
    conCuenta: nombre !== null,
    nombre: nombre ?? "",
    cerrar: async () => {
      await supabaseNavegador().auth.signOut();
    },
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): Sesion {
  const sesion = useContext(Contexto);
  if (!sesion) throw new Error("useSesion se usa dentro de SesionProvider");
  return sesion;
}

/** Dirección que inicia sesión con Google y vuelve a la ruta indicada. Es un enlace normal (no `next/link`): redirige fuera de la app. */
export const urlDeLogin = (volverA: string): string => `/auth/login?next=${encodeURIComponent(volverA)}`;
