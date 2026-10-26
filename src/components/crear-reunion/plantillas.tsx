"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Plantilla } from "@/lib/reunion";

type Props = {
  plantillas: Plantilla[];
  elegida: number;
  onElegir: (indice: number) => void;
};

/**
 * Fila de plantillas que se desliza sin barra de desplazamiento.
 * Los bordes se difuminan donde hay más para ver, y una línea fina debajo muestra cuánto falta.
 * Con el mouse también se puede arrastrar.
 */
export function Plantillas({ plantillas, elegida, onElegir }: Props) {
  const lista = useRef<HTMLDivElement>(null);
  const arrastre = useRef({ activo: false, x0: 0, s0: 0, movio: false });
  const [medidas, setMedidas] = useState({ izq: false, der: false, ancho: 100, pos: 0 });

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const medir = () => {
      const max = el.scrollWidth - el.clientWidth;
      setMedidas({
        izq: el.scrollLeft > 2,
        der: max > 0 && el.scrollLeft < max - 2,
        ancho: max > 0 ? (el.clientWidth / el.scrollWidth) * 100 : 100,
        pos: max > 0 ? (el.scrollLeft / el.scrollWidth) * 100 : 0,
      });
    };
    el.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir); // también mide la primera vez
    observador.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [plantillas.length]);

  const termina = () => {
    arrastre.current.activo = false;
  };

  return (
    <div className="-mx-1 px-1">
      <div
        ref={lista}
        role="group"
        aria-label="Plantillas"
        style={{ "--fl": medidas.izq ? "28px" : "0px", "--fr": medidas.der ? "44px" : "0px" } as CSSProperties}
        className="flex cursor-grab gap-1.5 overflow-x-auto py-0.5 [-webkit-mask-image:linear-gradient(to_right,transparent_0,#000_var(--fl),#000_calc(100%-var(--fr)),transparent_100%)] [mask-image:linear-gradient(to_right,transparent_0,#000_var(--fl),#000_calc(100%-var(--fr)),transparent_100%)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={(e) => {
          const el = lista.current;
          if (e.pointerType !== "mouse" || !el) return;
          arrastre.current = { activo: true, x0: e.clientX, s0: el.scrollLeft, movio: false };
        }}
        onPointerMove={(e) => {
          const el = lista.current;
          const a = arrastre.current;
          if (!a.activo || !el) return;
          const dx = e.clientX - a.x0;
          if (Math.abs(dx) > 4) a.movio = true;
          el.scrollLeft = a.s0 - dx;
        }}
        onPointerUp={termina}
        onPointerLeave={termina}
        onClickCapture={(e) => {
          if (arrastre.current.movio) {
            e.stopPropagation();
            e.preventDefault();
            arrastre.current.movio = false;
          }
        }}
      >
        {plantillas.map((p, i) => (
          <Button
            key={p.nombre}
            type="button"
            variant="outline"
            aria-pressed={elegida === i}
            title={p.detalle}
            className={`h-9 shrink-0 rounded-full px-3 text-[0.8125rem] ${
              elegida === i ? "border-primary bg-accent font-semibold text-accent-foreground" : ""
            }`}
            onClick={() => onElegir(i)}
          >
            {p.nombre}
          </Button>
        ))}
      </div>
      <div
        aria-hidden="true"
        className={`relative mx-0.5 mt-1.5 h-[3px] rounded-full bg-secondary transition-opacity ${
          medidas.ancho < 100 ? "opacity-100" : "opacity-0"
        }`}
      >
        <i
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{ width: `${medidas.ancho}%`, left: `${medidas.pos}%` }}
        />
      </div>
    </div>
  );
}
