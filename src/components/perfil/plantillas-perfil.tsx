"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  actualizarPlantilla as actualizarPlantillaApi,
  borrarPlantilla as borrarPlantillaApi,
  crearPlantilla as crearPlantillaApi,
} from "@/lib/api-cuenta";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { BOTON } from "@/lib/botones";
import { type PlantillaDeCuenta, detalleDe } from "@/lib/plantillas";
import type { Plantilla } from "@/lib/reunion";
import { cn } from "@/lib/utils";
import { PlantillaDialog } from "./plantilla-dialog";

type Props = {
  plantillas: PlantillaDeCuenta[];
  onCambiar: Dispatch<SetStateAction<PlantillaDeCuenta[]>>;
  /** Todos los tags de la cuenta (de reuniones y de plantillas). */
  tagsDeLaCuenta: string[];
};

/** Los botones de Editar, Duplicar y Borrar: solo el icono en el celular; con texto desde lg. */
const ICONO = "size-9 rounded-full lg:h-9 lg:w-auto lg:gap-1.5 lg:px-2.5";

/** Id provisional mientras el servidor guarda la plantilla; después se reemplaza por el real. */
let contadorDeIds = 0;
const nuevoId = () => `provisional-${++contadorDeIds}`;

/** Un nombre que no se repita: "Reunión (copia)", "Reunión (copia 2)"… */
function nombreDeCopia(nombre: string, existentes: string[]): string {
  const usados = new Set(existentes.map((n) => n.toLowerCase()));
  let candidato = `${nombre} (copia)`;
  for (let i = 2; usados.has(candidato.toLowerCase()); i++) candidato = `${nombre} (copia ${i})`;
  return candidato;
}

/**
 * Tus plantillas: lo que se repite de una reunión a otra. Se ven, se usan al crear una reunión, se crean, se editan,
 * se duplican y se borran, siempre con todas las acciones a la vista.
 */
export function PlantillasPerfil({ plantillas, onCambiar, tagsDeLaCuenta }: Props) {
  /** La plantilla que se edita ("nueva" para crear una). */
  const [editor, setEditor] = useState<{ id: string | "nueva"; clave: number } | null>(null);
  const [porBorrar, setPorBorrar] = useState<PlantillaDeCuenta | null>(null);

  const enEdicion = editor && editor.id !== "nueva" ? (plantillas.find((p) => p.id === editor.id) ?? null) : null;

  // Los cambios se ven al instante; si el servidor los rechaza, se deshacen y se avisa por qué.
  const guardar = async (p: Plantilla, tags: string[]) => {
    if (enEdicion) {
      const antes = enEdicion;
      const id = antes.id;
      onCambiar((ps) => ps.map((x) => (x.id === id ? { ...p, id, tags } : x)));
      try {
        const guardada = await actualizarPlantillaApi(id, p, tags);
        onCambiar((ps) => ps.map((x) => (x.id === id ? guardada : x)));
        toast.success("Cambios guardados", { description: p.nombre });
      } catch (e) {
        onCambiar((ps) => ps.map((x) => (x.id === id ? antes : x)));
        toast.error((e as Error).message);
      }
    } else {
      const temporal = nuevoId();
      onCambiar((ps) => [{ ...p, id: temporal, tags }, ...ps]);
      try {
        const creada = await crearPlantillaApi(p, tags);
        onCambiar((ps) => ps.map((x) => (x.id === temporal ? creada : x)));
        toast.success("Plantilla creada", { description: p.nombre });
      } catch (e) {
        onCambiar((ps) => ps.filter((x) => x.id !== temporal));
        toast.error((e as Error).message);
      }
    }
  };

  const duplicar = async (p: PlantillaDeCuenta) => {
    const nombre = nombreDeCopia(p.nombre, plantillas.map((x) => x.nombre));
    const copia: PlantillaDeCuenta = { ...p, id: nuevoId(), nombre, tags: [...p.tags], bloqueos: p.bloqueos.map((b) => ({ ...b })) };
    onCambiar((ps) => {
      const i = ps.findIndex((x) => x.id === p.id);
      return [...ps.slice(0, i + 1), copia, ...ps.slice(i + 1)];
    });
    try {
      const creada = await crearPlantillaApi({ ...p, nombre }, p.tags);
      onCambiar((ps) => ps.map((x) => (x.id === copia.id ? creada : x)));
      toast.success("Plantilla duplicada", { description: nombre });
    } catch (e) {
      onCambiar((ps) => ps.filter((x) => x.id !== copia.id));
      toast.error((e as Error).message);
    }
  };

  const borrar = async (p: PlantillaDeCuenta) => {
    const i = plantillas.findIndex((x) => x.id === p.id);
    onCambiar((ps) => ps.filter((x) => x.id !== p.id));
    try {
      await borrarPlantillaApi(p.id);
      toast.success("Plantilla borrada", { description: p.nombre });
    } catch (e) {
      onCambiar((ps) => [...ps.slice(0, i), p, ...ps.slice(i)]);
      toast.error((e as Error).message);
    }
  };

  return (
    <section aria-labelledby="titulo-plantillas" className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="titulo-plantillas" className="font-heading text-lg font-extrabold tracking-tight">
          Tus plantillas
        </h2>
        <Button type="button" className={BOTON.confirmar} aria-haspopup="dialog" onClick={() => setEditor({ id: "nueva", clave: Date.now() })}>
          <Plus />
          Nueva plantilla
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Al crear una reunión, tus plantillas aparecen junto a las de WeMeet.</p>

      {plantillas.length ? (
        <ul className="mt-1">
          {plantillas.map((p) => (
            <li key={p.id} className="border-b py-3.5">
              <div className="flex items-start justify-between gap-2">
                {/* El título se corta con "…": en una línea en el celular y en dos desde lg. */}
                <h3 className="line-clamp-1 min-w-0 flex-1 pt-1.5 font-heading text-[0.9375rem] font-extrabold [overflow-wrap:anywhere] lg:line-clamp-2" title={p.nombre}>
                  {p.nombre}
                </h3>
                <div className="-mt-0.5 -mr-1.5 flex shrink-0 items-center gap-0.5">
                  <Link href={`/?plantilla=${p.id}`} className={cn("mr-1.5 inline-flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted", BOTON.compacto)} aria-label={`Usar ${p.nombre} para crear una reunión`}>
                    Usar
                  </Link>
                  <Button type="button" variant="ghost" className={cn(BOTON.texto, ICONO)} aria-label={`Editar ${p.nombre}`} aria-haspopup="dialog" onClick={() => setEditor({ id: p.id, clave: Date.now() })}>
                    <Pencil />
                    <span className="hidden lg:inline">Editar</span>
                  </Button>
                  <Button type="button" variant="ghost" className={cn(BOTON.texto, ICONO)} aria-label={`Duplicar ${p.nombre}`} onClick={() => duplicar(p)}>
                    <Copy />
                    <span className="hidden lg:inline">Duplicar</span>
                  </Button>
                  <Button type="button" variant="ghost" className={cn(BOTON.peligro, ICONO)} aria-label={`Borrar ${p.nombre}`} aria-haspopup="dialog" onClick={() => setPorBorrar(p)}>
                    <Trash2 />
                    <span className="hidden lg:inline">Borrar</span>
                  </Button>
                </div>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{detalleDe(p)}</p>
              {p.tags.length > 0 && (
                <ul aria-label="Tags" className="mt-1.5 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <li key={t} className="max-w-full truncate rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl border-[1.5px] border-dashed p-5 text-center text-sm text-muted-foreground">Todavía no tienes plantillas. Crea una con “Nueva plantilla”.</p>
      )}

      {editor && (
        <PlantillaDialog
          key={`${editor.id}-${editor.clave}`}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setEditor(null);
          }}
          inicial={enEdicion}
          otrosNombres={plantillas.filter((p) => p.id !== enEdicion?.id).map((p) => p.nombre)}
          tagsDeLaCuenta={tagsDeLaCuenta}
          onGuardar={guardar}
        />
      )}

      <Dialog open={porBorrar !== null} onOpenChange={(abierto) => !abierto && setPorBorrar(null)}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] gap-4 rounded-3xl p-5 text-center sm:max-w-sm">
          <div>
            <DialogTitle className="font-heading text-lg font-extrabold tracking-tight break-words">¿Borrar “{porBorrar?.nombre}”?</DialogTitle>
            <DialogDescription className="mt-1.5 text-sm">Las reuniones que ya creaste con ella no cambian.</DialogDescription>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className={BOTON.secundario} onClick={() => setPorBorrar(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(BOTON.secundario, "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive")}
              onClick={() => {
                if (!porBorrar) return;
                void borrar(porBorrar);
                setPorBorrar(null);
              }}
            >
              Borrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
