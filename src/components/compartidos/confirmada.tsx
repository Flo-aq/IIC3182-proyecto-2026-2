"use client";

import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { textoBloque } from "@/lib/reunion/cierre";
import { copiarConAviso } from "@/lib/utilidades/portapapeles";
import { type Reunion, zonaCorta } from "@/lib/reunion";
import { cn } from "@/lib/utils";
import { AgregarACalendario } from "./agregar-calendario";

type Props = {
  slug: string;
  reunion: Reunion;
  /** El bloque elegido al cerrar ("AAAA-MM-DD|fila"). */
  bloque: string;
  enlace: string;
  /** Versión corta para la ventana de Compartir. */
  compacta?: boolean;
};

/** El horario confirmado de una reunión cerrada, con el botón para agregarlo al calendario (.ics). */
export function Confirmada({ slug, reunion: r, bloque, enlace, compacta }: Props) {
  const cuando = textoBloque(r, bloque);
  // Lo que se copia: el nombre de la reunión, el horario confirmado con su zona, y el link.
  const mensaje = `${r.titulo}\nConfirmada: ${cuando} (hora de ${zonaCorta(r.zona)}).\n${enlace}`;

  const copiar = () => copiarConAviso(mensaje, { exito: "Confirmación copiada", descripcion: "Ya puedes pegarla en el chat del grupo." });

  return (
    <section aria-label="Reunión confirmada" className={cn("flex flex-col gap-3", compacta ? "rounded-2xl border p-3" : "mx-auto w-full max-w-md px-1")}>
      <div className={cn("flex items-center gap-3", !compacta && "flex-col text-center")}>
        <span className={cn("grid shrink-0 place-items-center rounded-full bg-lime", compacta ? "size-9" : "size-14")}>
          <Check aria-hidden="true" className={compacta ? "size-5" : "size-7"} />
        </span>
        <div className="min-w-0">
          <h2 className={cn("font-heading font-extrabold tracking-tight", compacta ? "text-[0.95rem]" : "text-2xl")}>Reunión confirmada</h2>
          <p className={cn("font-semibold [overflow-wrap:anywhere]", compacta ? "text-[0.8125rem]" : "mt-1 text-lg")}>{cuando}</p>
          <p className="text-xs text-muted-foreground">Hora de {zonaCorta(r.zona)}</p>
        </div>
      </div>
      {!compacta && <p className="text-center text-sm text-muted-foreground">Ya no se pueden cambiar las respuestas.</p>}
      <AgregarACalendario slug={slug} reunion={r} bloque={bloque} enlace={enlace} compacta={compacta} />
      <Button type="button" variant="outline" className={compacta ? BOTON.compacto : BOTON.secundario} onClick={copiar}>
        <Copy />
        Copiar confirmación
      </Button>
    </section>
  );
}
