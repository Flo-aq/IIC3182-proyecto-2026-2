"use client";

import { Info, Minus, Pencil, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  OPCIONES_BLOQUE,
  PLANTILLAS,
  type Reunion,
  ZONAS,
  aplicarPlantilla,
  mananaDe,
  proximosHabiles,
  resumenBloques,
  resumenDias,
  validar,
  zonaCorta,
} from "@/lib/reunion";
import { BloqueosEditor } from "./bloqueos-editor";
import { DiasEditor } from "./dias-editor";
import { Exito } from "./exito";
import { HoraField } from "./hora-field";
import { InfoDialog } from "./info-dialog";

const INICIAL: Reunion = {
  titulo: "",
  zona: "America/Santiago",
  dias: [],
  desde: "09:00",
  hasta: "18:00",
  bloqueMin: 30,
  claves: 0,
  limite: "",
  bloqueos: [],
};

const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

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
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<{ codigo: string; reunion: Reunion } | null>(null);
  const [info, setInfo] = useState(false);
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

  const nuevoId = () => `b${++contador.current}`;
  const cambiar = (parcial: Partial<Reunion>) => {
    setR((prev) => ({ ...prev, ...parcial }));
    setError(null);
  };

  if (creada) {
    return (
      <Exito
        codigo={creada.codigo}
        reunion={creada.reunion}
        onOtra={() => {
          setCreada(null);
          setR((prev) => ({ ...INICIAL, dias: prev.dias, zona: prev.zona }));
          setPlantilla(-1);
          setUsarPlantilla(false);
        }}
      />
    );
  }

  const manana = hoy ? mananaDe(hoy) : null;
  const zonas = ZONAS.includes(r.zona) ? ZONAS : [r.zona, ...ZONAS];
  const itemsZona = zonas.map((z) => ({ value: z, label: zonaCorta(z) }));

  const crear = () => {
    const problema = validar(r);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setCreada({ codigo: Math.random().toString(36).slice(2, 6), reunion: r });
    window.scrollTo(0, 0);
  };

  const filas: { id: string; etiqueta: string; obligatorio: boolean; resumen: string; contenido: React.ReactNode }[] = [
    {
      id: "dias",
      etiqueta: "Días",
      obligatorio: true,
      resumen: resumenDias(r.dias),
      contenido: manana ? (
        <DiasEditor dias={r.dias} manana={manana} onChange={(dias) => cambiar({ dias })} />
      ) : null,
    },
    {
      id: "horario",
      etiqueta: "Horario",
      obligatorio: true,
      resumen: `${r.desde} a ${r.hasta}`,
      contenido: (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Desde</span>
            <HoraField value={r.desde} onChange={(desde) => cambiar({ desde })} label="Hora de inicio" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Hasta</span>
            <HoraField value={r.hasta} onChange={(hasta) => cambiar({ hasta })} label="Hora de término" />
          </div>
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
            className="w-full gap-0.5 rounded-full bg-muted p-1"
          >
            {OPCIONES_BLOQUE.map((m) => (
              <ToggleGroupItem
                key={m}
                value={String(m)}
                className="h-10 flex-1 rounded-full text-base font-bold aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:shadow-md"
              >
                {m}
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
      contenido: <BloqueosEditor reunion={r} nuevoId={nuevoId} onChange={(bloqueos) => cambiar({ bloqueos })} />,
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
      etiqueta: "Zona horaria y fecha límite",
      obligatorio: false,
      resumen: `${zonaCorta(r.zona)} · ${r.limite || "sin fecha límite"}`,
      contenido: (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Zona horaria</span>
              <Select items={itemsZona} value={r.zona} onValueChange={(v) => v && cambiar({ zona: v })}>
                <SelectTrigger className="h-11 w-full rounded-xl px-3 text-base" aria-label="Zona horaria">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemsZona.map((z) => (
                    <SelectItem key={z.value} value={z.value}>
                      {z.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Fecha límite</span>
              <Input
                type="date"
                aria-label="Fecha límite para responder"
                className="h-11 rounded-xl px-3 text-base"
                value={r.limite}
                min={manana ? `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, "0")}-${String(manana.getDate()).padStart(2, "0")}` : undefined}
                onChange={(e) => cambiar({ limite: e.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Cada persona verá los horarios en su zona.</p>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <div className="bg-lime px-4 py-2 text-center text-xs font-semibold text-foreground">
        No necesitas cuenta para crear una reunión
      </div>
      <header className={`flex items-center justify-between py-2 ${PAD}`}>
        <span className="flex items-center gap-2">
          <Logo className="h-5 w-auto text-primary" />
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

      <main className={`flex flex-1 flex-col gap-3 pb-2 ${PAD}`}>
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
        <p className="-mt-2 text-xs text-muted-foreground">
          <Obligatorio /> Obligatorio
        </p>

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
            <div
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pt-0.5 pb-3 [scrollbar-width:thin]"
              role="group"
              aria-label="Plantillas"
            >
              {PLANTILLAS.map((p, i) => (
                <Button
                  key={p.nombre}
                  type="button"
                  variant="outline"
                  aria-pressed={plantilla === i}
                  title={p.detalle}
                  className={`h-9 shrink-0 rounded-full px-3 text-[0.8125rem] ${
                    plantilla === i ? "border-primary bg-accent font-semibold text-accent-foreground" : ""
                  }`}
                  onClick={() => {
                    setPlantilla(i);
                    setR((prev) => aplicarPlantilla(prev, p, nuevoId));
                    setError(null);
                  }}
                >
                  {p.nombre}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="nombre" className="text-sm font-bold">
            Nombre de la reunión
            <Obligatorio />
          </label>
          <div className="relative">
            <Input
              id="nombre"
              value={r.titulo}
              maxLength={80}
              autoComplete="off"
              aria-required="true"
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
          className="overflow-hidden rounded-2xl border bg-muted"
        >
          {filas.map((f) => (
            <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger className="min-h-13 items-center rounded-none px-3.5 py-3 hover:no-underline">
                <span className="shrink-0 text-[0.95rem] font-semibold">
                  {f.etiqueta}
                  {f.obligatorio && <Obligatorio />}
                </span>
                <span className="min-w-0 flex-1 truncate pl-3 text-right text-sm font-normal text-muted-foreground">
                  {f.resumen}
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-background px-3.5 pt-2 pb-3.5">{f.contenido}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <div className={`sticky bottom-0 z-10 mt-3 border-t bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${PAD}`}>
        {error && (
          <p role="alert" className="mb-2 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}
        <Button className="h-14 w-full rounded-full text-[1.0625rem] font-extrabold" onClick={crear}>
          Crear reunión
        </Button>
      </div>

      <InfoDialog open={info} onOpenChange={setInfo} />
    </div>
  );
}
