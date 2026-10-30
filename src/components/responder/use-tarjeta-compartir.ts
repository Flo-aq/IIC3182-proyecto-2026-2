"use client";

import { useEffect, useRef, useState } from "react";

/** En pantalla ancha, Compartir es una tarjeta flotante que empieza cerrada y se cierra con Escape o al hacer clic afuera. */
export function useTarjetaCompartir(escritorio: boolean) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const cajaCompartir = useRef<HTMLDivElement>(null);
  const panelCompartir = useRef<HTMLElement>(null);

  // Se cierra salvo que haya un diálogo abierto, como el de Notificarme.
  useEffect(() => {
    if (!escritorio || !panelAbierto) return;
    panelCompartir.current?.focus();
    const hayDialogo = () => document.querySelector('[role="dialog"]') !== null;
    const alPulsar = (e: PointerEvent) => {
      if (hayDialogo() || cajaCompartir.current?.contains(e.target as Node)) return;
      setPanelAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || hayDialogo()) return;
      setPanelAbierto(false);
      cajaCompartir.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", alPulsar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alPulsar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [escritorio, panelAbierto]);

  return { panelAbierto, setPanelAbierto, cajaCompartir, panelCompartir };
}
