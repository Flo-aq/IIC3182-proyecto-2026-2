"use client";

import { Info, Pencil, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { AvisoSuperior, BarraSuperior } from "@/components/barra-superior";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { guardarLlave } from "@/lib/dueno";
import { useSesion } from "@/lib/sesion";
import type { PlantillaDeCuenta } from "@/lib/plantillas";
import {
  PLANTILLAS,
  type Problema,
  POR_DEFECTO,
  type Plantilla,
  type Reunion,
  aplicarPlantilla,
  mananaDe,
  podarBloqueos,
  problemas,
  proximosHabiles,
  textoCantidadDias,
  zonaCorta,
} from "@/lib/reunion";
import { DiasEditor } from "./dias-editor";
import { Etiquetas } from "./etiquetas";
import { Exito } from "./exito";
import { FilasAcordeon, Obligatorio, useFilasConfiguracion } from "./filas-configuracion";
import { InfoDialog } from "./info-dialog";
import { AreaScroll } from "./area-scroll";
import { Plantillas } from "./plantillas";
import { ResumenReunion } from "./resumen";
import { ResumenDialog } from "./resumen-dialog";
import { ZonaHoraria } from "./zona-horaria";

const INICIAL: Reunion = {
  titulo: "",
  zona: "America/Santiago",
  dias: [],
  desde: POR_DEFECTO.desde,
  hasta: POR_DEFECTO.hasta,
  bloqueMin: 30,
  claves: 0,
  bloqueos: [],
};

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

const ID_AVISO = "campos-pendientes";

/** Aviso arriba con lo que falta; reemplaza al anterior si se vuelve a intentar. */
function avisar(ps: Problema[]) {
  const faltan = ps.some((p) => p.campo === "nombre" || p.campo === "dias");
  toast.error(faltan ? "Faltan campos por completar" : "Revisa estos campos", {
    id: ID_AVISO,
    duration: 8000,
    description: (
      <ul className="mt-1 flex flex-col gap-0.5">
        {ps.map((p) => (
          <li key={`${p.campo}-${p.regla ?? ""}`}>
            <b>{p.etiqueta}:</b> {p.mensaje}
          </li>
        ))}
      </ul>
    ),
  });
}

type Props = {
  /** Las plantillas de la cuenta; vienen de GET /api/me/templates y solo existen con sesión. */
  plantillasPropias?: PlantillaDeCuenta[];
  /** Todos los tags de la cuenta, para elegirlos con un toque; vienen de GET /api/me/tags. */
  tagsDeLaCuenta?: string[];
};

export function CrearReunion({ plantillasPropias = [], tagsDeLaCuenta = [] }: Props) {
  const { conCuenta } = useSesion();
  const propias = plantillasPropias;
  // Primero las propias (solo se ofrecen con cuenta) y después las de WeMeet.
  const plantillasDisponibles: (Plantilla & { tags?: string[] })[] = conCuenta ? [...propias, ...PLANTILLAS] : PLANTILLAS;
  const [r, setR] = useState<Reunion>(INICIAL);
  const [hoy, setHoy] = useState<Date | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [usarPlantilla, setUsarPlantilla] = useState(false);
  const [plantilla, setPlantilla] = useState(-1);
  const [intento, setIntento] = useState(false);
  const [creada, setCreada] = useState<{ codigo: string; reunion: Reunion; copiado: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [info, setInfo] = useState(false);
  const [verResumen, setVerResumen] = useState(false);
  /** Los tags de la reunión: solo los puede poner quien tiene una cuenta. */
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const contador = useRef(0);
  const idPlantilla = useId();

  // La fecha de hoy y la zona del dispositivo solo existen en el navegador: se leen al montar.
  useEffect(() => {
    const ahora = new Date();
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoy(ahora);
    setR((prev) => ({ ...prev, dias: proximosHabiles(ahora, 5), zona: zona || prev.zona }));
  }, []);

  // Si se llega desde "Usar" en el perfil (/?plantilla=<id>), la reunión parte con esa plantilla ya aplicada. Las plantillas
  // de la cuenta llegan después de abrir la pantalla, así que se aplica en cuanto aparece la que el link nombra (una sola vez).
  const plantillaDelLink = useRef(false);
  useEffect(() => {
    if (plantillaDelLink.current || !plantillasPropias.length) return;
    const id = new URLSearchParams(window.location.search).get("plantilla");
    if (!id) return;
    const disponibles: (Plantilla & { tags?: string[] })[] = [...plantillasPropias, ...PLANTILLAS];
    const elegida = disponibles.findIndex((p) => "id" in p && p.id === id);
    if (elegida < 0) return;
    plantillaDelLink.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsarPlantilla(true);
    setPlantilla(elegida);
    setEtiquetas(disponibles[elegida].tags ?? []);
    setR((prev) => aplicarPlantilla(prev, disponibles[elegida], () => `b${++contador.current}`));
  }, [plantillasPropias]);

  // Mientras el aviso sigue a la vista, se actualiza con lo que todavía falta; cuando ya no falta nada, se cierra solo.
  useEffect(() => {
    if (!intento) return;
    const visible = toast.getToasts().some((t) => t.id === ID_AVISO && !("dismiss" in t && t.dismiss));
    if (!visible) return;
    const faltan = problemas(r);
    if (faltan.length) avisar(faltan);
    else toast.dismiss(ID_AVISO);
  }, [intento, r]);

  const nuevoId = () => `b${++contador.current}`;
  const cambiar = (parcial: Partial<Reunion>) => setR((prev) => ({ ...prev, ...parcial }));

  // Después del primer intento de crear, los campos con problemas quedan marcados hasta que se corrijan.
  const pendientes = intento ? problemas(r) : [];
  const camposMalos = new Set<string>(pendientes.map((p) => p.campo));
  const reglasMalas = new Set(pendientes.flatMap((p) => (p.regla ? [p.regla] : [])));

  // Horario, duración del bloque, horarios bloqueados e integrantes clave: las mismas filas que al editar una plantilla.
  const filasConfig = useFilasConfiguracion({ r, cambiar, nuevoId, reglasMalas });

  if (creada) {
    return (
      <Exito
        codigo={creada.codigo}
        reunion={creada.reunion}
        copiado={creada.copiado}
        onOtra={() => {
          setCreada(null);
          setIntento(false);
          setR((prev) => ({ ...INICIAL, dias: prev.dias, zona: prev.zona }));
          setPlantilla(-1);
          setUsarPlantilla(false);
          setEtiquetas([]);
        }}
      />
    );
  }

  const manana = hoy ? mananaDe(hoy) : null;

  const enfocar = (campo: Problema["campo"]) => {
    if (campo === "nombre") {
      const el = document.getElementById("nombre");
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setAbierto(campo);
    setTimeout(() => document.querySelector(`[data-fila="${campo}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 80);
  };

  const crear = async () => {
    if (enviando) return;
    const faltan = problemas(r);
    if (faltan.length) {
      setIntento(true);
      avisar(faltan);
      enfocar(faltan[0].campo);
      return;
    }
    setIntento(false);
    toast.dismiss(ID_AVISO);
    setEnviando(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Los tags son de la cuenta: sin sesión el servidor los ignora.
        body: JSON.stringify({ ...r, etiquetas: conCuenta ? etiquetas : [] }),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(cuerpo.error ?? "No pudimos crear la reunión.");
      // La llave del creador queda en este navegador: con ella podrá cerrar la reunión aunque no tenga cuenta.
      guardarLlave(cuerpo.slug, cuerpo.tokenDueno);
      // El link se copia solo: es lo primero que se hace con una reunión nueva. Si el navegador no deja, la pantalla lo avisa.
      let copiado = false;
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/e/${cuerpo.slug}`);
        copiado = true;
        toast.success("Link copiado");
      } catch {
        // Sin permiso del portapapeles: queda el botón "Copiar" en la pantalla siguiente.
      }
      setCreada({ codigo: cuerpo.slug, reunion: r, copiado });
      window.scrollTo(0, 0);
    } catch (e) {
      toast.error(e instanceof TypeError ? "No pudimos conectarnos. Revisa tu internet e intenta de nuevo." : (e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const filas: { id: string; etiqueta: string; obligatorio: boolean; resumen: string; contenido: React.ReactNode }[] = [
    {
      id: "dias",
      etiqueta: "Días",
      obligatorio: true,
      resumen: textoCantidadDias(r.dias.length),
      contenido: manana ? (
        <DiasEditor
          dias={r.dias}
          manana={manana}
          onChange={(dias) => cambiar({ dias, bloqueos: podarBloqueos(r.bloqueos, dias) })}
        />
      ) : null,
    },
    ...filasConfig,
    {
      id: "zona",
      etiqueta: "Zona horaria",
      obligatorio: false,
      resumen: zonaCorta(r.zona),
      contenido: (
        <div className="flex flex-col gap-2">
          <ZonaHoraria value={r.zona} onChange={(zona) => cambiar({ zona })} />
          <p className="text-xs text-muted-foreground">Cada persona verá los horarios en su zona.</p>
        </div>
      ),
    },
    // Los tags son de la cuenta: sin cuenta no se ofrecen.
    ...(conCuenta
      ? [
          {
            id: "etiquetas",
            etiqueta: "Tags",
            obligatorio: false,
            resumen: etiquetas.length ? etiquetas.join(", ") : "Ninguno",
            contenido: <Etiquetas elegidos={etiquetas} onChange={setEtiquetas} deLaCuenta={tagsDeLaCuenta} />,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-dvh min-h-[40rem] flex-col bg-background">
      <div className="sticky top-0 z-30 bg-background">
      <AvisoSuperior>No necesitas cuenta para crear una reunión</AvisoSuperior>
      <BarraSuperior />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col md:max-w-xl lg:max-w-5xl">
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[minmax(0,1fr)] lg:items-start lg:gap-10 lg:pr-4">
      <div className="flex min-h-0 flex-1 flex-col lg:h-full">
        <div className={`flex h-19 shrink-0 flex-col gap-1 pt-2 pb-2 ${PAD}`}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-[1.7rem] leading-tight font-extrabold tracking-tight">Crea una reunión</h1>
          <Button
            type="button"
            variant="ghost"
            className="size-10 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/70 [&_svg:not([class*='size-'])]:size-5"
            aria-label="Cómo funciona"
            aria-haspopup="dialog"
            onClick={() => setInfo(true)}
          >
            <Info />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          <Obligatorio /> Obligatorio
        </p>
        </div>

      <AreaScroll className="min-h-0 flex-1" bordes={false}>
      <main className={`flex flex-col gap-3 pt-3 pb-2 ${PAD}`}>
        <div className="flex flex-col gap-2 border-y py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <label htmlFor={idPlantilla} className="text-[0.95rem] font-semibold">
                Usar plantilla
              </label>
              {/* Las plantillas en amarillo son las de la cuenta. */}
              {conCuenta && usarPlantilla && propias.length > 0 && (
                <span title="Las plantillas en amarillo son tuyas" className="rounded-full bg-lime px-2 py-0.5 text-[0.6875rem] font-bold">
                  Tuyas
                </span>
              )}
            </div>
            <Switch
              id={idPlantilla}
              checked={usarPlantilla}
              onCheckedChange={(v) => {
                setUsarPlantilla(v);
                if (!v) setPlantilla(-1);
              }}
            />
          </div>
          {usarPlantilla && (
            <Plantillas
              plantillas={plantillasDisponibles}
              elegida={plantilla}
              onElegir={(i) => {
                setPlantilla(i);
                const elegida = plantillasDisponibles[i];
                setR((prev) => aplicarPlantilla(prev, elegida, nuevoId));
                // Las plantillas propias traen sus tags; las de WeMeet no cambian los que ya elegiste.
                if (elegida.tags) setEtiquetas(elegida.tags);
              }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="nombre" className="flex items-center gap-1.5 text-sm font-bold">
              <span>
                Nombre de la reunión
                <Obligatorio />
              </span>
              {camposMalos.has("nombre") && <TriangleAlert className="size-4 text-destructive" aria-hidden="true" />}
            </label>
            {camposMalos.has("nombre") && (
              <p id="nombre-error" className="text-[0.8125rem] font-medium text-destructive">
                Escribe un nombre
              </p>
            )}
          </div>
          <div className="relative">
            <Input
              id="nombre"
              value={r.titulo}
              maxLength={80}
              autoComplete="off"
              aria-required="true"
              aria-invalid={camposMalos.has("nombre") || undefined}
              aria-describedby={camposMalos.has("nombre") ? "nombre-error" : undefined}
              placeholder="Ej: Reunión de equipo IHC"
              className="h-12 rounded-2xl border-[1.5px] pr-11 pl-3.5 text-base"
              onChange={(e) => cambiar({ titulo: e.target.value })}
            />
            <Pencil aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <FilasAcordeon filas={filas} abierto={abierto} onAbierto={setAbierto} malos={camposMalos} />
      </main>
      </AreaScroll>

      <div className={`sticky bottom-0 z-10 mt-3 border-t bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${PAD}`}>
        <Button
          type="button"
          variant="outline"
          className={`${BOTON.secundario} mb-2 w-full lg:hidden`}
          aria-haspopup="dialog"
          onClick={() => setVerResumen(true)}
        >
          Ver resumen
        </Button>
        <Button className={`${BOTON.heroe} w-full`} onClick={crear} disabled={enviando}>
          {enviando ? "Creando…" : "Crear reunión"}
        </Button>
      </div>
      </div>

      <aside aria-label="Resumen de la reunión" className="mt-2 mb-4 hidden overflow-hidden rounded-3xl border bg-background lg:flex lg:max-h-[calc(100%-1.5rem)] lg:flex-col">
        <h2
          className={`shrink-0 px-5 pt-5 pb-3 font-heading text-lg font-extrabold tracking-tight break-words ${r.titulo.trim() ? "" : "text-muted-foreground"}`}
        >
          {r.titulo.trim() || "Sin nombre todavía"}
        </h2>
        <AreaScroll className="mb-3 min-h-0 flex-1" areaClassName="px-5 pt-1 pb-3">
          <ResumenReunion reunion={r} />
        </AreaScroll>
      </aside>
      </div>

      <ResumenDialog open={verResumen} onOpenChange={setVerResumen} reunion={r} onCrear={crear} />

      <InfoDialog open={info} onOpenChange={setInfo} />
      </div>
    </div>
  );
}
