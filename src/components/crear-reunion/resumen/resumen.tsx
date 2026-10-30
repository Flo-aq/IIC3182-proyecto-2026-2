"use client";

import { ListaBloqueos } from "@/components/compartidos/lista-bloqueos";
import { useRef, useState } from "react";
import { es } from "react-day-picker/locale";

import { Calendar } from "@/components/ui/calendar";
import { type Reunion, aIso, desdeIso, resumenDias, textoDiasRegla, textoHorario, zonaCorta } from "@/lib/reunion";

/** Una frase por regla: "13:00–14:00 (todos los días)" o "13:00–14:00 (mar 27 oct, mié 28 oct)". */
export function resumenBloqueos(r: Reunion): string {
  if (!r.bloqueos.length) return "Ninguno";
  return r.bloqueos.map((b) => `${b.desde}–${b.hasta} (${textoDiasRegla(b, r.dias).toLowerCase()})`).join("; ");
}

const DESLIZAR_MIN = 40;
const MAX_BLOQUEOS = 3;

/** Calendario con los días elegidos marcados; se cambia de mes con las flechas o deslizando a los lados. */
function DiasEnCalendario({ dias }: { dias: string[] }) {
  const [mes, setMes] = useState<Date | null>(null);
  const inicioDeslizar = useRef<number | null>(null);

  if (!dias.length) return <dd className="text-muted-foreground">Ningún día elegido</dd>;

  const ordenados = [...dias].sort();
  const elegidos = new Set(ordenados);
  const primero = desdeIso(`${ordenados[0].slice(0, 7)}-01`);
  const ultimo = desdeIso(`${ordenados[ordenados.length - 1].slice(0, 7)}-01`);
  const visible = !mes || mes < primero ? primero : mes > ultimo ? ultimo : mes;

  const mover = (delta: number) => {
    const destino = new Date(visible.getFullYear(), visible.getMonth() + delta, 1);
    if (destino >= primero && destino <= ultimo) setMes(destino);
  };

  return (
    <dd>
      <span className="sr-only">{resumenDias(ordenados)}</span>
      <div
        className="touch-pan-y [&_td]:size-(--cell-size) [&_td]:p-0.5 [&_td_button]:pointer-events-none [&_td_button]:rounded-[0.5rem] [&_td_button]:text-[0.8125rem] [&_td_button]:font-semibold [&_th]:w-(--cell-size)"
        onPointerDown={(e) => {
          inicioDeslizar.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (inicioDeslizar.current === null) return;
          const dx = e.clientX - inicioDeslizar.current;
          inicioDeslizar.current = null;
          if (Math.abs(dx) >= DESLIZAR_MIN) mover(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          inicioDeslizar.current = null;
        }}
      >
        <Calendar
          mode="multiple"
          locale={es}
          weekStartsOn={1}
          fixedWeeks
          showOutsideDays={false}
          month={visible}
          onMonthChange={setMes}
          startMonth={primero}
          endMonth={ultimo}
          selected={ordenados.map(desdeIso)}
          onSelect={() => {}}
          disabled={(d) => !elegidos.has(aIso(d))}
          className="mx-auto p-0 [--cell-size:--spacing(7)]"
          classNames={{ today: "" }}
        />
      </div>
    </dd>
  );
}

/** Dos datos cortos lado a lado. */
function Fila({ filas }: { filas: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 items-start gap-3">
      {filas.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="font-semibold break-words">{v}</dd>
        </div>
      ))}
    </div>
  );
}

/**
 * Cómo va quedando la reunión: en escritorio está siempre a la vista; en celular se abre desde "Ver resumen".
 * Muestra 3 horarios bloqueados y "Ver más" abre el resto; el scroll lo pone el contenedor, no la lista.
 */
export function ResumenReunion({ reunion: r }: { reunion: Reunion }) {
  const [verTodos, setVerTodos] = useState(false);
  const bloqueos = verTodos ? r.bloqueos : r.bloqueos.slice(0, MAX_BLOQUEOS);
  const lista = <ListaBloqueos bloqueos={bloqueos} dias={(b) => textoDiasRegla(b, r.dias)} />;
  const filas: [string, string][] = [
    ["Horario", textoHorario(r)],
    ["Cada bloque dura", `${r.bloqueMin} min`],
  ];

  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div>
        <dt className="mb-1 text-xs text-muted-foreground">Días</dt>
        <DiasEnCalendario dias={r.dias} />
      </div>
      <Fila filas={filas} />
      <div>
        <dt className="text-xs text-muted-foreground">Bloqueados</dt>
        {r.bloqueos.length ? (
          <dd>
            {/* Las cajas salen 12 px a la izquierda para que el texto de cada horario quede alineado con el rótulo. */}
            <div className="ml-[-0.75rem]">{lista}</div>
            {r.bloqueos.length > MAX_BLOQUEOS && (
              <button
                type="button"
                className="mt-1 h-9 rounded-full text-[0.8125rem] font-semibold text-primary"
                aria-expanded={verTodos}
                onClick={() => setVerTodos((v) => !v)}
              >
                {verTodos ? "Ver menos" : `Ver más (${r.bloqueos.length - MAX_BLOQUEOS})`}
              </button>
            )}
          </dd>
        ) : (
          <dd className="font-semibold">Ninguno</dd>
        )}
      </div>
      <Fila
        filas={[
          ["Integrantes clave", String(r.claves)],
          ["Zona horaria", zonaCorta(r.zona)],
        ]}
      />
    </dl>
  );
}
