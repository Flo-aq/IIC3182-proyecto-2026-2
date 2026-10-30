import type { Bloqueo } from "@/lib/reunion";
import { cn } from "@/lib/utils";

type Props = {
  bloqueos: Bloqueo[];
  /** En qué días rige cada regla. */
  dias: (b: Bloqueo) => string;
  className?: string;
};

/** Las reglas de horarios bloqueados, una por fila: el horario y los días. */
export function ListaBloqueos({ bloqueos, dias, className }: Props) {
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {bloqueos.map((b) => (
        <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-xl bg-muted px-3 py-2">
          <b className="font-semibold">
            {b.desde} a {b.hasta}
          </b>
          <span className="text-muted-foreground">{dias(b)}</span>
        </li>
      ))}
    </ul>
  );
}
