import { ListaBloqueos } from "@/components/compartidos/lista-bloqueos";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { type Reunion, resumenDias, textoDiasRegla, textoHorario, zonaCorta } from "@/lib/reunion";
import type { Persona } from "@/lib/reunion/respuestas";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; reunion: Reunion; personas: Persona[] };

/** Los detalles de la reunión: lo que configuró quien la creó. */
export function DetallesDialog({ open, onOpenChange, reunion: r, personas }: Props) {
  const claves = personas.filter((p) => p.clave);
  const filas: [string, string][] = [
    ["Días", resumenDias(r.dias)],
    ["Horario", textoHorario(r)],
    ["Cada bloque dura", `${r.bloqueMin} min`],
    ["Zona horaria", zonaCorta(r.zona)],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] max-w-[calc(100%-3rem)] overflow-y-auto rounded-3xl p-5 sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-extrabold tracking-tight break-words">{r.titulo}</DialogTitle>
        </DialogHeader>
        <dl className="flex flex-col gap-3 text-sm">
          {filas.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="font-semibold break-words">{v}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-muted-foreground">Bloqueados por quien creó la reunión</dt>
            {r.bloqueos.length ? (
              <dd>
                <ListaBloqueos bloqueos={r.bloqueos} dias={(b) => textoDiasRegla(b, r.dias)} className="mt-1" />
              </dd>
            ) : (
              <dd className="font-semibold">Ninguno</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Integrantes clave</dt>
            <dd className="font-semibold break-words">
              {r.claves
                ? `${claves.length} de ${r.claves}${claves.length ? ` (${claves.map((p) => p.nombre).join(", ")})` : ""}`
                : "Ninguno"}
            </dd>
          </div>
        </dl>
        <Button variant="outline" className={BOTON.secundario} onClick={() => onOpenChange(false)}>
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
