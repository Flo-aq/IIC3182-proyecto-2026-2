"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { useOrigen } from "@/lib/cliente";
import { type Reunion, resumenBloques, resumenDias, textoHorario, zonaCorta } from "@/lib/reunion";
import { resumenBloqueos } from "./resumen";

type Props = { codigo: string; reunion: Reunion; onOtra: () => void };

export function Exito({ codigo, reunion: r, onOtra }: Props) {
  const [copiado, setCopiado] = useState(false);
  const origen = useOrigen();
  const enlace = `${origen}/e/${codigo}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
    } catch {
      // Sin permiso del navegador: dejamos igual el aviso, el enlace queda visible para copiarlo a mano.
    }
    setCopiado(true);
  };

  const filas: [string, string][] = [
    ["Reunión", r.titulo.trim()],
    ["Días", resumenDias(r.dias)],
    ["Horario", textoHorario(r)],
    ["Bloques", resumenBloques(r)],
    ["Bloqueados", resumenBloqueos(r)],
    ["Integrantes clave", String(r.claves)],
    ["Zona horaria", zonaCorta(r.zona)],
  ];

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="grid size-14 place-items-center rounded-full bg-lime">
        <Check className="size-7" />
      </div>
      <h1 className="font-heading text-3xl font-extrabold tracking-tight">Reunión creada</h1>
      <p className="text-muted-foreground">Comparte este link. Quien lo abra puede responder sin cuenta.</p>
      <div className="flex items-center gap-2 rounded-full border bg-muted py-1.5 pr-1.5 pl-5">
        <code className="min-w-0 flex-1 truncate font-semibold">{enlace}</code>
        <Button className="h-11 gap-1.5 rounded-full px-5 font-extrabold" onClick={copiar}>
          {copiado ? <Check /> : <Copy />}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {filas.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-3 border-b pb-2">
            <span className="text-muted-foreground">{k}</span>
            <b className="min-w-0 text-right font-semibold [overflow-wrap:anywhere]">{v}</b>
          </li>
        ))}
      </ul>
      <Button variant="outline" className={BOTON.secundario} onClick={onOtra}>
        Crear otra reunión
      </Button>
    </div>
  );
}
