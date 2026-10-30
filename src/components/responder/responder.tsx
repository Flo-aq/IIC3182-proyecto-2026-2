"use client";

import { PAD } from "@/lib/utilidades/estilos";
import { ListaDePestanas, Pestana } from "@/components/comunes/pestanas";
import { Hand, Info, PaintBucket, Share2 } from "lucide-react";
import { useMemo, useState } from "react";

import { AvisoSuperior, BarraSuperior } from "@/components/comunes/barra-superior";
import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { useEsPantallaAncha, useOrigen } from "@/lib/utilidades/cliente";
import { type ReunionConRespuestas, columnasDe, esSemanal, mapaBloqueados, semanasDe } from "@/lib/reunion/respuestas";
import { textoBloque } from "@/lib/reunion/cierre";
import { Compartir } from "./compartir";
import { Confirmada } from "../compartidos/confirmada";
import { DetallesDialog } from "./detalles-dialog";
import { Grilla } from "./grilla/grilla";
import { Acceso, MenuUsuario } from "./identidad";
import { Leyenda } from "./grilla/leyenda";
import { Encabezado, NavSemana, PESTANAS } from "./partes";
import { PieGuardar } from "./pie-guardar";
import { QuienPuede, QuienPuedeVacio } from "./grilla/quien-puede";
import { useRefrescoAutomatico, useRespuesta } from "./use-respuesta";
import { useTarjetaCompartir } from "./use-tarjeta-compartir";

/** Pantalla de quien recibe el link: marca cuándo puede, mira al grupo y comparte el estado. */
export function Responder({ datos, esDuenoCuenta, cuentaNombre }: { datos: ReunionConRespuestas; esDuenoCuenta: boolean; cuentaNombre: string | null }) {
  const { reunion: r, slug, cerrada } = datos;
  const {
    mias,
    cambiar,
    guardadas,
    nombre,
    setNombre,
    clave,
    setClave,
    listo,
    retomada,
    esDueno,
    guardando,
    esClave,
    hayCuenta,
    existente,
    hayClaves,
    clavesLlenas,
    personas,
    marcados,
    textoHoras,
    sinCambios,
    continuar,
    cambiarNombre,
    guardar,
  } = useRespuesta(datos, esDuenoCuenta, cuentaNombre);
  const [pestana, setPestana] = useState(0);
  const [verDetalles, setVerDetalles] = useState(false);
  const [semana, setSemana] = useState(0);
  const [fijado, setFijado] = useState<string | null>(null);
  const [visto, setVisto] = useState<string | null>(null);
  const [desbordaMia, setDesbordaMia] = useState(false);
  const [pintar, setPintar] = useState(false);

  // Desde lg se ven a la vez Mi horario y Respuestas, con Compartir flotante; antes, con pestañas.
  const escritorio = useEsPantallaAncha();
  const { panelAbierto, setPanelAbierto, cajaCompartir, panelCompartir } = useTarjetaCompartir(escritorio);
  useRefrescoAutomatico();
  const origen = useOrigen();
  const enlace = `${origen}/e/${slug}`;

  const bloqueados = useMemo(() => mapaBloqueados(r), [r]);
  const semanal = esSemanal(r);
  const semanas = semanasDe(r.dias);
  const columnas = columnasDe(r, semana);

  const ver = fijado ?? visto;

  const verMia = escritorio || pestana === 0;
  const verRespuestas = escritorio || pestana === 1;
  const verCompartir = !escritorio && pestana === 2;

  const pie = (
    <PieGuardar
      // Con cuenta no se pasa por la pantalla de acceso, así que aquí se declara si eres integrante clave (solo la primera vez).
      pideClave={hayCuenta && hayClaves && !clavesLlenas && !retomada}
      clave={clave}
      onClave={setClave}
      marcados={marcados}
      bloqueMin={r.bloqueMin}
      textoHoras={textoHoras}
      sinGuardar={guardadas === null}
      sinCambios={sinCambios}
      guardando={guardando}
      onGuardar={guardar}
    />
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
              <Compartir slug={slug} reunion={r} personas={personas} enlace={enlace} cerrada={cerrada} esDueno={esDueno} nombre={listo ? nombre.trim() : undefined} />
            </section>
          </div>
        )}
      </div>

      {!escritorio && (
        <ListaDePestanas aria-label="Secciones" className={`${PAD} shrink-0 py-1`}>
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {PESTANAS.map((t, i) => (
              <Pestana
                key={t}
                seleccionada={pestana === i}
                className={`h-9 flex-1 rounded-full text-[0.8125rem] font-semibold ${pestana === i ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                onClick={() => {
                  setPestana(i);
                  setFijado(null);
                  setVisto(null);
                }}
              >
                {t}
              </Pestana>
            ))}
          </div>
        </ListaDePestanas>
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
              <Compartir slug={slug} reunion={r} personas={personas} enlace={enlace} cerrada={cerrada} esDueno={esDueno} nombre={listo ? nombre.trim() : undefined} />
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
