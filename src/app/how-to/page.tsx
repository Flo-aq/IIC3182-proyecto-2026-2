import type { Metadata } from "next";

import { FiguraAyuda, NumeroPaso } from "@/components/figura-ayuda";
import { PaginaAyuda } from "@/components/pagina-ayuda";
import { SeccionesAyuda } from "@/components/secciones-ayuda";
import { GUIAS } from "@/lib/ayuda";
import { FIGURAS } from "@/lib/ayuda-figuras";

export const metadata: Metadata = { title: "How to · WeMeet" };

type Foto = { foto: keyof typeof FIGURAS; alt: string; donde: "lado" | "debajo" | "ancha" };

/**
 * Las fotos de cada sección. Cada foto marca partes con el número del paso del texto que ilustra, así que los números
 * de la foto son los de la lista (ver lib/ayuda-figuras.ts). "lado": junto a los pasos; "debajo": en una fila bajo los
 * pasos (para varias fotos de celular); "ancha": a todo el ancho (la del computador).
 */
const FOTOS: Record<string, Foto[]> = {
  crear: [{ foto: "crear", alt: "La pantalla de crear una reunión, en el celular", donde: "lado" }],
  responder: [
    { foto: "acceso", alt: "La pantalla para escribir tu nombre y marcar si eres integrante clave, en el celular", donde: "debajo" },
    { foto: "responder", alt: "Mi horario con un bloque marcado y los bloques con rayas, en el celular", donde: "debajo" },
  ],
  respuestas: [
    { foto: "respuestas", alt: "Respuestas: cuánta gente puede en cada bloque y quién puede en el bloque elegido, en el celular", donde: "lado" },
    { foto: "escritorio", alt: "Mi horario y Respuestas a la vez, en el computador", donde: "ancha" },
  ],
  compartir: [{ foto: "compartir", alt: "La pestaña Compartir, en el celular", donde: "lado" }],
  perfil: [{ foto: "perfil", alt: "La parte de arriba del perfil, con la primera reunión de la lista (datos de ejemplo), en el celular", donde: "lado" }],
};

export default function Page() {
  return (
    <PaginaAyuda titulo="How to" otra={{ href: "/faq", texto: "¿Tienes dudas? Mira las preguntas frecuentes →" }}>
      <p className="-mt-3 text-sm text-muted-foreground">Cómo se usa WeMeet. Elige una pantalla. Los números de las fotos son los de los pasos; toca una foto para ampliarla.</p>
      <SeccionesAyuda
        secciones={GUIAS.map((g) => {
          const fotos = FOTOS[g.id] ?? [];
          const lado = fotos.filter((f) => f.donde === "lado");
          const debajo = fotos.filter((f) => f.donde === "debajo");
          const anchas = fotos.filter((f) => f.donde === "ancha");
          return {
            id: g.id,
            corto: g.corto,
            contenido: (
              <section aria-labelledby={`guia-${g.id}`} className="rounded-2xl border p-4 md:p-5">
                <h2 id={`guia-${g.id}`} className="font-heading text-lg font-extrabold tracking-tight">
                  {g.vista}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{g.resumen}</p>
                <div className={lado.length ? "mt-3.5 flex flex-col gap-5 md:grid md:grid-cols-[minmax(0,1fr)_16rem] md:items-start md:gap-6" : "mt-3.5"}>
                  <div>
                    <ol className="flex flex-col gap-3">
                      {g.pasos.map((p, k) => (
                        <li key={p} className="grid grid-cols-[1.5rem_1fr] gap-3 text-sm">
                          <NumeroPaso n={k + 1} />
                          <span className="pt-0.5">{p}</span>
                        </li>
                      ))}
                    </ol>
                    {g.nota && <p className="mt-3.5 rounded-xl bg-lime px-3 py-2 text-xs font-semibold">{g.nota}</p>}
                  </div>
                  {lado.map((f) => (
                    <FiguraAyuda key={f.foto} figura={FIGURAS[f.foto]} alt={f.alt} className="mx-auto w-full max-w-[16rem] md:mx-0" />
                  ))}
                </div>
                {debajo.length > 0 && (
                  <div className="mt-5 flex flex-wrap justify-center gap-5 md:justify-start">
                    {debajo.map((f) => (
                      <FiguraAyuda key={f.foto} figura={FIGURAS[f.foto]} alt={f.alt} className="w-full max-w-[16rem]" />
                    ))}
                  </div>
                )}
                {anchas.map((f) => (
                  <FiguraAyuda key={f.foto} figura={FIGURAS[f.foto]} alt={f.alt} className="mt-5" />
                ))}
              </section>
            ),
          };
        })}
      />
    </PaginaAyuda>
  );
}
