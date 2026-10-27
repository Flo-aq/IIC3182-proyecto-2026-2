"use client";

import { useMemo } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ZONAS } from "@/lib/reunion";

const ciudad = (zona: string) => zona.split("/").pop()!.replace(/_/g, " ");

/** Diferencia con la hora universal hoy, por ejemplo "GMT-3". */
function compensacion(zona: string): string {
  try {
    const partes = new Intl.DateTimeFormat("es", { timeZone: zona, timeZoneName: "shortOffset" }).formatToParts(new Date());
    return partes.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** Minúsculas y sin tildes, para que "mexico" encuentre "México". */
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/_/g, " ")
    .toLowerCase();

type Props = { value: string; onChange: (zona: string) => void };

/** Lista buscable con todas las zonas horarias del navegador; primero la elegida y las más usadas. */
export function ZonaHoraria({ value, onChange }: Props) {
  const { zonas, compensaciones } = useMemo(() => {
    const todas = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
    const destacadas = [value, ...ZONAS].filter((z, i, a) => a.indexOf(z) === i);
    const resto = [...new Set([...todas, ...ZONAS, value])].filter((z) => !destacadas.includes(z)).sort();
    const lista = [...destacadas, ...resto];
    return { zonas: lista, compensaciones: new Map(lista.map((z) => [z, compensacion(z)])) };
  }, [value]);

  return (
    <Combobox
      items={zonas}
      value={value}
      onValueChange={(z) => {
        if (z) onChange(z);
      }}
      itemToStringLabel={ciudad}
      filter={(z, consulta) => normalizar(z).includes(normalizar(consulta))}
    >
      <ComboboxInput aria-label="Zona horaria" placeholder="Busca una ciudad" className="h-11 w-full rounded-xl text-base" />
      <ComboboxContent className="min-w-64">
        <ComboboxEmpty>No hay zonas con ese nombre</ComboboxEmpty>
        <ComboboxList>
          {(z: string) => (
            <ComboboxItem key={z} value={z}>
              <span>{ciudad(z)}</span>
              <span className="ml-auto pr-5 text-xs text-muted-foreground">{compensaciones.get(z)}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
