"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PASOS } from "@/lib/ayuda";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function InfoDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-3rem)] rounded-3xl p-5 sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold tracking-tight">Cómo funciona</DialogTitle>
        </DialogHeader>
        <ol className="flex flex-col gap-4">
          {PASOS.map((p, i) => (
            <li key={p.titulo} className="grid grid-cols-[2.125rem_1fr] gap-3">
              <span className="grid size-[2.125rem] place-items-center rounded-full bg-accent font-heading font-extrabold text-accent-foreground">
                {i + 1}
              </span>
              <div>
                <b className="block text-[0.95rem]">{p.titulo}</b>
                <span className="text-sm text-muted-foreground">{p.texto}</span>
              </div>
            </li>
          ))}
        </ol>
        <Button className="h-12 rounded-full text-base font-bold" onClick={() => onOpenChange(false)}>
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
