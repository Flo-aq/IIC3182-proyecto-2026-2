"use client";

import { ChevronDown, Info } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useId, useState } from "react";

import { TextoRico } from "@/components/ayuda/texto-rico";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Item } from "@/lib/ayuda/acordeones";
import { FOTOS, type FotoLimpia } from "@/lib/ayuda/fotos";
import { cn } from "@/lib/utils";

/** La foto, con un recuadro donde se toca (si lo hay); al tocarla se amplía. */
function Foto({ f, ampliada }: { f: FotoLimpia; ampliada?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted">
      <Image
        src={f.src}
        alt=""
        // Las fotos ya vienen optimizadas y recortadas; sin el optimizador de Next no se sirve una versión vieja guardada.
        unoptimized
        width={f.ancho * 2}
        height={f.alto * 2}
        className={cn(
          "h-auto",
          ampliada ? "max-h-[74dvh] w-auto max-w-full" : "w-full",
        )}
      />
      {f.toques.map((t) => (
        <span
          key={`${t.x}-${t.y}`}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-md border-[2.5px] border-marca"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: `${t.w}%`,
            height: `${t.h}%`,
          }}
        />
      ))}
    </div>
  );
}

function FotoAmpliable({
  clave,
  alt,
  leyenda,
  etiqueta,
  className,
}: {
  clave: string;
  alt: string;
  leyenda?: string;
  etiqueta?: string;
  className?: string;
}) {
  const [ampliada, setAmpliada] = useState(false);
  const f = FOTOS[clave];
  return (
    // Una foto nunca se muestra más grande que su tamaño real: las angostas (como la barra de filtros) no se estiran.
    <figure
      className={cn("flex flex-col gap-1.5", className)}
      style={{ maxWidth: f.ancho }}
    >
      {etiqueta && (
        <p className="text-[0.6875rem] font-bold tracking-wide text-muted-foreground uppercase">
          {etiqueta}
        </p>
      )}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`Ampliar la imagen: ${alt}`}
        onClick={() => setAmpliada(true)}
        className="block w-full cursor-zoom-in rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Foto f={f} />
      </button>
      {leyenda && (
        <figcaption className="text-xs leading-snug text-muted-foreground">
          <TextoRico texto={leyenda} />
        </figcaption>
      )}
      <Dialog open={ampliada} onOpenChange={setAmpliada}>
        <DialogContent className="max-w-[calc(100%-1rem)] gap-2 rounded-3xl p-3 sm:max-w-3xl">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogDescription className="sr-only">
            La imagen, ampliada.
          </DialogDescription>
          <div className="mx-auto w-fit max-w-full">
            <Foto f={f} ampliada />
          </div>
        </DialogContent>
      </Dialog>
    </figure>
  );
}

const NUMERO =
  "grid size-6 shrink-0 place-items-center rounded-full font-heading text-[0.75rem] font-extrabold";

function Marca({ item }: { item: Item }) {
  return item.tipo === "paso" ? (
    <span
      aria-hidden="true"
      className={cn(NUMERO, "bg-primary text-primary-foreground")}
    >
      {item.n}
    </span>
  ) : (
    <span aria-hidden="true" className={cn(NUMERO, "bg-accent text-primary")}>
      <Info className="size-3.5" />
    </span>
  );
}

function Texto({ item }: { item: Item }) {
  return (
    <span className="pt-0.5">
      <TextoRico texto={item.texto} />
      {item.apunte && (
        <span className="mt-1.5 block text-[0.8125rem] leading-snug text-muted-foreground">
          <TextoRico texto={item.apunte} />
        </span>
      )}
      {item.lista && (
        // En etiquetas que se acomodan en filas, para que la lista ocupe poco alto.
        <span className="mt-2 flex flex-wrap gap-1.5">
          {item.lista.map((l) => (
            <span
              key={l}
              className="rounded-full border bg-background px-2.5 py-1 text-xs leading-none font-semibold"
            >
              <TextoRico texto={l} />
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

const FONDO = (item: Item) =>
  item.tipo === "nota" ? "border-accent bg-accent/50" : "";

/** Una fila con sus fotos escondidas: se abre con "Ver foto", y solo una queda abierta a la vez (todas comparten `name`). */
function FilaConFotos({ item, grupo }: { item: Item; grupo: string }) {
  const fotos = item.fotos ?? [];
  const conEtiquetas = fotos.some((f) => f.etiqueta);
  return (
    <details
      name={grupo}
      className={cn(
        "group rounded-2xl border open:border-primary",
        FONDO(item),
      )}
    >
      <summary className="grid cursor-pointer list-none grid-cols-[1.5rem_1fr_auto] items-start gap-3 rounded-2xl p-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <Marca item={item} />
        <Texto item={item} />
        <span className="flex items-center gap-0.5 pt-0.5 text-[0.8125rem] font-semibold whitespace-nowrap text-primary">
          <span className="group-open:hidden">
            {fotos.length > 1 ? "Ver fotos" : "Ver foto"}
          </span>
          <span className="hidden group-open:inline">Ocultar</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open:rotate-180"
          />
        </span>
      </summary>
      {/* Las fotos van centradas y crecen con el ancho de la pantalla. */}
      <div
        className={cn(
          "flex flex-wrap items-start justify-center gap-4 px-3.5 pb-4",
          conEtiquetas && "gap-x-8",
        )}
      >
        {fotos.map((f) => (
          <FotoAmpliable
            key={f.foto}
            clave={f.foto}
            alt={f.alt}
            leyenda={f.leyenda}
            etiqueta={f.etiqueta}
            className={
              f.grande
                ? "w-full max-w-[25rem] lg:max-w-[32rem]"
                : "w-[calc(50%-0.5rem)] max-w-[15rem] md:w-60 lg:w-72 lg:max-w-[18rem]"
            }
          />
        ))}
      </div>
    </details>
  );
}

function FilaFija({ item }: { item: Item }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1.5rem_1fr] items-start gap-3 rounded-2xl p-3.5 text-sm",
        item.tipo === "nota" ? "bg-accent/50" : "border",
      )}
    >
      <Marca item={item} />
      <Texto item={item} />
    </div>
  );
}

/** Las filas de una guía: los pasos y las notas que no son pasos; las que tienen fotos las esconden hasta "Ver foto". */
export function GuiaAcordeon({
  items,
  children,
}: {
  items: Item[];
  children?: ReactNode;
}) {
  const grupo = useId();
  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      {items.map((item) =>
        item.tipo === "grupo" ? (
          <h3
            key={item.texto}
            className="mt-2 font-heading text-base font-extrabold tracking-tight first:mt-0"
          >
            {item.texto}
          </h3>
        ) : item.fotos?.length ? (
          <FilaConFotos key={item.texto} item={item} grupo={grupo} />
        ) : (
          <FilaFija key={item.texto} item={item} />
        ),
      )}
      {children}
    </div>
  );
}
