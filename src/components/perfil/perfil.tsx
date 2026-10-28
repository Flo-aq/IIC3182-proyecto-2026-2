"use client";

import { Pencil, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BotonCuenta } from "@/components/boton-cuenta";
import { EnlacesAyuda } from "@/components/enlace-ayuda";
import { Logo } from "@/components/logo";
import { NotificarDialog, type Aviso, textoAviso } from "@/components/responder/notificar-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEsPantallaAncha, useOrigen } from "@/lib/cliente";
import type { PlantillaDeCuenta } from "@/lib/plantillas";
import { avisarTopeReunion, avisarTopeTotal } from "@/lib/avisos-tags";
import { type ReunionDePerfil, MAX_TAGS_POR_REUNION, MAX_TAGS_TOTALES, ORDEN_INICIAL, type Orden, type Tipo, buscarTag, filtrar, ordenar, todosLosTags } from "@/lib/perfil";
import { cn } from "@/lib/utils";
import { FilaReunion } from "./fila-reunion";
import { FiltrosHoja, FiltrosLateral } from "./filtros";
import { PlantillasPerfil } from "./plantillas-perfil";

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

/**
 * El perfil: las reuniones que creaste y las que respondiste, con sus tags.
 * Se filtran por tipo y por tag, se ordenan por fecha o por nombre, y los tags se agregan y se quitan desde aquí.
 */
export function Perfil({ reunionesIniciales, plantillasIniciales }: { reunionesIniciales: ReunionDePerfil[]; plantillasIniciales: PlantillaDeCuenta[] }) {
  const escritorio = useEsPantallaAncha();
  const origen = useOrigen();
  const [reuniones, setReuniones] = useState<ReunionDePerfil[]>(reunionesIniciales);
  const [tipo, setTipo] = useState<Tipo>("todas");
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [orden, setOrden] = useState<Orden>(ORDEN_INICIAL);
  const [editando, setEditando] = useState(false);
  const [hoja, setHoja] = useState(false);
  /** La reunión cuyo aviso se está pidiendo o cambiando. */
  const [avisoDe, setAvisoDe] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [vista, setVista] = useState<"reuniones" | "plantillas">("reuniones");
  const [plantillas, setPlantillas] = useState<PlantillaDeCuenta[]>(plantillasIniciales);

  const tags = useMemo(() => todosLosTags(reuniones), [reuniones]);
  // Los tags de la cuenta son los de las reuniones y los de las plantillas.
  const tagsDeLaCuenta = useMemo(() => [...new Set([...tags, ...plantillas.flatMap((p) => p.tags)])].sort((a, b) => a.localeCompare(b, "es")), [tags, plantillas]);
  // Si el último tag que filtraba se quita de todas las reuniones, deja de contar como filtro.
  const activos = useMemo(() => elegidos.filter((t) => tags.includes(t)), [elegidos, tags]);
  const visibles = useMemo(() => ordenar(filtrar(reuniones, tipo, activos), orden), [reuniones, tipo, activos, orden]);

  const conteoTipos: Record<Tipo, number> = {
    todas: reuniones.length,
    creada: reuniones.filter((r) => r.rol === "creada").length,
    respondida: reuniones.filter((r) => r.rol === "respondida").length,
  };
  const conteoTags = Object.fromEntries(tags.map((t) => [t, reuniones.filter((r) => r.tags.includes(t)).length]));
  const nFiltros = (tipo !== "todas" ? 1 : 0) + activos.length;

  const cambiar = (slug: string, cambio: (r: ReunionDePerfil) => ReunionDePerfil) => setReuniones((rs) => rs.map((r) => (r.slug === slug ? cambio(r) : r)));
  /** Agrega el tag a la reunión si hay lugar. Devuelve si lo agregó; si no, avisa por qué. */
  const agregarTag = (r: ReunionDePerfil, escrito: string): boolean => {
    // Si ya existe con otras mayúsculas ("ihc" y "IHC"), se usa el que ya existe.
    const tag = buscarTag(escrito, tags) ?? escrito;
    if (r.tags.includes(tag)) return true;
    if (r.tags.length >= MAX_TAGS_POR_REUNION) {
      avisarTopeReunion();
      return false;
    }
    if (!tags.includes(tag) && tags.length >= MAX_TAGS_TOTALES) {
      avisarTopeTotal();
      return false;
    }
    cambiar(r.slug, (x) => ({ ...x, tags: [...x.tags, tag] }));
    return true;
  };

  const alternarTag = (tag: string) => setElegidos((e) => (e.includes(tag) ? e.filter((t) => t !== tag) : [...e, tag]));
  const cambiarOrden = (clave: Orden["clave"]) =>
    setOrden((o) => (o.clave === clave ? { clave, sentido: o.sentido === "asc" ? "desc" : "asc" } : { clave, sentido: clave === "fecha" ? "desc" : "asc" }));
  const limpiar = () => {
    setTipo("todas");
    setElegidos([]);
    setOrden(ORDEN_INICIAL);
  };

  const copiar = async (r: ReunionDePerfil) => {
    try {
      await navigator.clipboard.writeText(`${origen}/e/${r.slug}`);
      toast.success("Link copiado");
      setCopiado(r.slug);
      setTimeout(() => setCopiado((c) => (c === r.slug ? null : c)), 1600);
    } catch {
      toast.error("No se pudo copiar. Cópialo desde la barra de direcciones de la reunión.");
    }
  };

  const reunionDelAviso = reuniones.find((r) => r.slug === avisoDe) ?? null;
  const propsFiltros = { conteoTipos, tipo, onTipo: setTipo, orden, onOrden: cambiarOrden, tags, conteoTags, activos, onTag: alternarTag };

  const botonEditar = (
    <Button
      type="button"
      variant="ghost"
      className={cn(BOTON.texto, editando && "text-foreground underline")}
      aria-pressed={editando}
      onClick={() => setEditando((e) => !e)}
    >
      <Pencil />
      {editando ? "Listo" : "Editar tags"}
    </Button>
  );

  const lista = visibles.length ? (
    <ul>
      {visibles.map((r) => (
        <FilaReunion
          key={r.slug}
          reunion={r}
          tags={tags}
          editando={editando}
          onQuitarTag={(t) => cambiar(r.slug, (x) => ({ ...x, tags: x.tags.filter((y) => y !== t) }))}
          onAgregarTag={(t) => agregarTag(r, t)}
          onTopeReunion={avisarTopeReunion}
          onAviso={() => setAvisoDe(r.slug)}
          onQuitarAviso={() => {
            cambiar(r.slug, (x) => ({ ...x, aviso: null }));
            toast.success("Aviso quitado");
          }}
          onCopiar={() => copiar(r)}
          copiado={copiado === r.slug}
        />
      ))}
    </ul>
  ) : (
    <p className="mt-4 rounded-2xl border-[1.5px] border-dashed p-5 text-center text-sm text-muted-foreground">Ninguna reunión coincide. Quita un filtro para ver más.</p>
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full flex-col bg-background pb-8 lg:max-w-[88rem]">
      <header className={`flex h-12 shrink-0 items-center justify-between ${PAD}`}>
        <Link href="/" className="flex items-center gap-1" aria-label="WeMeet, ir al inicio">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">WeMeet</span>
        </Link>
        <div className="flex items-center gap-1">
          <EnlacesAyuda />
          <Link href="/" aria-label="Crear una reunión" title="Crear una reunión" className={buttonVariants({ size: "icon", className: "size-9 rounded-full" })}>
            <Plus />
          </Link>
          <BotonCuenta />
        </div>
      </header>

      <main className={`mx-auto flex w-full max-w-2xl flex-col lg:max-w-none ${PAD}`}>
        <h1 className="mt-2 font-heading text-xl font-extrabold tracking-tight">Tu perfil</h1>

        <div role="tablist" aria-label="Secciones del perfil" className="mt-2 flex gap-5 border-b">
          {(
            [
              ["reuniones", "Reuniones", reuniones.length],
              ["plantillas", "Plantillas", plantillas.length],
            ] as const
          ).map(([id, texto, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={vista === id}
              onClick={() => setVista(id)}
              className={cn("-mb-px border-b-[3px] border-transparent py-2.5 text-sm font-bold text-muted-foreground", vista === id && "border-primary text-foreground")}
            >
              {texto} <span className="font-semibold text-muted-foreground">{n}</span>
            </button>
          ))}
        </div>

        {vista === "plantillas" ? (
          <PlantillasPerfil plantillas={plantillas} onCambiar={setPlantillas} tagsDeLaCuenta={tagsDeLaCuenta} />
        ) : (
          <>
            <div className="mt-2 flex items-center justify-between gap-2">
              {escritorio ? (
                <span className="text-xs text-muted-foreground">
                  {visibles.length} de {reuniones.length} reuniones
                </span>
              ) : (
                <Button type="button" variant="outline" className={BOTON.compacto} aria-haspopup="dialog" onClick={() => setHoja(true)}>
                  <SlidersHorizontal />
                  Filtros
                  {nFiltros > 0 && <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] leading-[1.125rem] text-primary-foreground">{nFiltros}</span>}
                </Button>
              )}
              {botonEditar}
            </div>

            {escritorio ? (
              <div className="mt-2 grid grid-cols-[13rem_minmax(0,1fr)] gap-8">
                <FiltrosLateral {...propsFiltros} />
                <div>{lista}</div>
              </div>
            ) : (
              lista
            )}
          </>
        )}
      </main>

      {!escritorio && (
        <Dialog open={hoja} onOpenChange={setHoja}>
          <DialogContent
            showCloseButton={false}
            className="top-auto bottom-0 left-0 max-h-[88dvh] w-full max-w-full translate-x-0 translate-y-0 gap-4 overflow-y-auto rounded-t-3xl rounded-b-none p-4 pb-[max(1rem,env(safe-area-inset-bottom))] data-open:slide-in-from-bottom data-open:zoom-in-100 data-closed:slide-out-to-bottom data-closed:zoom-out-100 sm:max-w-full"
          >
            <DialogHeader className="flex-row items-center justify-between gap-2">
              <DialogTitle className="font-heading text-lg font-extrabold tracking-tight">Filtros</DialogTitle>
              <Button type="button" variant="ghost" className={BOTON.texto} onClick={limpiar}>
                Limpiar
              </Button>
            </DialogHeader>
            <DialogDescription className="sr-only">Elige qué reuniones ver, cómo ordenarlas y por qué tags.</DialogDescription>
            <FiltrosHoja {...propsFiltros} />
            <Button type="button" className={BOTON.principal} onClick={() => setHoja(false)}>
              Ver {visibles.length} {visibles.length === 1 ? "reunión" : "reuniones"}
            </Button>
          </DialogContent>
        </Dialog>
      )}

      {reunionDelAviso && (
        <NotificarDialog
          key={reunionDelAviso.slug}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setAvisoDe(null);
          }}
          respondieron={reunionDelAviso.respuestas}
          inicial={null}
          onGuardar={(a: Aviso) => {
            cambiar(reunionDelAviso.slug, (x) => ({ ...x, aviso: a }));
            toast.success("Aviso activado", { description: `Te avisaremos ${textoAviso(a)} a ${a.correo}.` });
          }}
        />
      )}
    </div>
  );
}
