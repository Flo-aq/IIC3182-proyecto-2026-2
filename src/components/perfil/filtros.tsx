"use client";

import { ArrowDown, ArrowUp, Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { type Orden, TIPOS, type Tipo } from "@/lib/perfil";

type Props = {
  /** Cuántas reuniones hay de cada tipo (sin contar los tags elegidos). */
  conteoTipos: Record<Tipo, number>;
  tipo: Tipo;
  onTipo: (tipo: Tipo) => void;
  orden: Orden;
  /** Pide ordenar por esta clave; si ya se ordenaba así, invierte el sentido. */
  onOrden: (clave: Orden["clave"]) => void;
  tags: string[];
  conteoTags: Record<string, number>;
  activos: string[];
  onTag: (tag: string) => void;
};

const Seccion = ({ titulo, children }: { titulo: string; children: ReactNode }) => (
  <section className="flex flex-col gap-1.5">
    <h3 className="px-1 text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">{titulo}</h3>
    {children}
  </section>
);

function SelectorOrden({ orden, onOrden }: Pick<Props, "orden" | "onOrden">) {
  return (
    <div role="group" aria-label="Ordenar por" className="inline-flex w-fit gap-0.5 rounded-full bg-pista p-0.5">
      {(["fecha", "nombre"] as const).map((clave) => {
        const activo = orden.clave === clave;
        const Flecha = orden.sentido === "asc" ? ArrowUp : ArrowDown;
        return (
          <button
            key={clave}
            type="button"
            aria-pressed={activo}
            onClick={() => onOrden(clave)}
            className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3.5 text-[0.8125rem] font-semibold text-muted-foreground", activo && "bg-background text-foreground shadow-sm")}
          >
            {clave === "fecha" ? "Fecha" : "Nombre"}
            {activo && <Flecha aria-hidden="true" className="size-3.5" />}
          </button>
        );
      })}
    </div>
  );
}

/** La barra lateral de filtros de las pantallas anchas: siempre a la vista. */
export function FiltrosLateral({ conteoTipos, tipo, onTipo, orden, onOrden, tags, conteoTags, activos, onTag }: Props) {
  const fila = (activa: boolean) =>
    cn("flex h-9 items-center justify-between gap-2 rounded-xl px-3 text-left text-sm font-semibold", activa ? "bg-accent text-primary" : "hover:bg-muted");
  return (
    <nav aria-label="Filtros" className="flex flex-col gap-5">
      <Seccion titulo="Mostrar">
        <div className="flex flex-col gap-0.5">
          {TIPOS.map((t) => (
            <button key={t.valor} type="button" aria-pressed={tipo === t.valor} className={fila(tipo === t.valor)} onClick={() => onTipo(t.valor)}>
              {t.texto}
              <span className="text-xs font-medium text-muted-foreground">{conteoTipos[t.valor]}</span>
            </button>
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Ordenar por:">
        <div className="px-1">
          <SelectorOrden orden={orden} onOrden={onOrden} />
        </div>
      </Seccion>
      <Seccion titulo="Tags">
        {tags.length ? (
          <div className="flex flex-col gap-0.5">
            {tags.map((t) => (
              <button key={t} type="button" aria-pressed={activos.includes(t)} className={fila(activos.includes(t))} onClick={() => onTag(t)}>
                <span className="truncate"># {t}</span>
                <span className="text-xs font-medium text-muted-foreground">{conteoTags[t]}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 text-sm text-muted-foreground">Todavía no tienes tags.</p>
        )}
      </Seccion>
    </nav>
  );
}

/** El contenido de la hoja de filtros del celular. */
export function FiltrosHoja({ conteoTipos, tipo, onTipo, orden, onOrden, tags, conteoTags, activos, onTag }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <Seccion titulo="Mostrar">
        <div role="radiogroup" aria-label="Mostrar" className="flex flex-col">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              type="button"
              role="radio"
              aria-checked={tipo === t.valor}
              onClick={() => onTipo(t.valor)}
              className={cn("flex min-h-11 items-center gap-2 border-b px-1 text-left text-[0.9375rem] font-semibold last:border-b-0", tipo === t.valor && "text-primary")}
            >
              <span className="flex-1">{t.texto}</span>
              <span className="text-[0.8125rem] font-medium text-muted-foreground">{conteoTipos[t.valor]}</span>
              <span className="w-[1.125rem]">{tipo === t.valor && <Check aria-hidden="true" className="size-[1.125rem]" />}</span>
            </button>
          ))}
        </div>
      </Seccion>
      <Seccion titulo="Ordenar por:">
        <div className="px-1">
          <SelectorOrden orden={orden} onOrden={onOrden} />
        </div>
      </Seccion>
      <Seccion titulo="Tags">
        {tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={activos.includes(t)}
                onClick={() => onTag(t)}
                className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[0.8125rem] font-semibold", activos.includes(t) && "border-primary bg-primary text-primary-foreground")}
              >
                {t}
                <span className={cn("text-[0.6875rem] font-bold", activos.includes(t) ? "text-primary-foreground/80" : "text-muted-foreground")}>{conteoTags[t]}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 text-sm text-muted-foreground">Todavía no tienes tags.</p>
        )}
      </Seccion>
    </div>
  );
}
