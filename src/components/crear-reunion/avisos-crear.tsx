import { toast } from "sonner";

import { type Problema, type Reunion, problemas } from "@/lib/reunion";

export const ID_AVISO = "campos-pendientes";

/** Aviso arriba con lo que falta; reemplaza al anterior si se vuelve a intentar. */
export function avisar(ps: Problema[]) {
  const faltan = ps.some((p) => p.campo === "nombre" || p.campo === "organizador" || p.campo === "dias");
  toast.error(faltan ? "Faltan campos por completar" : "Revisa estos campos", {
    id: ID_AVISO,
    duration: 8000,
    description: (
      <ul className="mt-1 flex flex-col gap-0.5">
        {ps.map((p) => (
          <li key={`${p.campo}-${p.regla ?? ""}`}>
            <b>{p.etiqueta}:</b> {p.mensaje}
          </li>
        ))}
      </ul>
    ),
  });
}

/** Los problemas de la reunión, más el nombre de quien organiza si hace falta (justo después del nombre de la reunión). */
export function todosLosProblemas(r: Reunion, pideNombre: boolean, organizador: string): Problema[] {
  const ps = problemas(r);
  if (!pideNombre || organizador.trim()) return ps;
  const falta: Problema = { campo: "organizador", etiqueta: "Tu nombre", mensaje: "Escribe tu nombre" };
  const i = ps.findIndex((p) => p.campo === "nombre");
  return [...ps.slice(0, i + 1), falta, ...ps.slice(i + 1)];
}
