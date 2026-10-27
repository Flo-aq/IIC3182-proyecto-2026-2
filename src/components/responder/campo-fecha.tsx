"use client";

import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { es } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { aIso, desdeIso, etiquetaDia } from "@/lib/reunion";

type Props = {
  /** AAAA-MM-DD, o vacío si todavía no se elige. */
  value: string;
  onChange: (fecha: string) => void;
  label: string;
  disabled?: boolean;
  invalid?: boolean;
};

/** Elige una fecha en el calendario de siempre (el mismo de crear reunión), desde hoy en adelante. */
export function CampoFecha({ value, onChange, label, disabled, invalid }: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" disabled={disabled} aria-label={label} aria-invalid={invalid || undefined} className="h-11 w-full justify-between rounded-xl px-3 text-base font-normal" />}
      >
        <span className={`min-w-0 truncate ${value ? "" : "text-muted-foreground"}`}>{value ? `${etiquetaDia(value)} ${desdeIso(value).getFullYear()}` : "Elige la fecha"}</span>
        <CalendarDays className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[20rem] max-w-[calc(100vw-2rem)] p-3">
        <Calendar
          mode="single"
          locale={es}
          weekStartsOn={1}
          selected={value ? desdeIso(value) : undefined}
          onSelect={(d) => {
            if (d) {
              onChange(aIso(d));
              setAbierto(false);
            }
          }}
          disabled={{ before: new Date() }}
          defaultMonth={value ? desdeIso(value) : new Date()}
          className="w-full p-0 [--cell-size:--spacing(10)]"
          classNames={{ root: "w-full", month: "w-full gap-2", today: "" }}
        />
      </PopoverContent>
    </Popover>
  );
}
