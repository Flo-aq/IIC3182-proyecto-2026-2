import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

/** El asterisco rojo de "obligatorio". */
export const Obligatorio = () => (
  <span aria-hidden="true" className="ml-0.5 font-extrabold text-destructive">
    *
  </span>
);

/** Lo que el campo (un `Input`) debe llevar para que lo lean bien los lectores de pantalla: su id y si es obligatorio, tiene un error o una ayuda. */
type AtributosDelCampo = { id: string; "aria-required"?: true; "aria-invalid"?: true; "aria-describedby"?: string };

type Props = {
  id: string;
  etiqueta: string;
  obligatorio?: boolean;
  /** El mensaje de error: marca el campo en rojo y se anuncia a quien usa lector de pantalla. */
  error?: string;
  /** Un aviso que no es un error (por ejemplo, "ya hay una respuesta con ese nombre"). */
  nota?: string;
  /** Una ayuda bajo el campo. */
  ayuda?: string;
  /** El error va junto a la etiqueta (como en crear una reunión); si no, va debajo del campo. */
  errorAlLado?: boolean;
  /** El campo: recibe los atributos de accesibilidad que le tocan. */
  children: (campo: AtributosDelCampo) => ReactNode;
};

/** Un campo de formulario con su etiqueta, el asterisco de obligatorio, el mensaje de error y la ayuda. */
export function Campo({ id, etiqueta, obligatorio, error, nota, ayuda, errorAlLado, children }: Props) {
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const campo: AtributosDelCampo = {
    id,
    "aria-required": obligatorio ? true : undefined,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? idError : ayuda ? idAyuda : undefined,
  };
  const mensaje = error && (
    <p id={idError} role="alert" className="text-[0.8125rem] font-medium text-destructive">
      {error}
    </p>
  );
  const textoDeAyuda = ayuda && (
    <p id={idAyuda} className="text-xs text-muted-foreground">
      {ayuda}
    </p>
  );

  if (errorAlLado) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-bold">
            <span>
              {etiqueta}
              {obligatorio && <Obligatorio />}
            </span>
            {error && <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />}
          </label>
          {mensaje}
        </div>
        {children(campo)}
        {textoDeAyuda}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {etiqueta}
        {obligatorio && (
          <>
            {" "}
            <span aria-hidden="true" className="font-extrabold text-destructive">
              *
            </span>
          </>
        )}
      </label>
      {children(campo)}
      {nota && (
        <p role="status" className="text-[0.8125rem] font-medium text-primary">
          {nota}
        </p>
      )}
      {textoDeAyuda}
      {mensaje}
    </div>
  );
}
