import { Fragment } from "react";

/**
 * Un texto de ayuda con cursivas: lo que va entre asteriscos (*Compartir*) se muestra en italics. Se usa para nombrar
 * las secciones de la aplicación (pestañas y pantallas) en el How to y el FAQ.
 */
export function TextoRico({ texto }: { texto: string }) {
  return texto.split(/\*([^*]+)\*/).map((trozo, i) => (
    // Los trozos impares son los que iban entre asteriscos.
    <Fragment key={i}>{i % 2 ? <em>{trozo}</em> : trozo}</Fragment>
  ));
}
