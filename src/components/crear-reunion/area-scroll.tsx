"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  /** Clases del contenedor externo (tamaño dentro de un flex, por ejemplo). */
  className?: string;
  /** Clases del área que se desliza (alto máximo, relleno). */
  areaClassName?: string;
  label?: string;
  /** Difumina los bordes donde hay más para ver. Se apaga cuando dentro hay elementos fijos (sticky) que no deben difuminarse. */
  bordes?: boolean;
};

/**
 * Área con scroll vertical sin barra de desplazamiento, como la fila de plantillas:
 * los bordes se difuminan donde hay más para ver y una línea fina gris a la derecha muestra cuánto falta.
 */
export function AreaScroll({ children, className = "", areaClassName = "", label, bordes = true }: Props) {
  const area = useRef<HTMLDivElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ arriba: false, abajo: false, alto: 100, pos: 0 });

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const medir = () => {
      const max = el.scrollHeight - el.clientHeight;
      setM({
        arriba: el.scrollTop > 2,
        abajo: max > 0 && el.scrollTop < max - 2,
        alto: max > 0 ? (el.clientHeight / el.scrollHeight) * 100 : 100,
        pos: max > 0 ? (el.scrollTop / el.scrollHeight) * 100 : 0,
      });
    };
    el.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir); // mide la primera vez y cuando cambia el tamaño del área o del contenido
    observador.observe(el);
    if (contenido.current) observador.observe(contenido.current);
    return () => {
      el.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, []);

  const desborda = m.alto < 100;

  return (
    <div className={`relative flex flex-col ${className}`}>
      <div
        ref={area}
        role={label ? "group" : undefined}
        aria-label={label}
        tabIndex={desborda ? 0 : undefined}
        style={{ "--ft": m.arriba ? "24px" : "0px", "--fb": m.abajo ? "36px" : "0px" } as CSSProperties}
        className={`min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          bordes
            ? "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0,#000_var(--ft),#000_calc(100%-var(--fb)),transparent_100%)] [mask-image:linear-gradient(to_bottom,transparent_0,#000_var(--ft),#000_calc(100%-var(--fb)),transparent_100%)]"
            : ""
        } ${areaClassName}`}
      >
        <div ref={contenido}>{children}</div>
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-2 right-1 w-[3px] rounded-full bg-secondary transition-opacity ${
          desborda ? "opacity-100" : "opacity-0"
        }`}
      >
        <i className="absolute inset-x-0 rounded-full bg-muted-foreground" style={{ height: `${m.alto}%`, top: `${m.pos}%` }} />
      </div>
    </div>
  );
}
