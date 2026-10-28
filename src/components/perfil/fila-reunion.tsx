"use client";

import { Bell, BellOff, Check, Copy, Plus, X } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { textoAviso } from "@/components/responder/notificar-dialog";
import { MAX_TAG, type ReunionDePerfil, MAX_TAGS_POR_REUNION, MAX_TAGS_TOTALES, buscarTag, normalizarTag, textoFecha, textoRespuestas } from "@/lib/perfil";
import { cn } from "@/lib/utils";

type Props = {
  reunion: ReunionDePerfil;
  /** Todos los tags que tiene el usuario, para sugerirlos al agregar. */
  tags: string[];
  /** Con el modo "Editar tags" activo, cada tag muestra su ✕ y aparece "+ etiqueta". */
  editando: boolean;
  onQuitarTag: (tag: string) => void;
  /** Devuelve si se pudo agregar; si no (por los topes), la pantalla ya avisó por qué. */
  onAgregarTag: (tag: string) => boolean;
  /** Se toca "+ etiqueta" en una reunión que ya llegó a su máximo de tags. */
  onTopeReunion: () => void;
  /** Abre la ventana de Notificarme para esta reunión. */
  onAviso: () => void;
  onQuitarAviso: () => void;
  onCopiar: () => void;
  copiado: boolean;
};

/** Los botones de aviso y copiar: solo un icono en el celular, y con texto desde lg. Es el botón compacto, redondo cuando no tiene texto. */
const BOTON_ICONO = "size-9 rounded-full lg:h-9 lg:w-auto lg:gap-1.5 lg:px-3.5 text-[0.8125rem] font-bold";

/** Campana con el estado del aviso. Al tocarla se ve cuándo se avisa y a qué correo. */
function AvisoBoton({ reunion: r, onAviso, onQuitarAviso }: Pick<Props, "reunion" | "onAviso" | "onQuitarAviso">) {
  const [abierto, setAbierto] = useState(false);
  const a = r.aviso;
  const texto = a ? "Avisar" : "No avisar";
  const cuando = a ? textoAviso(a) : "";
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn(BOTON_ICONO, a ? "border-accent bg-accent text-primary hover:bg-accent" : "text-muted-foreground")}
            aria-label={`${texto}: ver cuándo y a qué correo (${r.titulo})`}
          />
        }
      >
        {a ? <Bell /> : <BellOff />}
        <span className="hidden lg:inline">{texto}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-3 rounded-2xl p-3.5">
        <h3 className="text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">Aviso por correo</h3>
        {a ? (
          <>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Cuándo te avisamos</dt>
                <dd className="font-semibold">{cuando.charAt(0).toUpperCase() + cuando.slice(1)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">A qué correo</dt>
                <dd className="font-semibold break-all">{a.correo}</dd>
              </div>
            </dl>
            <Button
              type="button"
              variant="ghost"
              className={`${BOTON.peligro} self-start`}
              onClick={() => {
                setAbierto(false);
                onQuitarAviso();
              }}
            >
              Quitar aviso
            </Button>
            <p className="text-xs text-muted-foreground">Un aviso no se puede editar: para cambiarlo, quítalo y pide uno nuevo.</p>
          </>
        ) : (
          <>
            <p className="text-sm">No pediste aviso para esta reunión.</p>
            <Button
              type="button"
              className={BOTON.confirmar}
              onClick={() => {
                setAbierto(false);
                onAviso();
              }}
            >
              Avisar
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** "+ etiqueta": sugiere los tags que la reunión todavía no tiene y deja crear uno nuevo. */
function AgregarTag({ reunion: r, tags, onAgregarTag }: Pick<Props, "reunion" | "tags" | "onAgregarTag">) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const idCampo = useId();
  const libres = tags.filter((t) => !r.tags.includes(t));
  const sinLugarParaNuevos = tags.length >= MAX_TAGS_TOTALES;
  const nuevo = normalizarTag(texto);

  const agregar = (tag: string) => {
    const limpio = normalizarTag(tag);
    // Si no se pudo (por los topes), el aviso ya salió y el recuadro queda abierto para que se pueda elegir otro tag.
    if (!limpio || !onAgregarTag(limpio)) return;
    setTexto("");
    setAbierto(false);
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={<button type="button" className="inline-flex h-6 items-center gap-1 rounded-full border-[1.5px] border-dashed px-2.5 text-xs font-bold text-primary" />}
        aria-label={`Agregar un tag a ${r.titulo}`}
      >
        <Plus aria-hidden="true" className="size-3" />
        etiqueta
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-2 rounded-2xl p-2.5">
        {libres.length > 0 && (
          <div className="flex flex-col">
            <h3 className="px-2 pb-1 text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">Agregar</h3>
            {libres.map((t) => (
              <button key={t} type="button" className="rounded-lg px-2 py-2 text-left text-sm font-semibold hover:bg-muted" onClick={() => agregar(t)}>
                # {t}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex gap-1.5 border-t pt-2 first:border-t-0 first:pt-0"
          onSubmit={(e) => {
            e.preventDefault();
            agregar(texto);
          }}
        >
          <label htmlFor={idCampo} className="sr-only">
            Nombre del tag nuevo
          </label>
          <Input id={idCampo} value={texto} maxLength={MAX_TAG} autoComplete="off" placeholder="Crear tag nuevo" className="h-9 rounded-full px-3" onChange={(e) => setTexto(e.target.value)} />
          <Button type="submit" variant="outline" className={BOTON.compacto} disabled={!nuevo}>
            Crear
          </Button>
        </form>
        <p role="status" className="px-1 text-xs text-muted-foreground">
          {sinLugarParaNuevos && !buscarTag(nuevo, tags)
            ? `Ya tienes ${MAX_TAGS_TOTALES} tags, el máximo. Quita alguno para crear otro.`
            : `Esta reunión tiene ${r.tags.length} de ${MAX_TAGS_POR_REUNION} tags.`}
        </p>
      </PopoverContent>
    </Popover>
  );
}

/** Una reunión del perfil: cuándo la creaste o respondiste, sus tags, cuántas respuestas tiene, el aviso y copiar el link. */
export function FilaReunion({ reunion: r, tags, editando, onQuitarTag, onAgregarTag, onTopeReunion, onAviso, onQuitarAviso, onCopiar, copiado }: Props) {
  return (
    <li className="border-b py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/e/${r.slug}`} className="line-clamp-2 font-heading text-[0.9375rem] font-extrabold [overflow-wrap:anywhere] hover:underline">
            {r.titulo}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {textoFecha(r)} · {textoRespuestas(r.respuestas)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AvisoBoton reunion={r} onAviso={onAviso} onQuitarAviso={onQuitarAviso} />
          <Button type="button" variant="outline" className={cn(BOTON_ICONO, "text-primary")} aria-label={`Copiar el link de ${r.titulo}`} onClick={onCopiar}>
            {copiado ? <Check /> : <Copy />}
            <span className="hidden lg:inline">{copiado ? "Copiado" : "Copiar link"}</span>
          </Button>
        </div>
      </div>
      <ul className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Tags">
        <li className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-bold">{r.rol === "creada" ? "Creada" : "Respondida"}</li>
        {r.tags.map((t) => (
          <li key={t} className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
            <span className="truncate">{t}</span>
            {editando && (
              <button type="button" className="-mr-1 grid size-4 place-items-center rounded-full hover:bg-primary/15" aria-label={`Quitar el tag ${t} de ${r.titulo}`} onClick={() => onQuitarTag(t)}>
                <X aria-hidden="true" className="size-3" />
              </button>
            )}
          </li>
        ))}
        {editando &&
          (r.tags.length >= MAX_TAGS_POR_REUNION ? (
            <li>
              <button
                type="button"
                aria-disabled="true"
                aria-label={`${r.titulo} ya tiene ${MAX_TAGS_POR_REUNION} tags, el máximo`}
                className="inline-flex h-6 items-center gap-1 rounded-full border-[1.5px] border-dashed px-2.5 text-xs font-bold text-muted-foreground"
                onClick={onTopeReunion}
              >
                <Plus aria-hidden="true" className="size-3" />
                etiqueta · máximo {MAX_TAGS_POR_REUNION}
              </button>
            </li>
          ) : (
            <li>
              <AgregarTag reunion={r} tags={tags} onAgregarTag={onAgregarTag} />
            </li>
          ))}
      </ul>
    </li>
  );
}
