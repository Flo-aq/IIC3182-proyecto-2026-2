"use client";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { cantidad } from "@/lib/utilidades/plural";

type Props = {
  /** Con cuenta no se pasa por la pantalla de acceso, así que aquí se declara si eres integrante clave (solo la primera vez). */
  pideClave: boolean;
  clave: boolean;
  onClave: (clave: boolean) => void;
  marcados: number;
  bloqueMin: number;
  textoHoras: string;
  /** Todavía no se guardó nada. */
  sinGuardar: boolean;
  sinCambios: boolean;
  guardando: boolean;
  onGuardar: () => void;
};

/** Lo que va bajo la grilla de Mi horario: cuánto marcaste y el botón de guardar. */
export function PieGuardar({ pideClave, clave, onClave, marcados, bloqueMin, textoHoras, sinGuardar, sinCambios, guardando, onGuardar }: Props) {
  return (
    <>
      {pideClave && (
        <label className="mb-2 flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm">
          <input type="checkbox" checked={clave} className="size-5 shrink-0 accent-primary" onChange={(e) => onClave(e.target.checked)} />
          <span>
            <b className="font-semibold">Soy integrante clave</b>
            <span className="block text-xs text-muted-foreground">Solo si la reunión depende de ti.</span>
          </span>
        </label>
      )}
      <p className="mb-1.5 text-center text-xs text-muted-foreground">
        {cantidad(marcados, "bloque", "bloques")} de {bloqueMin} min · {textoHoras}
      </p>
      <Button className={`${BOTON.principal} w-full`} disabled={(marcados === 0 && sinGuardar) || guardando} onClick={onGuardar}>
        {guardando ? "Guardando…" : sinGuardar ? "Guardar mis horarios" : sinCambios ? "Guardado ✓" : "Guardar cambios"}
      </Button>
    </>
  );
}
