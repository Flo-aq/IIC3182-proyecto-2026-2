"use client";

import { Clock } from "lucide-react";
import { useState } from "react";

import {
  TimePicker,
  TimePickerClear,
  TimePickerColumns,
  TimePickerConfirm,
  TimePickerContent,
  TimePickerFooter,
  TimePickerTrigger,
} from "@/components/reui/time-picker";
import { Button } from "@/components/ui/button";
import { FIN_DEL_DIA } from "@/lib/reunion";

const TEXTOS = {
  labels: {
    placeholder: "Elige la hora",
    hour: "Hora",
    minute: "Min",
    confirm: "Listo",
    panelLabel: "Elegir hora",
    openPicker: "Abrir selector de hora",
  },
};

type Props = {
  value: string;
  onChange: (hora: string) => void;
  /** Hora a la que vuelve el botón "Reset". */
  porDefecto: string;
  label: string;
  /** Primera hora que se puede elegir (inclusive). */
  min?: string;
  /** Última hora que se puede elegir (inclusive). */
  max?: string;
  /** Ofrece también el fin del día (24:00), que el selector de horas no puede mostrar: es para horas de término. */
  medianoche?: boolean;
};

/**
 * Selector de hora con columnas separadas para horas y minutos (ReUI Time Picker).
 * Sin "Ahora". "Reset" vuelve a la hora por defecto, porque la hora nunca queda vacía.
 * `min` y `max` limitan las horas disponibles (por ejemplo, "Hasta" solo ofrece horas después de "Desde").
 * Con `medianoche`, un botón extra elige 24:00 (el final del día).
 */
export function HoraField({ value, onChange, porDefecto, label, min, max, medianoche }: Props) {
  const [abierto, setAbierto] = useState(false);
  const esMedianoche = medianoche && value === FIN_DEL_DIA;
  return (
    <TimePicker
      value={esMedianoche ? "" : value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
      open={abierto}
      onOpenChange={setAbierto}
      minuteStep={5}
      min={min}
      max={max}
      i18n={TEXTOS}
      aria-label={label}
    >
      <TimePickerTrigger className="h-11 w-full rounded-xl px-3 text-base data-placeholder:text-foreground">
        {esMedianoche ? (
          <>
            <span className="flex-1 text-left">{FIN_DEL_DIA}</span>
            <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
          </>
        ) : undefined}
      </TimePickerTrigger>
      <TimePickerContent className="[&_[role=option][aria-disabled=true]]:hidden">
        <TimePickerColumns />
        <TimePickerFooter className="justify-between">
          <TimePickerClear
            disabled={value === porDefecto}
            onClick={(e) => {
              e.preventDefault();
              onChange(porDefecto);
            }}
          >
            Reset
          </TimePickerClear>
          {medianoche && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-primary"
              aria-pressed={esMedianoche}
              onClick={() => {
                onChange(FIN_DEL_DIA);
                setAbierto(false);
              }}
            >
              24:00
            </Button>
          )}
          <TimePickerConfirm />
        </TimePickerFooter>
      </TimePickerContent>
    </TimePicker>
  );
}
