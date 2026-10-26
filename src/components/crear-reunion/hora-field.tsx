"use client";

import { TimePicker } from "@/components/reui/time-picker";

const TEXTOS = {
  labels: {
    placeholder: "Elige la hora",
    hour: "Hora",
    minute: "Min",
    now: "Ahora",
    clear: "Borrar",
    confirm: "Listo",
    panelLabel: "Elegir hora",
    openPicker: "Abrir selector de hora",
  },
};

type Props = {
  value: string;
  onChange: (hora: string) => void;
  label: string;
};

/** Selector de hora con columnas separadas para horas y minutos (ReUI Time Picker). */
export function HoraField({ value, onChange, label }: Props) {
  return (
    <TimePicker
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v);
      }}
      minuteStep={5}
      i18n={TEXTOS}
      aria-label={label}
      className="h-11 w-full rounded-xl px-3 text-base"
    />
  );
}
