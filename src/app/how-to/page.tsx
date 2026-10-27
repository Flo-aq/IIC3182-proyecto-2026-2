import type { Metadata } from "next";

import { PaginaAyuda } from "@/components/pagina-ayuda";
import { PASOS } from "@/lib/ayuda";

export const metadata: Metadata = { title: "How to · WeMeet" };

export default function Page() {
  return (
    <PaginaAyuda titulo="How to" otra={{ href: "/faq", texto: "¿Tienes dudas? Mira las preguntas frecuentes →" }}>
      <p className="-mt-2 text-sm text-muted-foreground">Cómo funciona WeMeet, paso a paso.</p>
      <ol className="flex flex-col gap-4">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="grid grid-cols-[2.125rem_1fr] gap-3">
            <span className="grid size-[2.125rem] place-items-center rounded-full bg-accent font-heading font-extrabold text-accent-foreground">{i + 1}</span>
            <div>
              <b className="block text-[0.95rem]">{p.titulo}</b>
              <span className="text-sm text-muted-foreground">{p.texto}</span>
            </div>
          </li>
        ))}
      </ol>
    </PaginaAyuda>
  );
}
