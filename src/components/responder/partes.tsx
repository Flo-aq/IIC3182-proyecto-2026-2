"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { type Columna, etiquetaRango } from "@/lib/reunion/respuestas";

export const PESTANAS = ["Mi horario", "Respuestas", "Compartir"] as const;

export function Encabezado({ titulo, pista }: { titulo: string; pista?: string }) {
  return (
    <div className="flex shrink-0 items-baseline justify-between gap-2">
      <h2 className="font-heading text-[0.95rem] font-extrabold tracking-tight">{titulo}</h2>
      {pista && <span className="text-xs text-muted-foreground">{pista}</span>}
    </div>
  );
}

/** Flechas para moverse entre semanas (la reunión de más de 7 días se ve de a una semana). */
export function NavSemana({ columnas, semana, total, onSemana }: { columnas: Columna[]; semana: number; total: number; onSemana: (s: number) => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <Button type="button" variant="outline" size="icon" className={BOTON.icono} aria-label="Semana anterior" disabled={semana === 0} onClick={() => onSemana(semana - 1)}>
        <ChevronLeft />
      </Button>
      <p className="min-w-0 text-center text-[0.8125rem] font-semibold">Semana del {etiquetaRango(columnas)}</p>
      <Button type="button" variant="outline" size="icon" className={BOTON.icono} aria-label="Semana siguiente" disabled={semana >= total - 1} onClick={() => onSemana(semana + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}
