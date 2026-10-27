"use client";

import { Info, Minus, Pencil, Plus, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FIN_DEL_DIA,
  OPCIONES_BLOQUE,
  PLANTILLAS,
  type Problema,
  POR_DEFECTO,
  type Reunion,
  aplicarPlantilla,
  esTodoElDia,
  mananaDe,
  podarBloqueos,
  problemas,
  proximosHabiles,
  resumenBloques,
  sumarMinutos,
  textoCantidadDias,
  textoHorario,
  zonaCorta,
} from "@/lib/reunion";
import { BloqueosEditor } from "./bloqueos-editor";
import { DiasEditor } from "./dias-editor";
import { Exito } from "./exito";
import { HoraField } from "./hora-field";
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

const Obligatorio = () => (
  <span aria-hidden="true" className="ml-0.5 font-extrabold text-destructive">
    *
  </span>
);

export function CrearReunion() {
  const [r, setR] = useState<Reunion>(INICIAL);
  const [hoy, setHoy] = useState<Date | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [usarPlantilla, setUsarPlantilla] = useState(false);
  const [plantilla, setPlantilla] = useState(-1);
  const [intento, setIntento] = useState(false);
  const [creada, setCreada] = useState<{ codigo: string; reunion: Reunion } | null>(null);
  const [info, setInfo] = useState(false);
  const [verResumen, setVerResumen] = useState(false);
  const contador = useRef(0);
  const horarioPrevio = useRef<{ desde: string; hasta: string }>({ desde: POR_DEFECTO.desde, hasta: POR_DEFECTO.hasta });
  const idPlantilla = useId();
  const idTodoElDia = useId();

  // La fecha de hoy y la zona del dispositivo solo existen en el navegador: se leen al montar.
  useEffect(() => {
    const ahora = new Date();
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoy(ahora);
    setR((prev) => ({ ...prev, dias: proximosHabiles(ahora, 5), zona: zona || prev.zona }));
  }, []);

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

  if (creada) {
    return (
      <Exito
        codigo={creada.codigo}
        reunion={creada.reunion}
        onOtra={() => {
          setCreada(null);
          setIntento(false);
          setR((prev) => ({ ...INICIAL, dias: prev.dias, zona: prev.zona }));
          setPlantilla(-1);
          setUsarPlantilla(false);
        }}
      />
    );
  }

  const todoElDia = esTodoElDia(r);
  const cambiarTodoElDia = (activo: boolean) => {
    if (activo) {
      horarioPrevio.current = { desde: r.desde, hasta: r.hasta };
      cambiar({ desde: "00:00", hasta: FIN_DEL_DIA });
    } else {
      cambiar(horarioPrevio.current);
    }
  };

  const manana = hoy ? mananaDe(hoy) : null;

  // Después del primer intento de crear, los campos con problemas quedan marcados hasta que se corrijan.
  const pendientes = intento ? problemas(r) : [];
  const camposMalos = new Set<string>(pendientes.map((p) => p.campo));
  const reglasMalas = new Set(pendientes.flatMap((p) => (p.regla ? [p.regla] : [])));

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

  const crear = () => {
    const faltan = problemas(r);
    if (faltan.length) {
      setIntento(true);
      avisar(faltan);
      enfocar(faltan[0].campo);
      return;
    }
    setIntento(false);
    toast.dismiss(ID_AVISO);
    setCreada({ codigo: Math.random().toString(36).slice(2, 6), reunion: r });
    window.scrollTo(0, 0);
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
    {
      id: "horario",
      etiqueta: "Horario",
      obligatorio: true,
      resumen: textoHorario(r),
      contenido: (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={idTodoElDia} className="text-sm font-semibold">
              Todo el día
            </label>
            <Switch id={idTodoElDia} checked={todoElDia} onCheckedChange={cambiarTodoElDia} />
          </div>
          {!todoElDia && (
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Desde</span>
                <HoraField
                  value={r.desde}
                  onChange={(desde) => cambiar({ desde })}
                  porDefecto={POR_DEFECTO.desde}
                  max={sumarMinutos(r.hasta, -5)}
                  label="Hora de inicio"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Hasta</span>
                <HoraField
                  value={r.hasta}
                  onChange={(hasta) => cambiar({ hasta })}
                  porDefecto={POR_DEFECTO.hasta}
                  min={sumarMinutos(r.desde, 5)}
                  label="Hora de término"
                />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "bloque",
      etiqueta: "Cada bloque dura",
      obligatorio: true,
      resumen: `${r.bloqueMin} min`,
      contenido: (
        <div className="flex flex-col gap-2">
          <ToggleGroup
            value={[String(r.bloqueMin)]}
            onValueChange={(v) => v[0] && cambiar({ bloqueMin: Number(v[0]) })}
            aria-label="Duración de cada bloque en minutos"
            className="w-full gap-0.5 rounded-3xl bg-muted p-1"
          >
            {OPCIONES_BLOQUE.map((m) => (
              <ToggleGroupItem
                key={m}
                value={String(m)}
                aria-label={`${m} minutos`}
                className="h-14 flex-1 flex-col gap-0.5 rounded-[1.25rem] leading-none aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-md"
              >
                <span className="text-lg font-bold">{m}</span>
                <span aria-hidden="true" className="text-[0.7rem] font-normal opacity-80">
                  min
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-sm text-muted-foreground">{resumenBloques(r)}</p>
        </div>
      ),
    },
    {
      id: "bloqueos",
      etiqueta: "Bloquear horarios",
      obligatorio: false,
      resumen: r.bloqueos.length ? (r.bloqueos.length === 1 ? "1 regla" : `${r.bloqueos.length} reglas`) : "Ninguno",
      contenido: <BloqueosEditor reunion={r} nuevoId={nuevoId} reglasInvalidas={reglasMalas} onChange={(bloqueos) => cambiar({ bloqueos })} />,
    },
    {
      id: "claves",
      etiqueta: "Integrantes clave",
      obligatorio: false,
      resumen: r.claves ? String(r.claves) : "Ninguno",
      contenido: (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="size-12 rounded-full"
              aria-label="Uno menos"
              disabled={r.claves <= 0}
              onClick={() => cambiar({ claves: r.claves - 1 })}
            >
              <Minus />
            </Button>
            <output className="min-w-14 text-center font-heading text-2xl font-extrabold">{r.claves}</output>
            <Button
              type="button"
              variant="outline"
              className="size-12 rounded-full"
              aria-label="Uno más"
              disabled={r.claves >= 2}
              onClick={() => cambiar({ claves: r.claves + 1 })}
            >
              <Plus />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Su horario delimita la reunión: solo se sugieren bloques en que ellos pueden.
          </p>
        </div>
      ),
    },
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
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:min-h-[40rem]">
      <div className="sticky top-0 z-30 bg-background">
      <div className="flex h-8 items-center justify-center bg-lime px-4 text-center text-xs font-semibold text-foreground">
        No necesitas cuenta para crear una reunión
      </div>
      <header className={`flex h-13 items-center justify-between ${PAD}`}>
        <span className="flex items-center gap-1">
          <Logo className="size-6 text-primary" />
          <span className="font-heading text-lg font-extrabold tracking-tight">WeMeet</span>
        </span>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-full border-foreground px-3.5 font-bold"
          disabled
          title="Próximamente: iniciar sesión con Google"
        >
          Sign in
        </Button>
      </header>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col md:max-w-xl lg:min-h-0 lg:max-w-5xl">
      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[minmax(0,1fr)] lg:items-start lg:gap-10 lg:pr-4">
      <div className="flex flex-1 flex-col lg:h-full lg:min-h-0">
      <main className={`flex flex-1 flex-col gap-3 pt-2 pb-2 lg:min-h-0 lg:overflow-y-auto ${PAD}`}>
        <div className="sticky top-21 z-20 -mt-2 flex h-19 flex-col gap-1 bg-background pt-2 pb-2 lg:top-0">
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

        <div className="flex flex-col gap-2 border-y py-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={idPlantilla} className="text-[0.95rem] font-semibold">
              Usar plantilla
            </label>
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
              plantillas={PLANTILLAS}
              elegida={plantilla}
              onElegir={(i) => {
                setPlantilla(i);
                setR((prev) => aplicarPlantilla(prev, PLANTILLAS[i], nuevoId));
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

        <Accordion
          value={abierto ? [abierto] : []}
          onValueChange={(v) => setAbierto((v[0] as string | undefined) ?? null)}
          className="overflow-clip rounded-2xl border bg-muted"
        >
          {filas.map((f) => {
            const malo = camposMalos.has(f.id);
            return (
            <AccordionItem key={f.id} value={f.id} data-fila={f.id} className={malo ? "bg-destructive/5" : ""}>
              <AccordionTrigger
                headerClassName={abierto === f.id ? "sticky top-40 z-10 bg-muted lg:top-19" : ""}
                className="min-h-13 items-center rounded-none px-3.5 py-3 hover:no-underline aria-expanded:border-b-border">
                <span className={`flex shrink-0 items-center gap-1.5 text-[0.95rem] font-semibold ${malo ? "text-destructive" : ""}`}>
                  <span>
                    {f.etiqueta}
                    {f.obligatorio && <Obligatorio />}
                  </span>
                  {malo && <TriangleAlert className="size-4" aria-hidden="true" />}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate pl-3 text-right text-sm font-normal ${malo ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {f.resumen}
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-background px-3.5 pt-3.5 pb-3.5">{f.contenido}</AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>
      </main>

      <div className={`sticky bottom-0 z-10 mt-3 border-t bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${PAD}`}>
        <Button
          type="button"
          variant="outline"
          className="mb-2 h-11 w-full rounded-full text-base font-bold lg:hidden"
          aria-haspopup="dialog"
          onClick={() => setVerResumen(true)}
        >
          Ver resumen
        </Button>
        <Button className="h-14 w-full rounded-full text-[1.0625rem] font-extrabold" onClick={crear}>
          Crear reunión
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
