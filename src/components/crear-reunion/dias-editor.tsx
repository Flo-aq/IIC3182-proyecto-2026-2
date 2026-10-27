"use client";

import { BrushCleaning } from "lucide-react";
import { es } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { aIso, desdeIso, textoCantidadDias } from "@/lib/reunion";

type Props = {
  dias: string[];
  manana: Date;
  onChange: (dias: string[]) => void;
};

export function DiasEditor({ dias, manana, onChange }: Props) {
  const ultimoMes = new Date(manana.getFullYear(), manana.getMonth() + 11, 1);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
      <Calendar
        mode="multiple"
        locale={es}
        weekStartsOn={1}
        fixedWeeks
        showOutsideDays={false}
        selected={dias.map(desdeIso)}
        onSelect={(sel) => onChange((sel ?? []).map(aIso).sort())}
        disabled={{ before: manana }}
        startMonth={manana}
        endMonth={ultimoMes}
        defaultMonth={dias.length ? desdeIso([...dias].sort()[0]) : manana}
        className="w-full p-0 [--cell-size:--spacing(11)]"
        classNames={{ root: "w-full", month: "w-full gap-2", today: "" }}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{textoCantidadDias(dias.length)}</p>
        <Button
          type="button"
          variant="ghost"
          className="h-11 shrink-0 gap-1.5 rounded-full px-3 font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          disabled={!dias.length}
          onClick={() => onChange([])}
        >
          <BrushCleaning />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
