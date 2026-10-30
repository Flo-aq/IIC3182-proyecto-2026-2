"use client";

import { CalendarDays, Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { es } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FIN_DEL_DIA,
  type Bloqueo,
  POR_DEFECTO,
  type Reunion,
  aIso,
  aMinutos,
  desdeIso,
  duplicarBloqueo,
  sumarMinutos,
  textoDiasRegla,
} from "@/lib/reunion";
import { HoraField } from "./hora-field";

/** El fin de un bloqueo puede ser el final del día (24:00), así que el inicio puede llegar hasta 5 min antes. */
const ULTIMO_INICIO = "23:55";

type Props = {
  reunion: Reunion;
  nuevoId: () => string;
  /** Ids de las reglas con problemas, para marcarlas. */
  reglasInvalidas?: Set<string>;
  onChange: (bloqueos: Bloqueo[]) => void;
  /** Sin elegir días por regla: cada horario vale para todos los días de la reunión (así son las reglas de una plantilla). */
  sinDias?: boolean;
};

/** Elige los días de una regla en el calendario normal, donde solo se pueden tocar los días marcados en "Días". */
function DiasDeLaRegla({
  regla,
  dias,
  etiqueta,
  invalida,
  onChange,
}: {
  regla: Bloqueo;
  dias: string[];
  etiqueta: string;
  invalida: boolean;
  onChange: (dias: string[]) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const botonClase = "h-11 w-full justify-between rounded-xl px-3 text-base font-normal";

  if (!dias.length) {
    return (
      <Button type="button" variant="outline" disabled aria-label={etiqueta} className={botonClase}>
        <span>Elige días primero</span>
        <CalendarDays className="text-muted-foreground" />
      </Button>
    );
  }

  const ordenados = [...dias].sort();
  const permitidos = new Set(ordenados);
  const primeroElegido = [...regla.dias].sort()[0];

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" aria-label={etiqueta} aria-invalid={invalida || undefined} className={botonClase} />}
      >
        <span className={`min-w-0 truncate ${regla.dias.length ? "" : "text-muted-foreground"}`}>
          {textoDiasRegla(regla, dias)}
        </span>
        <CalendarDays className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[20rem] max-w-[calc(100vw-2rem)] p-3">
        <Calendar
          mode="multiple"
          locale={es}
          weekStartsOn={1}
          selected={regla.dias.map(desdeIso)}
          onSelect={(sel) => onChange((sel ?? []).map(aIso).sort())}
          disabled={(d) => !permitidos.has(aIso(d))}
          defaultMonth={desdeIso(primeroElegido ?? ordenados[0])}
          startMonth={desdeIso(ordenados[0])}
          endMonth={desdeIso(ordenados[ordenados.length - 1])}
          className="w-full p-0 [--cell-size:--spacing(10)]"
          classNames={{ root: "w-full", month: "w-full gap-2", today: "" }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            className={BOTON.texto}
            onClick={() => onChange(ordenados)}
          >
            Todos los días
          </Button>
          <Button type="button" className={BOTON.confirmar} onClick={() => setAbierto(false)}>
            Listo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BloqueosEditor({ reunion, nuevoId, reglasInvalidas, onChange, sinDias = false }: Props) {
  const { bloqueos, dias } = reunion;

  const cambiar = (id: string, cambio: Partial<Bloqueo>) =>
    onChange(bloqueos.map((b) => (b.id === id ? { ...b, ...cambio } : b)));

  /**
   * El inicio puede ser cualquier hora (menos la última, que no deja lugar para un fin). Si el nuevo inicio alcanza o pasa al
   * fin, el fin se corre para que el bloqueo siga durando lo mismo (como mínimo 5 minutos).
   */
  const cambiarDesde = (b: Bloqueo, desde: string) => {
    if (aMinutos(b.hasta) > aMinutos(desde)) return cambiar(b.id, { desde });
    const duracion = Math.max(5, aMinutos(b.hasta) - aMinutos(b.desde));
    const fin = aMinutos(desde) + duracion;
    const hasta = fin >= 24 * 60 ? FIN_DEL_DIA : `${String(Math.floor(fin / 60)).padStart(2, "0")}:${String(fin % 60).padStart(2, "0")}`;
    cambiar(b.id, { desde, hasta });
  };

  return (
    <div className="flex flex-col gap-2">
      {bloqueos.length === 0 && <p className="text-sm text-muted-foreground">Ningún horario bloqueado.</p>}
      {bloqueos.map((b, i) => (
        <div
          key={b.id}
          className={`flex flex-col gap-2 rounded-2xl border bg-background p-2.5 ${reglasInvalidas?.has(b.id) ? "border-destructive" : ""}`}
        >
          <div className="flex min-h-8 items-center justify-between gap-2">
            <span className="pl-1.5 text-sm font-semibold">Regla {i + 1}</span>
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                className={BOTON.texto}
                aria-label={`Duplicar la regla ${i + 1}`}
                onClick={() => onChange(duplicarBloqueo(reunion, i, nuevoId))}
              >
                <Copy />
                Duplicar
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={BOTON.peligro}
                aria-label={`Quitar la regla ${i + 1}`}
                onClick={() => onChange(bloqueos.filter((x) => x.id !== b.id))}
              >
                <Trash2 />
                Quitar
              </Button>
            </div>
          </div>
          {!sinDias && (
            <DiasDeLaRegla
              regla={b}
              dias={dias}
              etiqueta={`Días de la regla ${i + 1}`}
              invalida={!!reglasInvalidas?.has(b.id)}
              onChange={(d) => cambiar(b.id, { dias: d })}
            />
          )}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
            <HoraField
              value={b.desde}
              onChange={(v) => cambiarDesde(b, v)}
              porDefecto={POR_DEFECTO.bloqueoDesde}
              max={ULTIMO_INICIO}
              label={`Regla ${i + 1}: bloquear desde`}
            />
            <span aria-hidden="true" className="text-muted-foreground">
              –
            </span>
            <HoraField
              value={b.hasta}
              onChange={(v) => cambiar(b.id, { hasta: v })}
              porDefecto={POR_DEFECTO.bloqueoHasta}
              min={sumarMinutos(b.desde, 5)}
              medianoche
              label={`Regla ${i + 1}: bloquear hasta`}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className={`${BOTON.texto} justify-start`}
        onClick={() =>
          onChange([
            ...bloqueos,
            { id: nuevoId(), dias: sinDias ? [] : [...dias].sort(), desde: POR_DEFECTO.bloqueoDesde, hasta: POR_DEFECTO.bloqueoHasta },
          ])
        }
      >
        <Plus />
        Bloquear un horario
      </Button>
      {sinDias && <p className="text-xs text-muted-foreground">Cada horario vale para todos los días de la reunión.</p>}
    </div>
  );
}
