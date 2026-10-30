"use client";

import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Plantilla } from "@/lib/reunion";
import { Plantillas } from "./plantillas";

type Props = {
  conCuenta: boolean;
  /** La cuenta tiene plantillas propias (las que se marcan en amarillo). */
  hayPropias: boolean;
  usar: boolean;
  onUsar: (usar: boolean) => void;
  plantillas: (Plantilla & { tags?: string[] })[];
  elegida: number;
  onElegir: (i: number) => void;
};

/** El interruptor "Usar plantilla" y, encendido, la lista de plantillas para partir de una. */
export function SeccionPlantilla({ conCuenta, hayPropias, usar, onUsar, plantillas, elegida, onElegir }: Props) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2 border-y py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <label htmlFor={id} className="text-[0.95rem] font-semibold">
            Usar plantilla
          </label>
          {/* Las plantillas en amarillo son las de la cuenta. */}
          {conCuenta && usar && hayPropias && (
            <Badge variant="lima" tamano="mini" title="Las plantillas en amarillo son tuyas">
              Tuyas
            </Badge>
          )}
        </div>
        <Switch id={id} checked={usar} onCheckedChange={onUsar} />
      </div>
      {usar && <Plantillas plantillas={plantillas} elegida={elegida} onElegir={onElegir} />}
    </div>
  );
}
