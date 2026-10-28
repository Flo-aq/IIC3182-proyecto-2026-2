"use client";

import { ChevronLeft, ChevronRight, Hand, Info, PaintBucket, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AvisoSuperior, BarraSuperior } from "@/components/barra-superior";
import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { useEsPantallaAncha, useOrigen } from "@/lib/cliente";
import {
  type PersonaSet,
  type ReunionConRespuestas,
  type Columna,
  columnasDe,
  conjuntos,
  esSemanal,
  etiquetaRango,
  mapaBloqueados,
  semanasDe,
} from "@/lib/respuestas";
import { textoBloque } from "@/lib/cierre";
import { useTieneLlave } from "@/lib/dueno";
import { MAX_NOMBRE } from "@/lib/limites";
import { useSesion } from "@/lib/sesion";
import { Compartir } from "./compartir";
import { Confirmada } from "./confirmada";
import { DetallesDialog } from "./detalles-dialog";
import { Grilla } from "./grilla";
import { Acceso, MenuUsuario } from "./identidad";
import { Leyenda } from "./leyenda";
import { QuienPuede, QuienPuedeVacio } from "./quien-puede";

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";
const PESTANAS = ["Mi horario", "Respuestas", "Compartir"] as const;

function Encabezado({ titulo, pista }: { titulo: string; pista?: string }) {
  return (
    <div className="flex shrink-0 items-baseline justify-between gap-2">
      <h2 className="font-heading text-[0.95rem] font-extrabold tracking-tight">{titulo}</h2>
      {pista && <span className="text-xs text-muted-foreground">{pista}</span>}
    </div>
  );
}

/** Flechas para moverse entre semanas (la reunión de más de 7 días se ve de a una semana). */
function NavSemana({ columnas, semana, total, onSemana }: { columnas: Columna[]; semana: number; total: number; onSemana: (s: number) => void }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <Button type="button" variant="outline" size="icon" className={BOTON.icono} aria-label="Semana anterior" disabled={semana === 0} onClick={() => onSemana(semana - 1)}>
        <ChevronLeft />
      </Button>
      <p className="min-w-0 text-center text-[0.8125rem] font-semibold">Semana del {etiquetaRango(columnas)}</p>
      <Button type="button" variant="outline" size="icon" className={BOTON.icono} aria-label="Semana siguiente" disabled={semana >= total - 1} onClick={() => onSemana(semana + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}

/** Pantalla de quien recibe el link: marca cuándo puede, mira al grupo y comparte el estado. */
/** El nombre de la cuenta como se usa al responder: sin espacios de más y con el largo permitido. */
const nombreDeCuenta = (n: string): string => n.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE);

/**
 * Con cuenta no se pide el nombre: si el servidor ya sabe que hay una (`cuentaNombre`), Mi horario parte lista desde la primera
 * pantalla, con la respuesta que ya había con ese nombre, si la había. Así no se ve un instante la pantalla de acceso.
 */
function entradaInicial(datos: ReunionConRespuestas, cuentaNombre: string | null) {
  if (cuentaNombre === null || datos.cerrada) return null;
  const nombre = nombreDeCuenta(cuentaNombre);
  const previa = datos.personas.find((p) => p.nombre.trim().toLowerCase() === nombre.toLowerCase());
  return { nombre: previa?.nombre ?? nombre, retomada: previa?.nombre ?? null, disp: previa?.disp ?? null };
}

export function Responder({ datos, esDuenoCuenta, cuentaNombre }: { datos: ReunionConRespuestas; esDuenoCuenta: boolean; cuentaNombre: string | null }) {
  const { reunion: r, slug, cerrada } = datos;
  // Cierra la reunión quien la creó: con su cuenta, o desde el navegador donde la creó (guardó una llave).
  const tieneLlave = useTieneLlave(slug);
  const esDueno = esDuenoCuenta || tieneLlave;
  const [entrada] = useState(() => entradaInicial(datos, cuentaNombre));
  const [pestana, setPestana] = useState(0);
  const [mias, setMias] = useState<Set<string>>(() => new Set(entrada?.disp ?? []));
  const [guardadas, setGuardadas] = useState<string[] | null>(entrada?.disp ?? null);
  const [nombre, setNombre] = useState(entrada?.nombre ?? "");
  /** Casilla "Soy integrante clave" de quien responde por primera vez. */
  const [clave, setClave] = useState(false);
  /** Ya dijiste quién eres: se muestra la grilla en vez de la pantalla de acceso. */
  const [listo, setListo] = useState(entrada !== null);
  /** Nombre de la respuesta que ya existía y se está editando (escribir el mismo nombre equivale a entrar). */
  const [retomada, setRetomada] = useState<string | null>(entrada?.retomada ?? null);
  const [guardando, setGuardando] = useState(false);
  /** Si lo que acabas de guardar quedó como integrante clave (hasta que llegue la lista actualizada del servidor). */
  const [claveGuardada, setClaveGuardada] = useState(false);
  const router = useRouter();
  const { conCuenta, nombre: nombreCuenta } = useSesion();
  /** Para entrar con el nombre de la cuenta una sola vez (si después se pulsa "Cambiar", no se vuelve a entrar sola). */
  const entroSola = useRef(entrada !== null);
  const hayCuenta = cuentaNombre !== null || conCuenta;
  const [verDetalles, setVerDetalles] = useState(false);
  const [semana, setSemana] = useState(0);
  const [fijado, setFijado] = useState<string | null>(null);
  const [visto, setVisto] = useState<string | null>(null);
  const [desbordaMia, setDesbordaMia] = useState(false);
  const [pintar, setPintar] = useState(false);
  /** En pantalla ancha, Compartir es una tarjeta flotante que empieza cerrada. */
  const [panelAbierto, setPanelAbierto] = useState(false);
  const cajaCompartir = useRef<HTMLDivElement>(null);
  const panelCompartir = useRef<HTMLElement>(null);

  // Desde lg se ven a la vez Mi horario y Respuestas, con Compartir flotante; antes, con pestañas.
  const escritorio = useEsPantallaAncha();
  const origen = useOrigen();
  const enlace = `${origen}/e/${slug}`;

  const bloqueados = useMemo(() => mapaBloqueados(r), [r]);
  const semanal = esSemanal(r);
  const semanas = semanasDe(r.dias);
  const columnas = columnasDe(r, semana);

  const buscado = nombre.trim().toLowerCase();
  const existente = buscado ? datos.personas.find((p) => p.nombre.trim().toLowerCase() === buscado) : undefined;

  // Si edito una respuesta que ya existía, esa persona soy yo: no se cuenta dos veces ni ocupa un lugar clave extra.
  const otros = useMemo(
    () => datos.personas.filter((p) => p.nombre.trim().toLowerCase() !== retomada?.toLowerCase()),
    [datos.personas, retomada],
  );
  const hayClaves = r.claves > 0;
  const clavesLlenas = !hayClaves || otros.filter((p) => p.clave).length >= r.claves;
  const propia = retomada ? datos.personas.find((p) => p.nombre.trim().toLowerCase() === retomada.toLowerCase()) : undefined;
  const esClave = retomada ? (propia?.clave ?? claveGuardada) : clave && !clavesLlenas;

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

  /** Entra a Mi horario con ese nombre; si ya había una respuesta con él, la carga para editarla. */
  const entrarComo = (escrito: string) => {
    const buscar = escrito.trim().toLowerCase();
    const previa = datos.personas.find((p) => p.nombre.trim().toLowerCase() === buscar);
    if (previa) {
      setRetomada(previa.nombre);
      setNombre(previa.nombre);
      setMias(new Set(previa.disp));
      setGuardadas(previa.disp);
      toast.success(`Cargamos la respuesta de ${previa.nombre}`, { description: "Ya puedes cambiar tus horarios." });
    } else {
      setNombre(escrito.trim());
      setRetomada(null);
    }
    setListo(true);
  };

  const continuar = () => entrarComo(nombre);

  // Con cuenta no se pide el nombre: se entra solo con el de la cuenta (después se puede cambiar desde el menú de arriba).
  useEffect(() => {
    if (!conCuenta || entroSola.current || cerrada) return;
    entroSola.current = true;
    entrarComo(nombreDeCuenta(nombreCuenta));
    // Solo cuando se sabe que hay cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conCuenta]);

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

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const res = await fetch(`/api/events/${slug}/responses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), clave: esClave || clave, bloques: [...mias] }),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(cuerpo.error ?? "No pudimos guardar tus horarios.");
      setGuardadas([...mias]);
      // Desde ahora esta respuesta existe en el servidor: seguimos editándola y no se cuenta dos veces.
      setRetomada(nombre.trim().replace(/\s+/g, " "));
      setClaveGuardada(cuerpo.clave);
      if (cuerpo.claveDenegada) {
        toast.warning("Guardado ✓, pero ya no quedaban lugares de integrante clave", { description: "Quedaste como participante normal." });
      } else {
        toast.success("Guardado ✓", { description: "Vuelve a este link y escribe el mismo nombre para cambiar tus horarios." });
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof TypeError ? "No pudimos conectarnos. Revisa tu internet e intenta de nuevo." : (e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  // Las respuestas de los demás llegan solas: se actualizan al volver a la pestaña y cada medio minuto.
  useEffect(() => {
    const actualizar = () => document.visibilityState === "visible" && router.refresh();
    const cada = setInterval(actualizar, 30_000);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      clearInterval(cada);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, [router]);

  const ver = fijado ?? visto;

  const verMia = escritorio || pestana === 0;
  const verRespuestas = escritorio || pestana === 1;
  const verCompartir = !escritorio && pestana === 2;

  // La tarjeta de Compartir se cierra con Escape o al hacer clic afuera (salvo que haya un diálogo abierto, como el de Notificarme).
  useEffect(() => {
    if (!escritorio || !panelAbierto) return;
    panelCompartir.current?.focus();
    const hayDialogo = () => document.querySelector('[role="dialog"]') !== null;
    const alPulsar = (e: PointerEvent) => {
      if (hayDialogo() || cajaCompartir.current?.contains(e.target as Node)) return;
      setPanelAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || hayDialogo()) return;
      setPanelAbierto(false);
      cajaCompartir.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", alPulsar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alPulsar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [escritorio, panelAbierto]);

  const pie: ReactNode = (
    <>
      {/* Con cuenta no se pasa por la pantalla de acceso, así que aquí se declara si eres integrante clave (solo la primera vez). */}
      {hayCuenta && hayClaves && !clavesLlenas && !retomada && (
        <label className="mb-2 flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-sm">
          <input type="checkbox" checked={clave} className="size-5 shrink-0 accent-primary" onChange={(e) => setClave(e.target.checked)} />
          <span>
            <b className="font-semibold">Soy integrante clave</b>
            <span className="block text-xs text-muted-foreground">Solo si la reunión depende de ti.</span>
          </span>
        </label>
      )}
      <p className="mb-1.5 text-center text-xs text-muted-foreground">
        {marcados} {marcados === 1 ? "bloque" : "bloques"} de {r.bloqueMin} min · {textoHoras}
      </p>
      <Button className={`${BOTON.principal} w-full`} disabled={(marcados === 0 && guardadas === null) || guardando} onClick={guardar}>
        {guardando ? "Guardando…" : guardadas === null ? "Guardar mis horarios" : sinCambios ? "Guardado ✓" : "Guardar cambios"}
      </Button>
    </>
  );

  const columnasEscritorio = "grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]";

  return (
    <div className="mx-auto flex h-dvh min-h-[40rem] w-full flex-col bg-background lg:max-w-[88rem]">
      {cerrada ? (
        <AvisoSuperior>Reunión confirmada · {textoBloque(r, cerrada)}</AvisoSuperior>
      ) : (
        !listo && <AvisoSuperior>Basta con dar tu nombre para rellenar</AvisoSuperior>
      )}
      {/* Con cuenta, arriba va el menú de la cuenta (Mi perfil y Cerrar sesión); el del nombre es solo para quien responde sin cuenta. */}
      <BarraSuperior
        cuenta={listo && !hayCuenta ? <MenuUsuario nombre={nombre.trim()} clave={esClave} editando={retomada !== null} onCambiar={cambiarNombre} /> : undefined}
      />

      <div className={`flex shrink-0 items-center ${PAD}`}>
        <h1 className="min-w-0 truncate font-heading text-xl leading-tight font-extrabold tracking-tight">{r.titulo}</h1>
        <Button
          type="button"
          variant="ghost"
          className="ml-2 h-6 shrink-0 gap-1 rounded-full bg-muted px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5"
          aria-label="Ver la información de la reunión"
          aria-haspopup="dialog"
          onClick={() => setVerDetalles(true)}
        >
          <Info />
          Ver info
        </Button>
        {escritorio && (
          <div ref={cajaCompartir} className="relative ml-auto">
            <Button
              type="button"
              variant="outline"
              className={BOTON.compacto}
              aria-expanded={panelAbierto}
              aria-controls="panel-compartir"
              onClick={() => setPanelAbierto((a) => !a)}
            >
              <Share2 />
              Compartir
            </Button>
            {/* Siempre montada (solo oculta) para no perder el aviso de Notificarme al cerrarla. */}
            <section
              ref={panelCompartir}
              id="panel-compartir"
              aria-label="Compartir"
              tabIndex={-1}
              hidden={!panelAbierto}
              className="absolute top-full right-0 z-30 mt-2 max-h-[calc(100dvh-9rem)] w-[19rem] overflow-y-auto rounded-3xl border bg-background p-3 shadow-2xl outline-none"
            >
              <Compartir slug={slug} reunion={r} personas={personas} enlace={enlace} cerrada={cerrada} esDueno={esDueno} />
            </section>
          </div>
        )}
      </div>

      {!escritorio && (
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
      )}

      <main className={`relative flex min-h-0 flex-1 flex-col gap-1.5 ${PAD} ${escritorio ? "pt-2 pb-4" : ""}`}>
        {semanal && !escritorio && (pestana === 1 || (pestana === 0 && listo && !cerrada)) && (
          <NavSemana columnas={columnas} semana={semana} total={semanas.length} onSemana={setSemana} />
        )}

        <div className={escritorio ? `grid min-h-0 flex-1 gap-6 ${columnasEscritorio}` : "flex min-h-0 flex-1 flex-col gap-1.5"}>
          {verMia && (
            // En pantalla ancha lleva el mismo margen que el panel de Respuestas, para que los títulos y las flechas queden a la misma altura.
            <section aria-label="Mi horario" className={`relative flex min-h-0 min-w-0 flex-col gap-1.5 ${escritorio ? "py-3" : "flex-1"}`}>
              {cerrada && (
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto pb-6">
                  <Confirmada slug={slug} reunion={r} bloque={cerrada} enlace={enlace} />
                </div>
              )}
              {!cerrada && escritorio && <Encabezado titulo="Mi horario" pista={listo ? "toca o arrastra para rellenar" : undefined} />}
              {!cerrada && escritorio && listo && semanal && <NavSemana columnas={columnas} semana={semana} total={semanas.length} onSemana={setSemana} />}
              {!cerrada && !listo && escritorio && (
                // En pantalla ancha, Mi horario se ve vacía y apagada detrás de la tarjeta del nombre.
                <div className="min-h-0 flex-1" aria-hidden="true" inert>
                  <div className="h-full opacity-30 grayscale-[0.3]">
                    <Grilla reunion={r} columnas={columnas} bloqueados={bloqueados} modo="mia" mias={new Set()} />
                  </div>
                </div>
              )}
              {!cerrada && !listo && (
                <div className={escritorio ? "absolute inset-0 z-10 grid place-items-center overflow-auto p-3" : "flex min-h-0 flex-1 flex-col"}>
                  <div className={escritorio ? "w-[24rem] max-w-full rounded-3xl border bg-background px-5 pt-5 shadow-xl" : "flex min-h-0 flex-1 flex-col"}>
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
                  </div>
                </div>
              )}
              {!cerrada && listo && (
                <div className="min-h-0 flex-1">
                  <Grilla reunion={r} columnas={columnas} bloqueados={bloqueados} modo="mia" mias={mias} onCambiar={cambiar} arrastrar={escritorio || !desbordaMia || pintar} onDesborda={setDesbordaMia} todosLosDias={escritorio} />
                </div>
              )}
              {!cerrada && listo && desbordaMia && !escritorio && (
                <Button type="button" variant="outline" className={`${BOTON.compacto} absolute right-3 bottom-3 z-10 bg-background shadow-md`} aria-pressed={pintar} onClick={() => setPintar((p) => !p)}>
                  {pintar ? <Hand /> : <PaintBucket />}
                  {pintar ? "Mover" : "Rellenar"}
                </Button>
              )}
              {!cerrada && escritorio && listo && <div className="shrink-0 border-t pt-2">{pie}</div>}
            </section>
          )}

          {verRespuestas && (
            <section aria-label="Respuestas" className={`relative flex min-h-0 min-w-0 flex-col gap-1.5 ${escritorio ? "rounded-3xl bg-panel p-3" : ""}`}>
              {escritorio && <Encabezado titulo="Respuestas" pista="pasa el mouse por un bloque" />}
              {escritorio && semanal && <NavSemana columnas={columnas} semana={semana} total={semanas.length} onSemana={setSemana} />}
              <div className="min-h-0 flex-1">
                <Grilla
                  reunion={r}
                  columnas={columnas}
                  bloqueados={bloqueados}
                  modo="grupo"
                  personas={personas}
                  fijado={fijado}
                  onFijar={setFijado}
                  onVer={setVisto}
                  compacta={escritorio}
                />
              </div>
              {escritorio && (
                // Alto fijo de tres líneas: si cambiara con el contenido, la grilla de arriba se achicaría y agrandaría. Lo que no cabe se corta con "…".
                <div className="h-[4.75rem] shrink-0">
                  {ver ? <QuienPuede tresLineas reunion={r} personas={personas} clave={ver} onCerrar={fijado ? () => setFijado(null) : undefined} /> : <QuienPuedeVacio />}
                </div>
              )}
              <Leyenda personas={personas} />
              {!escritorio && ver && (
                <div className={`pointer-events-none absolute right-0 bottom-1 left-0 z-10 ${fijado ? "pointer-events-auto" : ""}`}>
                  <QuienPuede reunion={r} personas={personas} clave={ver} onCerrar={fijado ? () => setFijado(null) : undefined} />
                </div>
              )}
            </section>
          )}

          {verCompartir && (
            <section aria-label="Compartir" className="min-h-0 min-w-0">
              <Compartir slug={slug} reunion={r} personas={personas} enlace={enlace} cerrada={cerrada} esDueno={esDueno} />
            </section>
          )}
        </div>
      </main>

      {!escritorio && pestana === 0 && listo && !cerrada && (
        <footer className={`shrink-0 border-t bg-background pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${PAD}`}>{pie}</footer>
      )}

      <DetallesDialog open={verDetalles} onOpenChange={setVerDetalles} reunion={r} personas={datos.personas} />
    </div>
  );
}
