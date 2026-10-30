import type { ReactNode } from "react";

import { type Reunion, podarBloqueos, textoCantidadDias, zonaCorta } from "@/lib/reunion";
import { DiasEditor } from "../formularios/dias-editor";
import { Etiquetas } from "../formularios/etiquetas";
import { ZonaHoraria } from "../formularios/zona-horaria";

type Fila = { id: string; etiqueta: string; obligatorio: boolean; resumen: string; contenido: ReactNode };

type Opciones = {
  r: Reunion;
  cambiar: (parcial: Partial<Reunion>) => void;
  /** Mañana, para el calendario de días; es null mientras no se lee la fecha del navegador. */
  manana: Date | null;
  /** Las filas que comparte con editar una plantilla: horario, bloque, bloqueos e integrantes clave. */
  filasConfig: Fila[];
  conCuenta: boolean;
  etiquetas: string[];
  onEtiquetas: (etiquetas: string[]) => void;
  tagsDeLaCuenta: string[];
};

/** Las filas plegables de crear una reunión, en orden: días, la configuración compartida, zona horaria y tags (solo con cuenta). */
export function filasDeCrear({ r, cambiar, manana, filasConfig, conCuenta, etiquetas, onEtiquetas, tagsDeLaCuenta }: Opciones): Fila[] {
  return [
    {
      id: "dias",
      etiqueta: "Días",
      obligatorio: true,
      resumen: textoCantidadDias(r.dias.length),
      contenido: manana ? (
        <DiasEditor
          dias={r.dias}
          manana={manana}
          onChange={(dias) => cambiar({ dias, bloqueos: podarBloqueos(r.bloqueos, dias) })}
        />
      ) : null,
    },
    ...filasConfig,
    {
      id: "zona",
      etiqueta: "Zona horaria",
      obligatorio: false,
      resumen: zonaCorta(r.zona),
      contenido: (
        <div className="flex flex-col gap-2">
          <ZonaHoraria value={r.zona} onChange={(zona) => cambiar({ zona })} />
          <p className="text-xs text-muted-foreground">Cada persona verá los horarios en su zona.</p>
        </div>
      ),
    },
    // Los tags son de la cuenta: sin cuenta no se ofrecen.
    ...(conCuenta
      ? [
          {
            id: "etiquetas",
            etiqueta: "Tags",
            obligatorio: false,
            resumen: etiquetas.length ? etiquetas.join(", ") : "Ninguno",
            contenido: <Etiquetas elegidos={etiquetas} onChange={onEtiquetas} deLaCuenta={tagsDeLaCuenta} />,
          },
        ]
      : []),
  ];
}
