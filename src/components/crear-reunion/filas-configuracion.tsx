"use client";

import { Minus, Plus, TriangleAlert } from "lucide-react";
import { type ReactNode, useId, useRef } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FIN_DEL_DIA, OPCIONES_BLOQUE, POR_DEFECTO, type Reunion, esTodoElDia, resumenBloques, sumarMinutos, textoHorario } from "@/lib/reunion";
import { BloqueosEditor } from "./bloqueos-editor";
import { HoraField } from "./hora-field";

export type FilaConfig = { id: string; etiqueta: string; obligatorio: boolean; resumen: string; contenido: ReactNode };

type Opciones = {
  r: Reunion;
  cambiar: (parcial: Partial<Reunion>) => void;
  nuevoId: () => string;
  /** Ids de las reglas de bloqueo con problemas, para marcarlas. */
  reglasMalas?: Set<string>;
  /** Para una plantilla: las reglas de bloqueo no eligen días. */
  sinDias?: boolean;
};

/**
 * Las filas de configuración que comparten crear una reunión y editar una plantilla: horario, duración del bloque,
 * horarios bloqueados e integrantes clave. Cada fila lleva lo que se ve cerrada (`resumen`) y lo que se ve abierta (`contenido`).
 */
export function useFilasConfiguracion({ r, cambiar, nuevoId, reglasMalas, sinDias }: Opciones): FilaConfig[] {
  const idTodoElDia = useId();
  const horarioPrevio = useRef<{ desde: string; hasta: string }>({ desde: POR_DEFECTO.desde, hasta: POR_DEFECTO.hasta });
  const todoElDia = esTodoElDia(r);

  const cambiarTodoElDia = (activo: boolean) => {
    if (activo) {
      horarioPrevio.current = { desde: r.desde, hasta: r.hasta };
      cambiar({ desde: "00:00", hasta: FIN_DEL_DIA });
    } else {
      cambiar(horarioPrevio.current);
    }
  };

  return [
    {
      id: "horario",
      etiqueta: "Horario",
      obligatorio: true,
      resumen: textoHorario(r),
      contenido: (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={idTodoElDia} className="text-sm font-semibold">
              Todo el día
            </label>
            <Switch id={idTodoElDia} checked={todoElDia} onCheckedChange={cambiarTodoElDia} />
          </div>
          {!todoElDia && (
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Desde</span>
                <HoraField value={r.desde} onChange={(desde) => cambiar({ desde })} porDefecto={POR_DEFECTO.desde} max={sumarMinutos(r.hasta, -5)} label="Hora de inicio" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Hasta</span>
                <HoraField value={r.hasta} onChange={(hasta) => cambiar({ hasta })} porDefecto={POR_DEFECTO.hasta} min={sumarMinutos(r.desde, 5)} label="Hora de término" />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "bloque",
      etiqueta: "Cada bloque dura",
      obligatorio: true,
      resumen: `${r.bloqueMin} min`,
      contenido: (
        <div className="flex flex-col gap-2">
          <ToggleGroup
            value={[String(r.bloqueMin)]}
            onValueChange={(v) => v[0] && cambiar({ bloqueMin: Number(v[0]) })}
            aria-label="Duración de cada bloque en minutos"
            className="w-full gap-0.5 rounded-3xl bg-muted p-1"
          >
            {OPCIONES_BLOQUE.map((m) => (
              <ToggleGroupItem
                key={m}
                value={String(m)}
                aria-label={`${m} minutos`}
                className="h-14 flex-1 flex-col gap-0.5 rounded-[1.25rem] leading-none aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-md"
              >
                <span className="text-lg font-bold">{m}</span>
                <span aria-hidden="true" className="text-[0.7rem] font-normal opacity-80">
                  min
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-sm text-muted-foreground">{resumenBloques(r)}</p>
        </div>
      ),
    },
    {
      id: "bloqueos",
      etiqueta: "Bloquear horarios",
      obligatorio: false,
      resumen: r.bloqueos.length ? (r.bloqueos.length === 1 ? "1 regla" : `${r.bloqueos.length} reglas`) : "Ninguno",
      contenido: <BloqueosEditor reunion={r} nuevoId={nuevoId} reglasInvalidas={reglasMalas} onChange={(bloqueos) => cambiar({ bloqueos })} sinDias={sinDias} />,
    },
    {
      id: "claves",
      etiqueta: "Integrantes clave",
      obligatorio: false,
      resumen: r.claves ? String(r.claves) : "Ninguno",
      contenido: (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" className="size-12 rounded-full" aria-label="Uno menos" disabled={r.claves <= 0} onClick={() => cambiar({ claves: r.claves - 1 })}>
              <Minus />
            </Button>
            <output className="min-w-14 text-center font-heading text-2xl font-extrabold">{r.claves}</output>
            <Button type="button" variant="outline" className="size-12 rounded-full" aria-label="Uno más" disabled={r.claves >= 2} onClick={() => cambiar({ claves: r.claves + 1 })}>
              <Plus />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Su horario delimita la reunión: solo se sugieren bloques en que ellos pueden.</p>
        </div>
      ),
    },
  ];
}

/** El asterisco rojo de "obligatorio". */
export const Obligatorio = () => (
  <span aria-hidden="true" className="ml-0.5 font-extrabold text-destructive">
    *
  </span>
);

/**
 * La lista de filas plegables de ajustes, como en crear una reunión: cada fila muestra su valor y se abre al tocarla.
 * `malos` son los ids de las filas con problemas, que se marcan en rojo.
 */
export function FilasAcordeon({ filas, abierto, onAbierto, malos }: { filas: FilaConfig[]; abierto: string | null; onAbierto: (id: string | null) => void; malos?: Set<string> }) {
  return (
    <Accordion value={abierto ? [abierto] : []} onValueChange={(v) => onAbierto((v[0] as string | undefined) ?? null)} className="overflow-clip rounded-2xl border bg-muted">
      {filas.map((f) => {
        const malo = malos?.has(f.id) ?? false;
        return (
          <AccordionItem key={f.id} value={f.id} data-fila={f.id} className={malo ? "bg-destructive/5" : ""}>
            <AccordionTrigger
              headerClassName={abierto === f.id ? "sticky top-0 z-10 bg-muted" : ""}
              className="min-h-13 items-center rounded-none px-3.5 py-3 hover:no-underline aria-expanded:border-b-border"
            >
              <span className={`flex shrink-0 items-center gap-1.5 text-[0.95rem] font-semibold ${malo ? "text-destructive" : ""}`}>
                <span>
                  {f.etiqueta}
                  {f.obligatorio && <Obligatorio />}
                </span>
                {malo && <TriangleAlert className="size-4" aria-hidden="true" />}
              </span>
              <span className={`min-w-0 flex-1 truncate pl-3 text-right text-sm font-normal ${malo ? "text-destructive" : "text-muted-foreground"}`}>{f.resumen}</span>
            </AccordionTrigger>
            <AccordionContent className="bg-background px-3.5 pt-3.5 pb-3.5">{f.contenido}</AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
