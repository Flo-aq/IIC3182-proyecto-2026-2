"use client";

import { useId, useState } from "react";

import { HoraField } from "@/components/crear-reunion/hora-field";
import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { aIso, desdeIso, etiquetaDia, zonaCorta } from "@/lib/reunion";
import { CampoFecha } from "./campo-fecha";

/** Un aviso por correo: cuando respondan N personas, en una fecha, o en una fecha y hora. */
export type Aviso =
  | { tipo: "personas"; personas: number; correo: string }
  | { tipo: "fecha"; fecha: string; correo: string }
  | { tipo: "fecha-hora"; fecha: string; hora: string; correo: string };

export function textoAviso(a: Aviso): string {
  if (a.tipo === "personas")
    return `cuando respondan ${a.personas} ${a.personas === 1 ? "persona" : "personas"}`;
  const dia = `${etiquetaDia(a.fecha)} ${desdeIso(a.fecha).getFullYear()}`;
  return a.tipo === "fecha" ? `el ${dia}` : `el ${dia} a las ${a.hora}`;
}

type Tipo = Aviso["tipo"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cuántas personas han respondido hoy, para sugerir un valor. */
  respondieron: number;
  inicial: Aviso | null;
  /** Guarda el aviso; si falla (por ejemplo, el servidor lo rechaza) lanza un error con el mensaje para mostrar. */
  onGuardar: (aviso: Aviso) => Promise<void>;
  /** La zona horaria de la reunión: las fechas y horas del aviso se cuentan en ella. */
  zona?: string;
};

type Errores = {
  personas?: string;
  fecha?: string;
  correo?: string;
  general?: string;
};

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HORA_POR_DEFECTO = "18:00";

/**
 * Pide cuándo avisar (hay que elegir una de tres opciones: cuando respondan cierta cantidad de personas, en una
 * fecha, o en una fecha y hora) y a qué correo. El aviso se manda una sola vez, por correo.
 */
export function NotificarDialog({
  open,
  onOpenChange,
  respondieron,
  inicial,
  onGuardar,
  zona,
}: Props) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);
  const [tipo, setTipo] = useState<Tipo>(inicial?.tipo ?? "personas");
  const [personas, setPersonas] = useState(
    inicial?.tipo === "personas"
      ? String(inicial.personas)
      : String(respondieron + 3),
  );
  const [fecha, setFecha] = useState(
    inicial && inicial.tipo !== "personas" ? inicial.fecha : "",
  );
  const [hora, setHora] = useState(
    inicial?.tipo === "fecha-hora" ? inicial.hora : HORA_POR_DEFECTO,
  );
  const [correo, setCorreo] = useState(inicial?.correo ?? "");
  const [errores, setErrores] = useState<Errores>({});

  const guardar = async () => {
    if (enviando) return;
    const e: Errores = {};
    const n = Number(personas);
    if (tipo === "personas" && (!Number.isInteger(n) || n < 1))
      e.personas = "Escribe cuántas personas, desde 1.";
    if (tipo !== "personas") {
      if (!fecha) e.fecha = "Elige una fecha.";
      else if (fecha < aIso(new Date()))
        e.fecha = "Elige una fecha de hoy en adelante.";
    }
    if (!correo.trim()) e.correo = "Escribe tu correo.";
    else if (!CORREO.test(correo.trim()))
      e.correo = "Revisa el correo: debe verse como nombre@dominio.cl.";
    setErrores(e);
    if (Object.keys(e).length) return;
    const c = correo.trim();
    setEnviando(true);
    try {
      await onGuardar(
        tipo === "personas"
          ? { tipo, personas: n, correo: c }
          : tipo === "fecha"
            ? { tipo, fecha, correo: c }
            : { tipo, fecha, hora, correo: c },
      );
      onOpenChange(false);
    } catch (err) {
      setErrores({ general: (err as Error).message });
    } finally {
      setEnviando(false);
    }
  };

  const opcion = (valor: Tipo) =>
    `flex min-w-0 flex-col gap-2 rounded-2xl border px-3.5 py-3 ${tipo === valor ? "border-primary bg-accent/40" : ""}`;
  const radio = (valor: Tipo, texto: string) => (
    <label className="flex cursor-pointer items-center gap-3 text-[0.95rem] font-semibold">
      <input
        type="radio"
        name={`${id}-tipo`}
        checked={tipo === valor}
        className="size-5 shrink-0 accent-primary"
        onChange={() => setTipo(valor)}
      />
      {texto}
    </label>
  );
  const mensaje = (t?: string) =>
    t ? (
      <p role="alert" className="text-[0.8125rem] font-medium text-destructive">
        {t}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] max-w-[calc(100%-3rem)] overflow-y-auto rounded-3xl p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold tracking-tight">
            Notificarme
          </DialogTitle>
          <DialogDescription>
            Te avisamos por correo. Elige una de las tres opciones.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex min-w-0 flex-col gap-3"
          noValidate
          onSubmit={(ev) => {
            ev.preventDefault();
            guardar();
          }}
        >
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className="sr-only">Cuándo avisarte</legend>

            {/* Solo la opción elegida muestra sus campos; las otras quedan con el título. */}
            <div className={opcion("personas")}>
              {radio("personas", "Cuando respondan esta cantidad de personas")}
              {tipo === "personas" && (
                <>
                  <div className="flex items-center gap-2 pl-8">
                    <label htmlFor={`${id}-n`} className="sr-only">
                      Cantidad de personas
                    </label>
                    <Input
                      id={`${id}-n`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={personas}
                      aria-invalid={errores.personas ? true : undefined}
                      className="h-11 w-24 rounded-xl border-[1.5px] px-3 text-base"
                      onChange={(e) => setPersonas(e.target.value)}
                    />
                    <span className="text-sm">personas</span>
                  </div>
                  <div className="pl-8">{mensaje(errores.personas)}</div>
                </>
              )}
            </div>

            <div className={opcion("fecha")}>
              {radio("fecha", "En una fecha")}
              {tipo === "fecha" && (
                <>
                  <div className="pl-8">
                    <CampoFecha
                      value={fecha}
                      onChange={setFecha}
                      label="Fecha del aviso"
                      invalid={Boolean(errores.fecha)}
                    />
                  </div>
                  <div className="pl-8">{mensaje(errores.fecha)}</div>
                  <p className="pl-8 text-xs text-muted-foreground">
                    Te escribimos ese día a las 9:00
                    {zona ? ` (hora de ${zonaCorta(zona)})` : ""}.
                  </p>
                </>
              )}
            </div>

            <div className={opcion("fecha-hora")}>
              {radio("fecha-hora", "En una fecha y hora")}
              {tipo === "fecha-hora" && (
                <>
                  {/* La fecha y la hora van una al lado de la otra. */}
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CampoFecha
                        value={fecha}
                        onChange={setFecha}
                        label="Fecha del aviso, con hora"
                        invalid={Boolean(errores.fecha)}
                      />
                    </div>
                    <div className="w-[6.75rem] shrink-0">
                      <HoraField
                        value={hora}
                        onChange={setHora}
                        porDefecto={HORA_POR_DEFECTO}
                        label="Hora del aviso"
                      />
                    </div>
                  </div>
                  {mensaje(errores.fecha)}
                  {zona && (
                    <p className="text-xs text-muted-foreground">
                      Hora de {zonaCorta(zona)}, la zona de la reunión.
                    </p>
                  )}
                </>
              )}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-c`} className="text-sm font-bold">
              Tu correo{" "}
              <span
                aria-hidden="true"
                className="font-extrabold text-destructive"
              >
                *
              </span>
            </label>
            <Input
              id={`${id}-c`}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={correo}
              aria-required="true"
              aria-invalid={errores.correo ? true : undefined}
              placeholder="nombre@correo.cl"
              className="h-12 rounded-2xl border-[1.5px] px-3.5 text-base"
              onChange={(e) => setCorreo(e.target.value)}
            />
            {mensaje(errores.correo)}
          </div>

          {mensaje(errores.general)}
          <Button type="submit" className={BOTON.principal} disabled={enviando}>
            {enviando ? "Activando…" : "Activar aviso"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={BOTON.cancelar}
            disabled={enviando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Te escribimos una sola vez, y puedes quitar el aviso cuando quieras.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
