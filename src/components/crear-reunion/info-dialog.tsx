"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PASOS = [
  {
    titulo: "Configura la reunión",
    texto: "Elige nombre, días, horario y duración de los bloques. Puedes bloquear horarios y definir integrantes clave.",
  },
  { titulo: "Comparte el link", texto: "Al crearla te damos un link. Cualquiera lo abre sin cuenta." },
  { titulo: "Cada persona marca cuándo puede", texto: "Tocan los bloques en que están disponibles y guardan." },
  {
    titulo: "Elige el mejor horario",
    texto: "Ves dónde coincide más gente, copias el resumen y cierras la reunión para enviar la invitación al calendario.",
  },
];

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function InfoDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
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
