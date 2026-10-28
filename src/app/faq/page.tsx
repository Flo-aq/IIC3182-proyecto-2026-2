import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";

import { PaginaAyuda } from "@/components/pagina-ayuda";
import { SeccionesAyuda } from "@/components/secciones-ayuda";
import { GRUPOS_PREGUNTAS } from "@/lib/ayuda";

export const metadata: Metadata = { title: "FAQ · WeMeet" };

export default function Page() {
  return (
    <PaginaAyuda titulo="FAQ" otra={{ href: "/how-to", texto: "Ver cómo funciona, pantalla por pantalla →" }}>
      <p className="-mt-3 text-sm text-muted-foreground">Preguntas frecuentes. Elige una pantalla.</p>
      <SeccionesAyuda
        secciones={GRUPOS_PREGUNTAS.map((g) => ({
          id: g.id,
          corto: g.corto,
          contenido: (
            <section aria-labelledby={`faq-${g.id}`} className="flex flex-col gap-2">
              <h2 id={`faq-${g.id}`} className="font-heading text-lg font-extrabold tracking-tight">
                {g.vista}
              </h2>
              <div className="overflow-clip rounded-2xl border">
                {g.preguntas.map((p) => (
                  <details key={p.pregunta} className="group border-b last:border-b-0">
                    <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-[0.95rem] font-semibold [&::-webkit-details-marker]:hidden">
                      {p.pregunta}
                      <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-3.5 pb-3.5 text-sm text-muted-foreground">{p.respuesta}</p>
                  </details>
                ))}
              </div>
            </section>
          ),
        }))}
      />
    </PaginaAyuda>
  );
}
