"use client";

import { CalendarPlus, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BOTON } from "@/lib/botones";
import { enlacesDeCalendario } from "@/lib/calendario";
import type { Reunion } from "@/lib/reunion";
import { cn } from "@/lib/utils";

type Props = {
  slug: string;
  reunion: Reunion;
  /** El bloque elegido al cerrar ("AAAA-MM-DD|fila"). */
  bloque: string;
  enlace: string;
  compacta?: boolean;
};

const OPCION = "flex min-h-12 flex-col justify-center rounded-xl px-3 py-1.5 text-sm font-semibold outline-none hover:bg-muted focus-visible:bg-muted";
const AYUDA = "text-xs font-normal text-muted-foreground";

/**
 * "Agregar a mi calendario": un menú con las formas de hacerlo. Google Calendar y Outlook abren su calendario con el evento ya
 * escrito (solo falta guardar), como los botones de los correos de invitación; el archivo .ics sirve para Apple y para cualquier otro.
 */
export function AgregarACalendario({ slug, reunion: r, bloque, enlace, compacta }: Props) {
  const { google, outlook } = enlacesDeCalendario(r, bloque, enlace);
  return (
    <Popover>
      <PopoverTrigger render={<Button type="button" className={cn(compacta ? BOTON.compacto : BOTON.principal, "gap-2")} />}>
        <CalendarPlus />
        Agregar a mi calendario
        <ChevronDown aria-hidden="true" className="ml-auto size-4 opacity-80" />
      </PopoverTrigger>
      <PopoverContent align="center" className="w-(--anchor-width) min-w-60 gap-0.5 rounded-2xl p-1.5">
        <a href={google} target="_blank" rel="noopener noreferrer" className={OPCION}>
          Google Calendar
          <span className={AYUDA}>Se abre con el evento listo</span>
        </a>
        <a href={outlook} target="_blank" rel="noopener noreferrer" className={OPCION}>
          Outlook
          <span className={AYUDA}>Se abre con el evento listo</span>
        </a>
        <a href={`/api/events/${slug}/ics`} download className={OPCION}>
          Apple u otro calendario
          <span className={AYUDA}>Descarga un archivo (.ics)</span>
        </a>
      </PopoverContent>
    </Popover>
  );
}
