"use client";

import { Bell, BellOff, CalendarCheck, Copy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import type { Reunion } from "@/lib/reunion";
import { type PersonaSet, textoResumen } from "@/lib/respuestas";
import { cn } from "@/lib/utils";
import { CerrarDialog } from "./cerrar-dialog";
import { Confirmada } from "./confirmada";
import { type Aviso, NotificarDialog, textoAviso } from "./notificar-dialog";
import { PuntoClave } from "./punto-clave";

/** Alto de dos filas de burbujas: 2 × 1.875rem + el espacio entre ellas (0.375rem), en píxeles. */
const DOS_LINEAS_PX = 66;

async function copiar(texto: string, aviso: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(aviso);
  } catch {
    toast.error("No se pudo copiar. Selecciona el texto y cópialo a mano.");
  }
}

type Props = {
  slug: string;
  reunion: Reunion;
  personas: PersonaSet[];
  enlace: string;
  /** El bloque elegido si la reunión ya se cerró. */
  cerrada: string | null;
  /** Quien creó la reunión puede cerrarla y reabrirla desde aquí. */
  esDueno: boolean;
};

/** Link para invitar, quién respondió, un texto resumen para mandar al grupo y, para quien creó la reunión, cerrarla. */
export function Compartir({ slug, reunion: r, personas, enlace, cerrada, esDueno }: Props) {
  const [verTexto, setVerTexto] = useState(false);
  const [verAviso, setVerAviso] = useState(false);
  const [verCierre, setVerCierre] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  /** La lista de quién respondió muestra a lo más dos líneas; con "Ver más" se ve el resto. */
  const [abierta, setAbierta] = useState(false);
  const [hayMas, setHayMas] = useState(false);
  const lista = useRef<HTMLUListElement>(null);
  const idLista = useId();

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    const medir = () => setHayMas(el.scrollHeight > DOS_LINEAS_PX + 1);
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [personas.length]);
  const claves = personas.filter((p) => p.clave);
  const resumen = textoResumen(r, personas, enlace);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto pb-3">
      {cerrada && <Confirmada compacta slug={slug} reunion={r} bloque={cerrada} enlace={enlace} />}

      <Button type="button" className={`${BOTON.principal} gap-2`} onClick={() => copiar(enlace, "Link copiado")}>
        <Copy />
        Copiar link
      </Button>

      <section className="rounded-2xl border p-3" aria-label="Quién respondió">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-[0.95rem] font-bold">Respuestas</h2>
          <span className="text-[0.8125rem] text-muted-foreground">
            {personas.length} {personas.length === 1 ? "persona" : "personas"}
          </span>
        </div>
        <ul ref={lista} id={idLista} className={`flex flex-wrap gap-1.5 ${abierta ? "" : "max-h-[4.125rem] overflow-hidden"}`}>
          {personas.map((p) => (
            <li
              key={p.nombre + (p.yo ? "-yo" : "")}
              // Los integrantes clave van en amarillo; quien responde (tú) lleva un borde violeta.
              className={`flex h-[1.875rem] max-w-full items-center rounded-full px-2.5 text-[0.8125rem] font-semibold ${p.clave ? "bg-lime" : "bg-accent"} ${p.yo ? "ring-2 ring-primary" : ""}`}
            >
              <span className="truncate">{p.nombre}</span>
            </li>
          ))}
        </ul>
        {hayMas && (
          <Button type="button" variant="ghost" className={`${BOTON.texto} mt-1`} aria-expanded={abierta} aria-controls={idLista} onClick={() => setAbierta((a) => !a)}>
            {abierta ? "Ver menos" : "Ver más"}
          </Button>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {r.claves > 0 && <PuntoClave />}
          {r.claves
            ? `${claves.length} de ${r.claves} integrantes clave ${claves.length === 1 ? "ha respondido" : "han respondido"}.`
            : "Esta reunión no tiene integrantes clave."}
        </p>
      </section>

      {/* Una reunión cerrada ya no espera respuestas: no se cierra de nuevo ni tiene sentido pedir un aviso. */}
      {!cerrada && (
        <div className="flex flex-col gap-2">
          {/* Cerrar y Notificarme pesan lo mismo: son dos botones iguales, uno bajo el otro. */}
          {esDueno && (
            <Button type="button" variant="outline" className={BOTON.secundario} aria-haspopup="dialog" onClick={() => setVerCierre(true)}>
              <CalendarCheck />
              Cerrar reunión
            </Button>
          )}
          {aviso ? (
            // Un aviso no se edita: se quita y se pide uno nuevo.
            <>
              <Button
                type="button"
                variant="outline"
                className={cn(BOTON.secundario, "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive")}
                onClick={() => {
                  setAviso(null);
                  toast.success("Aviso quitado");
                }}
              >
                <BellOff />
                Quitar mi aviso
              </Button>
              <p role="status" className="px-2 text-xs text-muted-foreground">
                Te avisaremos {textoAviso(aviso)} a {aviso.correo}. Para cambiarlo, quítalo y pide uno nuevo.
              </p>
            </>
          ) : (
            <Button type="button" variant="outline" className={BOTON.secundario} aria-haspopup="dialog" onClick={() => setVerAviso(true)}>
              <Bell />
              Notificarme
            </Button>
          )}
          <hr className="my-1 border-t-2 border-foreground/25" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Button type="button" variant="outline" className={BOTON.secundario} onClick={() => copiar(resumen, "Resumen copiado")}>
          <Copy />
          Copiar resumen
        </Button>
        <Button type="button" variant="ghost" className={`${BOTON.texto} self-start`} aria-expanded={verTexto} onClick={() => setVerTexto((v) => !v)}>
          {verTexto ? "Ocultar el texto" : "Ver el texto del resumen"}
        </Button>
        {verTexto && <pre className="rounded-2xl border bg-muted p-3 font-sans text-xs/relaxed break-words whitespace-pre-wrap">{resumen}</pre>}
      </div>

      {esDueno && <CerrarDialog open={verCierre} onOpenChange={setVerCierre} slug={slug} reunion={r} personas={personas} />}
      <NotificarDialog
        open={verAviso}
        onOpenChange={setVerAviso}
        respondieron={personas.length}
        inicial={null}
        onGuardar={(a) => {
          setAviso(a);
          toast.success("Aviso activado", { description: `Te avisaremos ${textoAviso(a)} a ${a.correo}.` });
        }}
      />
    </div>
  );
}
