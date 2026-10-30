import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type Reunion, etiquetaDia } from "@/lib/reunion";
import { type PersonaSet, horaDeFila } from "@/lib/reunion/respuestas";

type Props = {
  reunion: Reunion;
  personas: PersonaSet[];
  /** "AAAA-MM-DD|fila" */
  clave: string;
  /** Si está fijada con un toque, se puede cerrar. */
  onCerrar?: () => void;
  /** Alto fijo de tres líneas (título, quién puede y quién no); lo que no cabe se corta con "…". Para pantallas anchas. */
  tresLineas?: boolean;
};

/** El lugar del "quién puede" cuando todavía no se pasa el mouse por ningún bloque (solo en pantallas anchas). */
export function QuienPuedeVacio() {
  return (
    <div className="grid h-full place-items-center rounded-2xl border-[1.5px] border-dashed px-3 py-2.5 text-center text-xs text-muted-foreground">
      Pasa el mouse por un bloque de Respuestas para ver quién puede.
    </div>
  );
}

/** Quién puede y quién no en un bloque: aparece al pasar el mouse o al tocarlo. */
export function QuienPuede({ reunion: r, personas, clave, onCerrar, tresLineas = false }: Props) {
  const linea = tresLineas ? "block truncate" : "";
  const [dia, filaTexto] = clave.split("|");
  const fila = Number(filaTexto);
  const pueden = personas.filter((p) => p.puede(dia, fila));
  const noPueden = personas.filter((p) => !p.puede(dia, fila));
  const nombre = (p: PersonaSet) => p.nombre;
  const fecha = etiquetaDia(dia); // por ejemplo "mar 27 oct"

  return (
    <div role="status" className="relative rounded-2xl bg-background px-3 py-2.5 pr-10 text-xs shadow-xl">
      {onCerrar && (
        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 size-8 rounded-full" aria-label="Cerrar" onClick={onCerrar}>
          <X />
        </Button>
      )}
      <b className="mb-0.5 block text-[0.8125rem]">
        {fecha}, {horaDeFila(r, fila)} a {horaDeFila(r, fila + 1)}
      </b>
      <span className={`text-primary ${linea}`}>
        Pueden {pueden.length}: {pueden.map(nombre).join(", ") || "nadie"}
      </span>
      {!tresLineas && <br />}
      <span className={`text-destructive ${linea}`}>
        No pueden {noPueden.length}: {noPueden.map(nombre).join(", ") || "nadie"}
      </span>
    </div>
  );
}
