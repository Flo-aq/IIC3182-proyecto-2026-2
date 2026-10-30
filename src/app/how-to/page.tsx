import type { Metadata } from "next";

import { GuiaAcordeon } from "@/components/guia-acordeon";
import { PaginaAyuda } from "@/components/pagina-ayuda";
import { TextoRico } from "@/components/texto-rico";
import { GUIAS } from "@/lib/ayuda/textos";
import {
  type Item,
  itemsAvisos,
  itemsCerrar,
  itemsCompartir,
  itemsCrear,
  itemsPerfil,
  itemsResponder,
  itemsRespuestas,
} from "@/lib/ayuda/acordeones";

export const metadata: Metadata = { title: "How to · WeMeet" };

/** Las filas de cada guía: pasos y notas, con sus fotos escondidas hasta "Ver foto" (ver lib/ayuda/acordeones.ts). */
const ITEMS: Record<string, (pasos: string[]) => Item[]> = {
  crear: itemsCrear,
  responder: itemsResponder,
  respuestas: itemsRespuestas,
  compartir: itemsCompartir,
  avisos: itemsAvisos,
  cerrar: itemsCerrar,
  perfil: itemsPerfil,
};

export default function Page() {
  return (
    <PaginaAyuda
      titulo="How to"
      intro="Cómo se usa WeMeet. Elige una pantalla; toca una foto para ampliarla."
      otra={{
        href: "/faq",
        texto: "¿Tienes dudas? Mira las preguntas frecuentes →",
      }}
      secciones={GUIAS.map((g) => ({
        id: g.id,
        corto: g.corto,
        contenido: (
          <section
            aria-labelledby={`guia-${g.id}`}
            className="rounded-2xl border p-4 md:p-5"
          >
            <h2
              id={`guia-${g.id}`}
              className="font-heading text-lg font-extrabold tracking-tight"
            >
              {g.vista}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <TextoRico texto={g.resumen} />
            </p>
            {/* El aviso amarillo va al inicio: es lo primero que conviene saber de la pantalla. */}
            {g.nota && (
              <p className="mt-3 rounded-xl bg-lime px-3 py-2 text-xs font-semibold">
                <TextoRico texto={g.nota} />
              </p>
            )}
            <GuiaAcordeon items={ITEMS[g.id](g.pasos)} />
          </section>
        ),
      }))}
    />
  );
}
