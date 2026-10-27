import { type PersonaSet, colorLeyendaClave, colorLeyendaGris } from "@/lib/respuestas";

/** Leyenda de los dos heatmaps: gris para la gente normal y violeta para los integrantes clave. De 0 a x personas. */
export function Leyenda({ personas }: { personas: PersonaSet[] }) {
  const normales = personas.filter((p) => !p.clave).length;
  const claves = personas.filter((p) => p.clave);
  const gris = colorLeyendaGris(normales);

  const escala = (claro: string, oscuro: string) => (
    <div className="flex items-center gap-1.5">
      <span className="text-[0.8125rem] font-semibold tabular-nums">0/{normales}</span>
      <span aria-hidden="true" className="h-3.5 w-28 shrink-0 rounded-full" style={{ backgroundImage: `linear-gradient(90deg, ${claro}, ${oscuro})` }} />
      <span className="text-[0.8125rem] font-semibold tabular-nums">
        {normales}/{normales}
      </span>
    </div>
  );

  return (
    <div className="mt-1 mb-2 flex shrink-0 flex-col gap-2.5 rounded-2xl border bg-muted/40 px-3.5 py-3 text-xs">
      <div className="flex items-center justify-between gap-3">
        <b className="text-[0.8125rem] font-semibold">Gente que puede</b>
        {escala(gris.claro, gris.oscuro)}
      </div>
      {claves.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <b className="text-[0.8125rem] font-semibold">{claves.length > 1 ? "Pueden los 2 clave" : `Puede ${claves[0].nombre}`}</b>
          {escala(colorLeyendaClave.claro, colorLeyendaClave.oscuro)}
        </div>
      )}
    </div>
  );
}
