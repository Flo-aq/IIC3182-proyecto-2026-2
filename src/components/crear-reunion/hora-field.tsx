"use client";

import {
  TimePicker,
  TimePickerClear,
  TimePickerColumns,
  TimePickerConfirm,
  TimePickerContent,
  TimePickerFooter,
  TimePickerTrigger,
} from "@/components/reui/time-picker";

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
};

/**
 * Selector de hora con columnas separadas para horas y minutos (ReUI Time Picker).
 * Sin "Ahora". "Reset" vuelve a la hora por defecto, porque la hora nunca queda vacía.
 * `min` y `max` limitan las horas disponibles (por ejemplo, "Hasta" solo ofrece horas después de "Desde").
 */
export function HoraField({ value, onChange, porDefecto, label, min, max }: Props) {
  return (
    <TimePicker
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
      minuteStep={5}
      min={min}
      max={max}
      i18n={TEXTOS}
      aria-label={label}
    >
      <TimePickerTrigger className="h-11 w-full rounded-xl px-3 text-base" />
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
          <TimePickerConfirm />
        </TimePickerFooter>
      </TimePickerContent>
    </TimePicker>
  );
}
