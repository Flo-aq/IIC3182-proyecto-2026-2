"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";

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
} from "@/lib/reunion/respuestas";

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const FILA_MIN = 16;
const COLUMNA_MIN = 44;
const ETIQUETAS = 30;
/** Espacio entre columnas (px). */
const ESPACIO = 4;
/** Ancho mínimo que debe tener cada columna para mostrar 7 días en vez de 5 (px). */
const COLUMNA_ANCHA = 52;

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
  /** Versión chica para pantallas anchas. */
  compacta?: boolean;
  /** Muestra todos los días a lo ancho (hasta 7) sin desplazar, aunque las columnas queden más angostas. */
  todosLosDias?: boolean;
};

/**
 * La grilla de días y horas. Las filas y las columnas se estiran para llenar el espacio:
 * si caben, no hay scroll; si no, se desplaza y los días y las horas quedan fijos.
 * Con más de 5 columnas, las 5 primeras ocupan todo el ancho y el resto se ve con scroll, salvo que quepan más con un ancho cómodo.
 */
export function Grilla({ reunion: r, columnas, bloqueados, modo, mias, onCambiar, arrastrar = true, personas, fijado, onFijar, onVer, onDesborda, compacta = false, todosLosDias = false }: Props) {
  const ajustarAncho = compacta || todosLosDias;
  // En una pantalla ancha, Respuestas se ve más chica (solo se mira, no se rellena): filas y columnas más finas.
  // Las filas miden lo mismo que en Mi horario (si no caben todas las horas, se desplaza); los días siempre caben a lo ancho.
  const filaMin = FILA_MIN;
  const columnaMin = ajustarAncho ? 0 : COLUMNA_MIN;
  const etiquetas = compacta ? 24 : ETIQUETAS;
  const altoDia = compacta ? 28 : ALTO_DIA;
  // Los días y las horas quedan fijos al desplazar, así que llevan el fondo de la caja donde está la grilla.
  const fondo = compacta ? "bg-panel" : "bg-background";
  const caja = useRef<HTMLDivElement>(null);
  const [anchoCaja, setAnchoCaja] = useState(0);
  const pintando = useRef<{ poner: boolean } | null>(null);
  const filas = totalFilas(r);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medirAncho = () => setAnchoCaja(el.clientWidth);
    medirAncho();
    const observador = new ResizeObserver(medirAncho);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

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

  // Con más de 5 días (una semana completa), se ven 5 y el resto con scroll; pero si cada columna puede medir al menos COLUMNA_CASI_ANCHA, se ven los 7.
  const caben = Math.floor((anchoCaja - etiquetas + ESPACIO) / (COLUMNA_ANCHA + ESPACIO));
  const visibles = caben >= columnas.length ? columnas.length : COLUMNAS_VISIBLES;
  const ancho =
    !ajustarAncho && visibles < columnas.length
      ? `calc((100cqw - ${etiquetas}px - ${(visibles - 1) * ESPACIO}px) / ${visibles})`
      : `minmax(${columnaMin}px, 1fr)`;

  const celdaDe = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-c]") ?? null;

  const celdas = [];
  for (let f = 0; f < filas; f++) {
    const hora = horaDeFila(r, f);
    const enHora = hora.endsWith(":00");
    celdas.push(
      // El texto va en un elemento absoluto para que la hora no le dé alto mínimo a la fila: así las filas pueden achicarse.
      <div key={`h${f}`} className={`sticky left-0 z-[1] ${fondo}`}>
        {enHora && (
          <span className={`absolute right-1.5 text-[10.5px] leading-none text-muted-foreground tabular-nums ${f === 0 ? "top-0.5" : "top-0 -translate-y-[5px]"}`}>{hora.slice(0, 2)}</span>
        )}
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
    <div ref={caja} className="scroll-grueso h-full overflow-auto [container-type:inline-size]">
      <div
        className="grid min-h-full select-none"
        style={{
          gridTemplateColumns: `${etiquetas}px repeat(${columnas.length}, ${ajustarAncho ? "minmax(0, 1fr)" : ancho})`,
          gridTemplateRows: `${altoDia}px repeat(${filas}, minmax(${filaMin}px, 1fr))`,          columnGap: 4,
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
        <div className={`sticky top-0 left-0 z-[3] ${fondo}`} />
        {columnas.map((c) => {
          const d = desdeIso(c.dia);
          return (
            <div
              key={c.dia}
              className={`sticky top-0 z-[2] flex flex-col items-center justify-center ${fondo} leading-[1.1] ${c.activa ? "" : "opacity-35"}`}
            >
              <span className="text-[11px] font-bold text-muted-foreground">{DIAS[d.getDay()]}</span>
              <b className={`font-heading whitespace-nowrap ${compacta ? "text-[12.5px]" : "text-[15px]"}`}>
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
