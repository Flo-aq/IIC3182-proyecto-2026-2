import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Reunion, resumenDias, textoDiasRegla, textoHorario, zonaCorta } from "@/lib/reunion";
import type { Persona } from "@/lib/respuestas";

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
                <ul className="mt-1 flex flex-col gap-1.5">
                  {r.bloqueos.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-xl bg-muted px-3 py-2">
                      <b className="font-semibold">
                        {b.desde} a {b.hasta}
                      </b>
                      <span className="text-muted-foreground">{textoDiasRegla(b, r.dias)}</span>
                    </li>
                  ))}
                </ul>
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
        <Button className="h-12 rounded-full text-base font-bold" onClick={() => onOpenChange(false)}>
          Entendido
        </Button>
      </DialogContent>
    </Dialog>
  );
}
