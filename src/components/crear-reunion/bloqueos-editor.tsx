"use client";

import { Copy, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Bloqueo, type Reunion, duplicarBloqueo, etiquetaDia, repetirUltimoBloqueo } from "@/lib/reunion";
import { HoraField } from "./hora-field";

type Props = {
  reunion: Reunion;
  nuevoId: () => string;
  onChange: (bloqueos: Bloqueo[]) => void;
};

export function BloqueosEditor({ reunion, nuevoId, onChange }: Props) {
  const { bloqueos, dias } = reunion;
  const ordenados = [...dias].sort();

  const cambiar = (id: string, cambio: Partial<Bloqueo>) =>
    onChange(bloqueos.map((b) => (b.id === id ? { ...b, ...cambio } : b)));

  const itemsDia = (actual: string) => {
    const base = ordenados.map((d) => ({ value: d, label: etiquetaDia(d) }));
    if (actual && !ordenados.includes(actual)) base.unshift({ value: actual, label: etiquetaDia(actual) });
    return base.length ? base : [{ value: "ninguno", label: "Elige días primero" }];
  };

  return (
    <div className="flex flex-col gap-2">
      {bloqueos.length === 0 && (
        <p className="text-sm text-muted-foreground">Ningún horario bloqueado. Por ejemplo, el almuerzo.</p>
      )}
      {bloqueos.map((b, i) => (
        <div key={b.id} className="flex flex-col gap-2 rounded-2xl border bg-background p-2">
          <div className="flex items-center gap-1">
            <Select
              items={itemsDia(b.dia)}
              value={b.dia || "ninguno"}
              onValueChange={(v) => v && cambiar(b.id, { dia: v === "ninguno" ? "" : v })}
            >
              <SelectTrigger className="h-11 flex-1 rounded-xl px-3 text-base" aria-label="Día del bloqueo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsDia(b.dia).map((it) => (
                  <SelectItem key={it.value} value={it.value}>
                    {it.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              className="size-11 text-accent-foreground"
              aria-label="Duplicar esta regla"
              title="Duplicar"
              onClick={() => onChange(duplicarBloqueo(reunion, i, nuevoId))}
            >
              <Copy />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="size-11 text-muted-foreground"
              aria-label="Quitar esta regla"
              onClick={() => onChange(bloqueos.filter((x) => x.id !== b.id))}
            >
              <X />
            </Button>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <HoraField value={b.desde} onChange={(v) => cambiar(b.id, { desde: v })} label="Bloquear desde" />
            <span aria-hidden="true" className="text-muted-foreground">
              –
            </span>
            <HoraField value={b.hasta} onChange={(v) => cambiar(b.id, { hasta: v })} label="Bloquear hasta" />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="h-11 justify-start gap-1.5 px-1 font-semibold text-accent-foreground"
        onClick={() =>
          onChange([...bloqueos, { id: nuevoId(), dia: ordenados[0] ?? "", desde: "13:00", hasta: "14:00" }])
        }
      >
        <Plus />
        Bloquear un horario
      </Button>
      {bloqueos.length > 0 && dias.length > 1 && (
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start gap-1.5 px-1 font-semibold text-accent-foreground"
          onClick={() => onChange(repetirUltimoBloqueo(reunion, nuevoId))}
        >
          <Copy />
          Repetir la última regla en todos los días
        </Button>
      )}
    </div>
  );
}
