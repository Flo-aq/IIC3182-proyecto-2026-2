"use client";

import { type CSSProperties, useEffect, useRef } from "react";

import { type Reunion, desdeIso } from "@/lib/reunion";
import {
  COLUMNAS_VISIBLES,
  type Columna,
  type PersonaSet,
  claveBloque,
  colorClave,
  colorGris,
  horaDeFila,
  mesCorto,
  totalFilas,
} from "@/lib/respuestas";

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const FILA_MIN = 16;
const COLUMNA_MIN = 44;
const ETIQUETAS = 30;

const RAYAS_BLOQUEO = "repeating-linear-gradient(135deg, rgb(207 199 187) 0 3px, transparent 3px 7px)";
const ALTO_DIA = 34;

type Props = {
  reunion: Reunion;
  columnas: Columna[];
  bloqueados: Record<string, boolean[]>;
  modo: "mia" | "grupo";
  /** Modo "mia": los bloques que marqué y cómo cambiarlos. */
  mias?: Set<string>;
  onCambiar?: (claves: string[], poner: boolean) => void;
  /** Si es true, arrastrar pinta; si no, arrastrar desplaza y un toque pinta de a un bloque. */
  arrastrar?: boolean;
  /** Modo "grupo": las personas que respondieron, para colorear. */
  personas?: PersonaSet[];
  fijado?: string | null;
  onFijar?: (clave: string | null) => void;
  onVer?: (clave: string | null) => void;
  /** Avisa si la grilla no cabe y hay que desplazarla (caso borde). */
  onDesborda?: (desborda: boolean) => void;
};

/**
 * La grilla de días y horas. Las filas y las columnas se estiran para llenar el espacio:
 * si caben, no hay scroll; si no, se desplaza y los días y las horas quedan fijos.
 * Con más de 5 columnas, las 5 primeras ocupan todo el ancho y el resto se ve con scroll.
 */
export function Grilla({ reunion: r, columnas, bloqueados, modo, mias, onCambiar, arrastrar = true, personas, fijado, onFijar, onVer, onDesborda }: Props) {
  const caja = useRef<HTMLDivElement>(null);
  const pintando = useRef<{ poner: boolean } | null>(null);
  const filas = totalFilas(r);

  useEffect(() => {
    const el = caja.current;
    if (!el || !onDesborda) return;
    const medir = () => onDesborda(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    if (el.firstElementChild) observador.observe(el.firstElementChild);
    return () => observador.disconnect();
  }, [filas, columnas.length, onDesborda]);

  const normales = personas?.filter((p) => !p.clave) ?? [];
  const claves = personas?.filter((p) => p.clave) ?? [];

  /** Estado de un bloque para decidir las esquinas redondeadas: los tramos seguidos se ven como una sola barra. */
  const estado = (c: Columna, fila: number): string => {
    if (!c.activa) return "x";
    if (bloqueados[c.dia]?.[fila]) return "b";
    return modo === "mia" && mias?.has(claveBloque(c.dia, fila)) ? "s" : "e";
  };

  const ancho =
    columnas.length > COLUMNAS_VISIBLES
      ? `calc((100cqw - ${ETIQUETAS}px) / ${COLUMNAS_VISIBLES})`
      : `minmax(${COLUMNA_MIN}px, 1fr)`;

  const celdaDe = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-c]") ?? null;

  const celdas = [];
  for (let f = 0; f < filas; f++) {
    const hora = horaDeFila(r, f);
    const enHora = hora.endsWith(":00");
    celdas.push(
      <div
        key={`h${f}`}
        className={`sticky left-0 z-[1] bg-background pr-1.5 text-right text-[10.5px] leading-none text-muted-foreground tabular-nums ${f === 0 ? "pt-0.5" : "-translate-y-[5px]"}`}
      >
        {enHora ? hora.slice(0, 2) : ""}
      </div>,
    );
    columnas.forEach((c, i) => {
      const k = claveBloque(c.dia, f);
      const e = estado(c, f);
      const antes = f > 0 ? estado(c, f - 1) : null;
      const despues = f < filas - 1 ? estado(c, f + 1) : null;
      const arriba = f === 0 || (e !== "e" && e !== "x" && antes !== e);
      const abajo = f === filas - 1 || (e !== "e" && e !== "x" && despues !== e);
      const estilo: CSSProperties = {
        borderTopLeftRadius: arriba ? 8 : 0,
        borderTopRightRadius: arriba ? 8 : 0,
        borderBottomLeftRadius: abajo ? 8 : 0,
        borderBottomRightRadius: abajo ? 8 : 0,
        boxShadow: f > 0 && enHora && !arriba ? "inset 0 1px 0 var(--background)" : undefined,
      };
      const clave = `c${f}-${i}`;
      if (e === "x") {
        // Un día que no es de la encuesta: del mismo color que el fondo, sin interacción (no se puede rellenar).
        celdas.push(<div key={clave} aria-hidden="true" className={modo === "mia" ? "cursor-not-allowed" : ""} />);
        return;
      }
      if (e === "b") {
        // Un bloque bloqueado: el cursor avisa que no se puede rellenar.
        celdas.push(<div key={clave} aria-hidden="true" className="cursor-not-allowed bg-pista-bloqueo" style={{ ...estilo, backgroundImage: RAYAS_BLOQUEO }} />);
        return;
      }
      if (modo === "mia") {
        celdas.push(
          <div
            key={clave}
            data-c={k}
            className={`cursor-pointer ${e === "s" ? "bg-primary" : "bg-pista"}`}
            style={estilo}
            aria-label={`${DIAS[desdeIso(c.dia).getDay()]} ${desdeIso(c.dia).getDate()} ${hora}`}
            onClick={() => {
              if (!arrastrar) onCambiar?.([k], e !== "s");
            }}
          />,
        );
        return;
      }
      const lista = personas ?? [];
      const n = normales.filter((p) => p.puede(c.dia, f)).length;
      const todosClave = claves.length > 0 && claves.every((p) => p.puede(c.dia, f));
      const color = todosClave ? colorClave(n, normales.length) : colorGris(n, normales.length);
      celdas.push(
        <div
          key={clave}
          role="button"
          tabIndex={-1}
          className={`cursor-pointer bg-pista ${fijado === k ? "outline-2 -outline-offset-2 outline-foreground" : ""}`}
          style={{ ...estilo, backgroundColor: color || undefined }}
          aria-label={`${DIAS[desdeIso(c.dia).getDay()]} ${desdeIso(c.dia).getDate()} ${hora}: pueden ${lista.filter((p) => p.puede(c.dia, f)).length} de ${lista.length}`}
          onPointerEnter={(ev) => {
            if (ev.pointerType === "mouse") onVer?.(k);
          }}
          onPointerLeave={(ev) => {
            if (ev.pointerType === "mouse") onVer?.(null);
          }}
          onClick={() => onFijar?.(fijado === k ? null : k)}
        />,
      );
    });
  }

  return (
    <div ref={caja} className="h-full overflow-auto [container-type:inline-size] [scrollbar-width:thin]">
      <div
        className="grid min-h-full select-none"
        style={{
          gridTemplateColumns: `${ETIQUETAS}px repeat(${columnas.length}, ${ancho})`,
          gridTemplateRows: `${ALTO_DIA}px repeat(${filas}, minmax(${FILA_MIN}px, 1fr))`,
          columnGap: 4,
          touchAction: modo === "mia" && arrastrar ? "none" : undefined,
        }}
        onPointerDown={(e) => {
          if (modo !== "mia" || !arrastrar || !mias) return;
          const c = (e.target as HTMLElement).closest<HTMLElement>("[data-c]");
          if (!c) return;
          const poner = !mias.has(c.dataset.c!);
          pintando.current = { poner };
          onCambiar?.([c.dataset.c!], poner);
          e.preventDefault();
        }}
        onPointerMove={(e) => {
          if (!pintando.current) return;
          const c = celdaDe(e.clientX, e.clientY);
          if (c) onCambiar?.([c.dataset.c!], pintando.current.poner);
        }}
        onPointerUp={() => (pintando.current = null)}
        onPointerCancel={() => (pintando.current = null)}
      >
        <div className="sticky top-0 left-0 z-[3] bg-background" />
        {columnas.map((c) => {
          const d = desdeIso(c.dia);
          return (
            <div
              key={c.dia}
              className={`sticky top-0 z-[2] flex flex-col items-center justify-center bg-background leading-[1.1] ${c.activa ? "" : "opacity-35"}`}
            >
              <span className="text-[11px] font-bold text-muted-foreground">{DIAS[d.getDay()]}</span>
              <b className="font-heading text-[15px] whitespace-nowrap">
                {d.getDate()}
                <small className="ml-0.5 font-sans text-[9.5px] font-semibold text-muted-foreground">{mesCorto(c.dia)}</small>
              </b>
            </div>
          );
        })}
        {celdas}
      </div>
    </div>
  );
}
