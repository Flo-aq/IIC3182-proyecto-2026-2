"use client";

import Image from "next/image";
import { type CSSProperties, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Figura } from "@/lib/ayuda-figuras";
import { cn } from "@/lib/utils";

/** El número de un paso, igual al de la lista de pasos del texto. */
export function NumeroPaso({ n, className, style }: { n: number; className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden="true" style={style} className={cn("grid size-6 shrink-0 place-items-center rounded-full bg-marca font-heading text-[0.75rem] font-extrabold text-white", className)}>
      {n}
    </span>
  );
}

/**
 * La foto recortada, con un marco alrededor de cada parte que se explica. Los números van en el margen de la izquierda,
 * fuera de la foto, para no tapar nada, y son los mismos de los pasos del texto.
 */
function Foto({ figura, alt, ampliada }: { figura: Figura; alt: string; ampliada?: boolean }) {
  return (
    <div className="relative pl-8">
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        <Image
          src={figura.src}
          alt={alt}
          // Las fotos ya vienen optimizadas y recortadas; sin el optimizador de Next no se sirve una versión vieja guardada.
          unoptimized
          width={figura.ancho * 2}
          height={figura.alto * 2}
          className={cn("h-auto", ampliada ? "max-h-[74dvh] w-auto max-w-full" : "w-full")}
          sizes={ampliada ? "(min-width: 768px) 48rem, 95vw" : "(min-width: 768px) 16rem, 70vw"}
        />
        {figura.marcas.map((m) => (
          <span
            key={`${m.paso}-${m.x}-${m.y}`}
            aria-hidden="true"
            className="pointer-events-none absolute rounded-md border-[2.5px] border-marca"
            style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
          />
        ))}
      </div>
      {figura.marcas.map((m) => (
        <NumeroPaso key={`n-${m.paso}-${m.x}-${m.y}`} n={m.paso} className="absolute left-0" style={{ top: `${m.numY}%` }} />
      ))}
    </div>
  );
}

/** Una foto de una pantalla; al tocarla se amplía. */
export function FiguraAyuda({ figura, alt, className }: { figura: Figura; alt: string; className?: string }) {
  const [ampliada, setAmpliada] = useState(false);
  return (
    <figure className={className}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Ampliar la imagen: ${alt}`}
        onClick={() => setAmpliada(true)}
        className="block w-full cursor-zoom-in rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Foto figura={figura} alt={alt} />
      </button>
      <Dialog open={ampliada} onOpenChange={setAmpliada}>
        <DialogContent className="max-w-[calc(100%-1rem)] gap-2 rounded-3xl p-3 sm:max-w-3xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogDescription className="sr-only">La imagen, ampliada. Los números son los de los pasos de la lista.</DialogDescription>
          <div className="mx-auto w-fit max-w-full">
            <Foto figura={figura} alt={alt} ampliada />
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}
