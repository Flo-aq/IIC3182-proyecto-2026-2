"use client";

import { User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BOTON } from "@/lib/botones";
import { useSesion } from "@/lib/sesion";
import { cn } from "@/lib/utils";

/**
 * El botón de la cuenta en la barra de arriba: "Sign in" si no hay sesión y, con sesión, el icono de usuario con su menú
 * (Mi perfil y Cerrar sesión). Es el mismo en todas las pantallas.
 */
export function BotonCuenta() {
  const { conCuenta, nombre, cerrar } = useSesion();
  const [abierto, setAbierto] = useState(false);

  if (!conCuenta) {
    return (
      <Button type="button" variant="outline" className={cn(BOTON.compacto, "border-foreground")} disabled title="Próximamente: iniciar sesión con Google">
        Sign in
      </Button>
    );
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" size="icon" aria-label={`Tu cuenta: ${nombre}`} className="size-9 rounded-full border-[1.5px] border-lime bg-lime text-foreground hover:bg-lime/80" />}
      >
        <User />
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-64 flex-col gap-3 rounded-2xl p-3.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[0.95rem] font-semibold">{nombre}</span>
          <span className="text-xs text-muted-foreground">Con cuenta</span>
        </div>
        <Link href="/perfil" onClick={() => setAbierto(false)} className={cn(buttonVariants({ variant: "outline" }), BOTON.compacto)}>
          Mi perfil
        </Link>
        <Button
          type="button"
          variant="ghost"
          className={cn(BOTON.texto, "self-center")}
          onClick={() => {
            setAbierto(false);
            cerrar();
            toast.success("Sesión cerrada");
          }}
        >
          Cerrar sesión
        </Button>
      </PopoverContent>
    </Popover>
  );
}
