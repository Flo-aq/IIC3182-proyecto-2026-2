"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { type Reunion, etiquetaDia, resumenBloques, resumenDias, zonaCorta } from "@/lib/reunion";

type Props = { codigo: string; reunion: Reunion; onOtra: () => void };

/** Agrupa las reglas con la misma hora: "13:00–14:00 en 5 días" en vez de repetirla por cada día. */
function resumenBloqueos(r: Reunion): string {
  if (!r.bloqueos.length) return "Ninguno";
  const grupos = new Map<string, string[]>();
  for (const b of r.bloqueos) {
    const hora = `${b.desde}–${b.hasta}`;
    grupos.set(hora, [...(grupos.get(hora) ?? []), b.dia]);
  }
  return [...grupos]
    .map(([hora, dias]) => (dias.length > 2 ? `${hora} en ${dias.length} días` : `${hora} (${dias.map((d) => etiquetaDia(d)).join(", ")})`))
    .join("; ");
}

export function Exito({ codigo, reunion: r, onOtra }: Props) {
  const [copiado, setCopiado] = useState(false);
  const enlace = `wemeet.app/e/${codigo}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(`https://${enlace}`);
    } catch {
      // Sin permiso del navegador: dejamos igual el aviso, el enlace queda visible para copiarlo a mano.
    }
    setCopiado(true);
  };

  const filas: [string, string][] = [
    ["Reunión", r.titulo.trim()],
    ["Días", resumenDias(r.dias)],
    ["Horario", `${r.desde} a ${r.hasta}`],
    ["Bloques", resumenBloques(r)],
    ["Bloqueados", resumenBloqueos(r)],
    ["Integrantes clave", String(r.claves)],
    ["Zona horaria", zonaCorta(r.zona)],
    ["Fecha límite", r.limite || "Sin fecha"],
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
        <Button className="h-11 gap-1.5 rounded-full px-5 font-bold" onClick={copiar}>
          {copiado ? <Check /> : <Copy />}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {filas.map(([k, v]) => (
          <li key={k} className="flex justify-between gap-3 border-b pb-2">
            <span className="text-muted-foreground">{k}</span>
            <b className="text-right font-semibold">{v}</b>
          </li>
        ))}
      </ul>
      <Button variant="outline" className="h-12 rounded-full text-base font-bold" onClick={onOtra}>
        Crear otra reunión
      </Button>
      <p className="text-xs text-muted-foreground">
        Versión de prueba: la reunión todavía no se guarda en una base de datos.
      </p>
    </div>
  );
}
