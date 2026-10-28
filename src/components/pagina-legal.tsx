import type { ReactNode } from "react";

import { PaginaAyuda } from "@/components/pagina-ayuda";

export type SeccionLegal = { titulo: string; contenido: ReactNode };

/** Las páginas de privacidad y condiciones: el marco de la ayuda, con secciones de texto. */
export function PaginaLegal({
  titulo,
  actualizada,
  secciones,
  otra,
}: {
  titulo: string;
  actualizada: string;
  secciones: SeccionLegal[];
  otra: { href: string; texto: string };
}) {
  return (
    <PaginaAyuda titulo={titulo} otra={otra}>
      <p className="-mt-3 text-sm text-muted-foreground">Última actualización: {actualizada}</p>
      {secciones.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-2">
          <h2 className="font-heading text-lg font-extrabold tracking-tight">{s.titulo}</h2>
          <div className="flex flex-col gap-2 text-[0.95rem] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
            {s.contenido}
          </div>
        </section>
      ))}
    </PaginaAyuda>
  );
}
