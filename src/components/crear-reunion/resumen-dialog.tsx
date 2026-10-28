"use client";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Reunion } from "@/lib/reunion";
import { AreaScroll } from "./area-scroll";
import { ResumenReunion } from "./resumen";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; reunion: Reunion; onCrear: () => void };

/** Resumen de la reunión para celular, con la opción de volver a editar o crearla. El título y los botones quedan fijos. */
export function ResumenDialog({ open, onOpenChange, reunion, onCrear }: Props) {
  const titulo = reunion.titulo.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-3rem)] max-w-[calc(100%-3rem)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-md md:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-3">
          <DialogTitle
            className={`font-heading text-xl font-extrabold tracking-tight break-words ${titulo ? "" : "text-muted-foreground"}`}
          >
            {titulo || "Sin nombre todavía"}
          </DialogTitle>
        </DialogHeader>
        <AreaScroll className="min-h-0 flex-1" areaClassName="px-5 py-4">
          <ResumenReunion reunion={reunion} />
        </AreaScroll>
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t px-5 pt-3 pb-5">
          <Button variant="outline" className={BOTON.secundario} onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button
            className={BOTON.principal}
            onClick={() => {
              onOpenChange(false);
              onCrear();
            }}
          >
            Crear reunión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
