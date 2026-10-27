"use client";

import { ChevronLeft, ChevronRight, Hand, Info, PaintBucket, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { EnlacesAyuda } from "@/components/enlace-ayuda";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  type PersonaSet,
  type ReunionConRespuestas,
  columnasDe,
  conjuntos,
  esSemanal,
  etiquetaRango,
  mapaBloqueados,
  semanasDe,
} from "@/lib/respuestas";
import { Compartir } from "./compartir";
import { DetallesDialog } from "./detalles-dialog";
import { Grilla } from "./grilla";
import { Acceso, MenuUsuario } from "./identidad";
import { Leyenda } from "./leyenda";
import { QuienPuede } from "./quien-puede";

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";
const PESTANAS = ["Mi horario", "Respuestas", "Compartir"] as const;

const sinSuscripcion = () => () => {};

/** Pantalla de quien recibe el link: marca cuándo puede, mira al grupo y comparte el estado. */
export function Responder({ datos }: { datos: ReunionConRespuestas }) {
  const { reunion: r, slug } = datos;
  const [pestana, setPestana] = useState(0);
  const [mias, setMias] = useState<Set<string>>(new Set());
  const [guardadas, setGuardadas] = useState<string[] | null>(null);
  const [nombre, setNombre] = useState("");
  /** Casilla "Soy integrante clave" de quien responde por primera vez. */
  const [clave, setClave] = useState(false);
  /** Ya dijiste quién eres: se muestra la grilla en vez de la pantalla de acceso. */
  const [listo, setListo] = useState(false);
  /** Nombre de la respuesta que ya existía y se está editando (escribir el mismo nombre equivale a entrar). */
  const [retomada, setRetomada] = useState<string | null>(null);
  const [verDetalles, setVerDetalles] = useState(false);
  const [semana, setSemana] = useState(0);
  const [fijado, setFijado] = useState<string | null>(null);
  const [visto, setVisto] = useState<string | null>(null);
  const [desborda, setDesborda] = useState(false);
  const [pintar, setPintar] = useState(false);

  const origen = useSyncExternalStore(sinSuscripcion, () => window.location.origin, () => "https://wemeet.app");
  const enlace = `${origen}/e/${slug}`;

  const bloqueados = useMemo(() => mapaBloqueados(r), [r]);
  const semanal = esSemanal(r);
  const semanas = semanasDe(r.dias);
  const columnas = columnasDe(r, semana);

  const buscado = nombre.trim().toLowerCase();
  const existente = buscado ? datos.personas.find((p) => p.nombre.trim().toLowerCase() === buscado) : undefined;

  // Si edito una respuesta que ya existía, esa persona soy yo: no se cuenta dos veces ni ocupa un lugar clave extra.
  const otros = useMemo(() => datos.personas.filter((p) => p.nombre !== retomada), [datos.personas, retomada]);
  const hayClaves = r.claves > 0;
  const clavesLlenas = !hayClaves || otros.filter((p) => p.clave).length >= r.claves;
  const esClave = retomada ? Boolean(datos.personas.find((p) => p.nombre === retomada)?.clave) : clave && !clavesLlenas;

  const personas: PersonaSet[] = useMemo(() => {
    const demas = conjuntos(otros);
    if (!guardadas) return demas;
    const set = new Set(guardadas);
    const yo: PersonaSet = { nombre: nombre.trim() || "Tú", clave: esClave, yo: true, puede: (dia, fila) => set.has(`${dia}|${fila}`) };
    return [...demas, yo];
  }, [otros, guardadas, nombre, esClave]);

  const cambiar = (claves: string[], poner: boolean) =>
    setMias((prev) => {
      if (claves.every((k) => prev.has(k) === poner)) return prev;
      const sig = new Set(prev);
      for (const k of claves) {
        if (poner) sig.add(k);
        else sig.delete(k);
      }
      return sig;
    });

  const marcados = mias.size;
  const horas = (marcados * r.bloqueMin) / 60;
  const textoHoras = `${Number.isInteger(horas) ? horas : horas.toFixed(1).replace(".", ",")} h`;
  const sinCambios = guardadas !== null && guardadas.length === mias.size && guardadas.every((k) => mias.has(k));

  const continuar = () => {
    if (existente) {
      setRetomada(existente.nombre);
      setNombre(existente.nombre);
      setMias(new Set(existente.disp));
      setGuardadas(existente.disp);
      toast.success(`Cargamos la respuesta de ${existente.nombre}`, { description: "Ya puedes cambiar tus horarios." });
    } else {
      setRetomada(null);
    }
    setListo(true);
  };

  /** Volver a la pantalla de acceso para cambiar el nombre (lo que marcaste de cero se mantiene). */
  const cambiarNombre = () => {
    if (retomada) {
      setRetomada(null);
      setNombre("");
      setClave(false);
      setMias(new Set());
      setGuardadas(null);
    }
    setListo(false);
  };

  const guardar = () => {
    setGuardadas([...mias]);
    toast.success("Guardado ✓", { description: "Vuelve a este link y escribe el mismo nombre para cambiar tus horarios." });
  };

  const ver = fijado ?? visto;

  return (
    <div className="mx-auto flex h-dvh min-h-[40rem] w-full max-w-md flex-col bg-background md:max-w-xl">
      {!listo && (
        <div className="flex h-8 shrink-0 items-center justify-center bg-lime px-4 text-center text-xs font-semibold text-foreground">
          Basta con dar tu nombre para rellenar
        </div>
      )}
      <header className={`flex h-12 shrink-0 items-center justify-between ${PAD}`}>
        <span className="flex items-center gap-1">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">WeMeet</span>
        </span>
        <div className="flex items-center gap-1">
          <EnlacesAyuda />
          <Link
            href="/"
            aria-label="Crear otra reunión"
            title="Crear otra reunión"
            className={buttonVariants({ size: "icon", className: "size-9 rounded-full" })}
          >
            <Plus />
          </Link>
          {listo && <MenuUsuario nombre={nombre.trim()} clave={esClave} editando={retomada !== null} onCambiar={cambiarNombre} />}
        </div>
      </header>

      <div className={`flex shrink-0 items-center ${PAD}`}>
        <h1 className="min-w-0 truncate font-heading text-xl leading-tight font-extrabold tracking-tight">{r.titulo}</h1>
        <Button
          type="button"
          variant="ghost"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-transparent hover:text-foreground [&_svg:not([class*='size-'])]:size-[1.125rem]"
          aria-label="Detalles de la reunión"
          aria-haspopup="dialog"
          onClick={() => setVerDetalles(true)}
        >
          <Info />
        </Button>
      </div>

      <div role="tablist" aria-label="Secciones" className={`${PAD} shrink-0 py-1`}>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {PESTANAS.map((t, i) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={pestana === i}
              className={`h-9 flex-1 rounded-full text-[0.8125rem] font-semibold ${pestana === i ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              onClick={() => {
                setPestana(i);
                setFijado(null);
                setVisto(null);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className={`relative flex min-h-0 flex-1 flex-col gap-1.5 ${PAD}`}>
        {pestana === 0 && !listo && (
          <Acceso
            nombre={nombre}
            onNombre={setNombre}
            clave={clave}
            onClave={setClave}
            onContinuar={continuar}
            hayClaves={hayClaves}
            clavesLlenas={clavesLlenas}
            yaRespondio={Boolean(existente)}
          />
        )}

        {(pestana === 1 || (pestana === 0 && listo)) && semanal && (
          <div className="flex shrink-0 items-center justify-between gap-2">
            <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" aria-label="Semana anterior" disabled={semana === 0} onClick={() => setSemana((s) => s - 1)}>
              <ChevronLeft />
            </Button>
            <p className="min-w-0 text-center text-[0.8125rem] font-semibold">Semana del {etiquetaRango(columnas)}</p>
            <Button type="button" variant="outline" size="icon" className="size-9 rounded-full" aria-label="Semana siguiente" disabled={semana >= semanas.length - 1} onClick={() => setSemana((s) => s + 1)}>
              <ChevronRight />
            </Button>
          </div>
        )}

        {pestana === 0 && listo && (
          <div className="min-h-0 flex-1">
            <Grilla reunion={r} columnas={columnas} bloqueados={bloqueados} modo="mia" mias={mias} onCambiar={cambiar} arrastrar={!desborda || pintar} onDesborda={setDesborda} />
          </div>
        )}

        {pestana === 1 && (
          <>
            <div className="min-h-0 flex-1">
              <Grilla reunion={r} columnas={columnas} bloqueados={bloqueados} modo="grupo" personas={personas} fijado={fijado} onFijar={setFijado} onVer={setVisto} onDesborda={setDesborda} />
            </div>
            <Leyenda personas={personas} />
          </>
        )}

        {pestana === 2 && <Compartir reunion={r} personas={personas} enlace={enlace} />}

        {pestana === 1 && ver && (
          <div className={`pointer-events-none absolute right-4 bottom-2 left-4 z-10 ${fijado ? "pointer-events-auto" : ""}`}>
            <QuienPuede reunion={r} personas={personas} clave={ver} onCerrar={fijado ? () => setFijado(null) : undefined} />
          </div>
        )}

        {pestana === 0 && listo && desborda && (
          <Button type="button" variant="outline" className="absolute right-5 bottom-3 z-10 h-9 gap-1.5 rounded-full bg-background px-3.5 text-[0.8125rem] font-bold shadow-md" aria-pressed={pintar} onClick={() => setPintar((p) => !p)}>
            {pintar ? <Hand /> : <PaintBucket />}
            {pintar ? "Mover" : "Rellenar"}
          </Button>
        )}
      </main>

      {pestana === 0 && listo && (
        <footer className={`shrink-0 border-t bg-background pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${PAD}`}>
          <p className="mb-1.5 text-center text-xs text-muted-foreground">
            {marcados} {marcados === 1 ? "bloque" : "bloques"} de {r.bloqueMin} min · {textoHoras}
          </p>
          <Button className="h-11 w-full rounded-full text-base font-extrabold" onClick={guardar}>
            {guardadas === null ? "Guardar mis horarios" : sinCambios ? "Guardado ✓" : "Guardar cambios"}
          </Button>
        </footer>
      )}

      <DetallesDialog open={verDetalles} onOpenChange={setVerDetalles} reunion={r} personas={datos.personas} />
    </div>
  );
}
