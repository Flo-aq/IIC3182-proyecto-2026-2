"use client";

import { LogIn, User } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PuntoClave } from "./punto-clave";

type AccesoProps = {
  nombre: string;
  onNombre: (nombre: string) => void;
  clave: boolean;
  onClave: (clave: boolean) => void;
  onContinuar: () => void;
  /** La reunión admite integrantes clave. */
  hayClaves: boolean;
  /** Los lugares de integrante clave ya están ocupados. */
  clavesLlenas: boolean;
  /** Si el nombre escrito es el de alguien que ya respondió: se cargará su respuesta para editarla. */
  yaRespondio: boolean;
};

/**
 * Lo que ocupa toda la pestaña Mi horario hasta que dices quién eres, como una pantalla de acceso normal y
 * centrada: basta con escribir tu nombre. Si ya habías respondido, escribir el mismo nombre carga tu respuesta.
 * Respuestas y Compartir no piden nada de esto.
 */
export function Acceso({ nombre, onNombre, clave, onClave, onContinuar, hayClaves, clavesLlenas, yaRespondio }: AccesoProps) {
  const idNombre = useId();
  const idClave = useId();
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-center pb-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
        <form
          className="flex flex-col gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (nombre.trim()) onContinuar();
          }}
        >
          <div className="text-center">
            <h2 className="font-heading text-xl font-extrabold tracking-tight">Escribe tu nombre</h2>
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
              Eso es todo: no necesitas cuenta. Si ya habías respondido, escribe el mismo nombre para editar tus horarios.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={idNombre} className="text-sm font-bold">
              Tu nombre <span aria-hidden="true" className="font-extrabold text-destructive">*</span>
            </label>
            <Input
              id={idNombre}
              ref={campo}
              value={nombre}
              maxLength={40}
              autoComplete="off"
              aria-required="true"
              placeholder="Ej: Camila"
              className="h-12 rounded-2xl border-[1.5px] px-3.5 text-base"
              onChange={(e) => onNombre(e.target.value)}
            />
            {yaRespondio && (
              <p role="status" className="text-[0.8125rem] font-medium text-primary">
                Ya hay una respuesta con ese nombre: se cargará para que la edites.
              </p>
            )}
          </div>
          {hayClaves && !yaRespondio && (
            <label htmlFor={idClave} className={`flex items-start gap-3 rounded-2xl border px-3.5 py-3 ${clavesLlenas ? "opacity-60" : "cursor-pointer"}`}>
              <input
                id={idClave}
                type="checkbox"
                checked={clave && !clavesLlenas}
                disabled={clavesLlenas}
                className="mt-0.5 size-5 shrink-0 accent-primary"
                onChange={(e) => onClave(e.target.checked)}
              />
              <span className="flex flex-col text-sm">
                <b className="text-[0.95rem] font-semibold">Soy integrante clave</b>
                <span className="text-xs text-muted-foreground">
                  {clavesLlenas ? "Los lugares de integrante clave ya están ocupados." : "Márcalo solo si la reunión depende de ti (por ejemplo, la profe o el ayudante)."}
                </span>
              </span>
            </label>
          )}
          <Button type="submit" className={BOTON.principal} disabled={!nombre.trim()}>
            {yaRespondio ? "Editar mi respuesta" : "Continuar"}
          </Button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            o
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" disabled className={`${BOTON.secundario} px-6`} title="Próximamente: iniciar sesión con tu cuenta">
            <LogIn />
            Iniciar sesión
          </Button>
          <p className="text-xs text-muted-foreground">Con una cuenta tendrás tus reuniones y plantillas. Próximamente.</p>
        </div>
      </div>
    </div>
  );
}

type MenuProps = {
  nombre: string;
  clave: boolean;
  /** Se cargó una respuesta que ya existía y se está editando. */
  editando: boolean;
  onCambiar: () => void;
};

/** Quién responde, en la barra de arriba y sin gastar espacio: un ícono que al tocarlo muestra el nombre y "Cambiar". */
export function MenuUsuario({ nombre, clave, editando, onCambiar }: MenuProps) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" size="icon" aria-label={`Tu nombre: ${nombre}`} className="size-9 rounded-full border-foreground" />}
      >
        <User />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-64 flex-col gap-3 p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-[0.95rem] font-semibold">
            <span className="truncate">{nombre}</span>
            {clave && <PuntoClave />}
          </span>
          <span className="text-xs text-muted-foreground">{editando ? "Editando tu respuesta" : "Respondiendo con este nombre"}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          className={BOTON.compacto}
          onClick={() => {
            setAbierto(false);
            onCambiar();
          }}
        >
          Cambiar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
