"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BarraSuperior } from "@/components/barra-superior";
import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { useOrigen } from "@/lib/cliente";
import { type Reunion, resumenBloques, resumenDias, textoHorario, zonaCorta } from "@/lib/reunion";
import { resumenBloqueos } from "./resumen";

/** Segundos que se muestra esta pantalla antes de llevar a la reunión. */
const ESPERA = 5;

type Props = {
  codigo: string;
  reunion: Reunion;
  /** El link ya se copió solo al crear la reunión. */
  copiado: boolean;
  onOtra: () => void;
};

export function Exito({ codigo, reunion: r, copiado: yaCopiado, onOtra }: Props) {
  const router = useRouter();
  const [copiado, setCopiado] = useState(yaCopiado);
  const [faltan, setFaltan] = useState(ESPERA);
  const origen = useOrigen();
  const enlace = `${origen}/e/${codigo}`;

  // Cuenta regresiva hasta llevar a la reunión; "Crear otra reunión" la corta porque esta pantalla desaparece.
  useEffect(() => {
    const cada = setInterval(() => setFaltan((n) => n - 1), 1000);
    return () => clearInterval(cada);
  }, []);
  useEffect(() => {
    if (faltan <= 0) router.push(`/e/${codigo}`);
  }, [faltan, codigo, router]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
    } catch {
      // Sin permiso del navegador: el enlace queda visible para copiarlo a mano.
    }
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
    <div className="mx-auto flex min-h-dvh w-full flex-col bg-background lg:max-w-[88rem]">
      <BarraSuperior />
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6 md:max-w-xl">
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
        <p role="status" className="-mt-2 text-sm font-medium text-primary">
          {copiado ? "El link se copió automáticamente." : "No pudimos copiar el link solo: toca Copiar."}
        </p>

        <div className="flex flex-col gap-2 rounded-2xl bg-accent p-3.5" aria-live="polite">
          <p className="text-sm font-semibold">
            Te llevamos a la reunión en {Math.max(faltan, 0)} {faltan === 1 ? "segundo" : "segundos"}.
          </p>
          <Button className={BOTON.principal} onClick={() => router.push(`/e/${codigo}`)}>
            Ir a la reunión ahora
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
    </div>
  );
}
