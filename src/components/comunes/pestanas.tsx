"use client";

import type { ComponentProps, KeyboardEvent } from "react";

/**
 * La barra de pestañas, con el teclado que esperan los lectores de pantalla: las flechas pasan de una pestaña a otra
 * (activándola), Inicio y Fin van a la primera y a la última, y Tab entra solo a la pestaña elegida.
 */
export function ListaDePestanas({ onKeyDown, ...props }: ComponentProps<"div">) {
  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const pestanas = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
    const actual = pestanas.indexOf(document.activeElement as HTMLElement);
    if (actual < 0) return;
    const destino =
      e.key === "ArrowRight" ? (actual + 1) % pestanas.length
      : e.key === "ArrowLeft" ? (actual - 1 + pestanas.length) % pestanas.length
      : e.key === "Home" ? 0
      : e.key === "End" ? pestanas.length - 1
      : -1;
    if (destino < 0) return;
    e.preventDefault();
    pestanas[destino].focus();
    pestanas[destino].click();
  };
  return <div role="tablist" onKeyDown={teclado} {...props} />;
}

/** Una pestaña: lleva `aria-selected` y, para que Tab entre solo a la elegida, `tabIndex`. */
export function Pestana({ seleccionada, ...props }: Omit<ComponentProps<"button">, "role"> & { seleccionada: boolean }) {
  return <button type="button" role="tab" aria-selected={seleccionada} tabIndex={seleccionada ? 0 : -1} {...props} />;
}
