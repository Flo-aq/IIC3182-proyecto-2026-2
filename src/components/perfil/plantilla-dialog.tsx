"use client";

import { ListaBloqueos } from "@/components/compartidos/lista-bloqueos";
import { TITULO } from "@/lib/utilidades/estilos";
import { Pencil } from "lucide-react";
import { useState } from "react";

import { Etiquetas } from "@/components/formularios/etiquetas";
import { Campo } from "@/components/comunes/campo";
import { Badge } from "@/components/ui/badge";
import { FilasAcordeon, useFilasConfiguracion } from "@/components/formularios/filas-configuracion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { BOTON } from "@/lib/utilidades/botones";
import { type PlantillaDeCuenta, comoPlantilla, comoReunion, problemasDePlantilla } from "@/lib/cuenta/plantillas";
import { POR_DEFECTO, type Plantilla, type Reunion, textoHorario } from "@/lib/reunion";

let contadorDeIds = 0;
/** Un id para cada regla de bloqueo (solo sirve dentro de este formulario). */
const nuevoId = () => `r${++contadorDeIds}`;

/** Lo que trae una plantilla nueva. */
const NUEVA: Plantilla = { nombre: "", detalle: "", bloqueMin: 30, desde: POR_DEFECTO.desde, hasta: POR_DEFECTO.hasta, claves: 0, bloqueos: [] };

/** Cómo va quedando la plantilla: lo mismo que el resumen de crear una reunión, sin los días ni la zona horaria, y con sus tags. */
function ResumenPlantilla({ r, tags }: { r: Reunion; tags: string[] }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div className="grid grid-cols-2 items-start gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">Horario</dt>
          <dd className="font-semibold break-words">{textoHorario(r)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Cada bloque dura</dt>
          <dd className="font-semibold">{r.bloqueMin} min</dd>
        </div>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Horarios bloqueados</dt>
        {r.bloqueos.length ? (
          <dd>
            <ListaBloqueos bloqueos={r.bloqueos} dias={() => "Todos los días"} className="mt-1" />
          </dd>
        ) : (
          <dd className="font-semibold">Ninguno</dd>
        )}
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Integrantes clave</dt>
        <dd className="font-semibold">{r.claves}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Tags</dt>
        {tags.length ? (
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Badge key={t} className="max-w-full truncate">
                {t}
              </Badge>
            ))}
          </dd>
        ) : (
          <dd className="font-semibold">Ninguno</dd>
        )}
      </div>
    </dl>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La plantilla que se edita; si no hay, se crea una nueva. */
  inicial: PlantillaDeCuenta | null;
  /** Los nombres de las demás plantillas, para que no se repitan. */
  otrosNombres: string[];
  /** Todos los tags de la cuenta, para elegirlos con un toque. */
  tagsDeLaCuenta: string[];
  onGuardar: (plantilla: Plantilla, tags: string[]) => void;
};

/**
 * Crear o editar una plantilla, con el mismo formulario que crear una reunión (nombre y filas plegables) pero sin los días ni la zona
 * horaria, y con el resumen a la vista: al costado en pantalla ancha y, en el celular, desde "Ver resumen".
 * Hay que montarlo de nuevo (con `key`) para cada plantilla, para que parta con sus datos.
 */
export function PlantillaDialog({ open, onOpenChange, inicial, otrosNombres, tagsDeLaCuenta, onGuardar }: Props) {
  const [r, setR] = useState<Reunion>(() => comoReunion(inicial ?? NUEVA, nuevoId));
  const [etiquetas, setEtiquetas] = useState<string[]>(inicial?.tags ?? []);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [intento, setIntento] = useState(false);
  const [verResumen, setVerResumen] = useState(false);
  const cambiar = (parcial: Partial<Reunion>) => setR((prev) => ({ ...prev, ...parcial }));

  const pendientes = intento ? problemasDePlantilla(r, otrosNombres) : [];
  const malos = new Set<string>(pendientes.map((p) => p.campo));
  const errorNombre = pendientes.find((p) => p.campo === "nombre");
  const filas = [
    ...useFilasConfiguracion({ r, cambiar, nuevoId, sinDias: true }),
    {
      id: "etiquetas",
      etiqueta: "Tags",
      obligatorio: false,
      resumen: etiquetas.length ? etiquetas.join(", ") : "Ninguno",
      contenido: (
        <Etiquetas elegidos={etiquetas} onChange={setEtiquetas} deLaCuenta={tagsDeLaCuenta} sujeto="Esta plantilla" ayuda="Las reuniones que crees con ella los llevarán." />
      ),
    },
  ];

  const guardar = () => {
    const faltan = problemasDePlantilla(r, otrosNombres);
    if (faltan.length) {
      setIntento(true);
      if (faltan[0].campo !== "nombre") setAbierto(faltan[0].campo);
      return;
    }
    onGuardar(comoPlantilla(r), etiquetas);
    onOpenChange(false);
  };

  const titulo = inicial ? "Editar plantilla" : "Nueva plantilla";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg lg:max-w-4xl">
        <div className="shrink-0 px-5 pt-5 pb-3">
          <DialogTitle className={TITULO.grande}>{titulo}</DialogTitle>
          <DialogDescription className="mt-1 text-sm">Lo que se repite de una reunión a otra. Los días los eliges cada vez que la usas.</DialogDescription>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className={`min-h-0 flex-col gap-3 overflow-y-auto px-5 pb-3 ${verResumen ? "hidden lg:flex" : "flex"}`}>
            <Campo id="nombre-plantilla" etiqueta="Nombre de la plantilla" obligatorio errorAlLado error={errorNombre?.mensaje}>
              {(campo) => (
                <div className="relative">
                  <Input
                    {...campo}
                    value={r.titulo}
                    maxLength={50}
                    autoComplete="off"
                    placeholder="Ej: Reunión de cátedra · 30 min"
                    className="h-12 rounded-2xl border-[1.5px] pr-11 pl-3.5 text-base"
                    onChange={(e) => cambiar({ titulo: e.target.value })}
                  />
                  <Pencil aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
            </Campo>
            <FilasAcordeon filas={filas} abierto={abierto} onAbierto={setAbierto} malos={malos} />
          </div>

          {/* El resumen: siempre a la vista en pantalla ancha; en el celular, en lugar del formulario. */}
          <aside aria-label="Resumen de la plantilla" className={`min-h-0 flex-col overflow-y-auto px-5 pb-3 lg:flex lg:border-l ${verResumen ? "flex" : "hidden"}`}>
            <h3 className={`pb-3 font-heading text-lg font-extrabold tracking-tight break-words ${r.titulo.trim() ? "" : "text-muted-foreground"}`}>{r.titulo.trim() || "Sin nombre todavía"}</h3>
            <ResumenPlantilla r={r} tags={etiquetas} />
          </aside>
        </div>

        <div className="grid shrink-0 gap-2 border-t px-5 pt-3 pb-5">
          <Button type="button" variant="outline" className={`${BOTON.secundario} lg:hidden`} onClick={() => setVerResumen((v) => !v)}>
            {verResumen ? "Volver al formulario" : "Ver resumen"}
          </Button>
          <Button type="button" className={BOTON.principal} onClick={guardar}>
            {inicial ? "Guardar cambios" : "Guardar plantilla"}
          </Button>
          <Button type="button" variant="ghost" className={`${BOTON.cancelar} justify-self-center`} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
