"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useOrigen } from "@/lib/cliente";
import { Confirmada } from "./confirmada";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BOTON } from "@/lib/botones";
import { gruposDeCierre, textoBloque } from "@/lib/cierre";
import { leerLlave } from "@/lib/dueno";
import { type Reunion, zonaCorta } from "@/lib/reunion";
import { type PersonaSet, horaDeFila } from "@/lib/respuestas";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  reunion: Reunion;
  personas: PersonaSet[];
  /** Se llama cuando la reunión quedó cerrada. */
  onCerrada?: () => void;
  /** Si la reunión ya estaba cerrada, el bloque elegido: el popup abre directo en la confirmación (horario, calendario y copiar). */
  confirmadaInicial?: string | null;
};

/**
 * El popup de cerrar la reunión, en tres pasos: elegir el horario (todos los bloques, en grupos del que más gente reúne al que
 * menos), confirmar la elección (cerrar no se puede deshacer) y, ya cerrada, la confirmación con el calendario y el mensaje.
 */
export function CerrarDialog({
  open,
  onOpenChange,
  slug,
  reunion: r,
  personas,
  onCerrada,
  confirmadaInicial = null,
}: Props) {
  const router = useRouter();
  const grupos = useMemo(() => gruposDeCierre(r, personas), [r, personas]);
  const [elegido, setElegido] = useState<string | null>(null);
  /** Se eligió un horario y se está pidiendo confirmar antes de cerrar. */
  const [porConfirmar, setPorConfirmar] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  /** El bloque con que se cerró la reunión: mientras sea null se está eligiendo; después, el popup muestra la confirmación. */
  const [confirmado, setConfirmado] = useState<string | null>(
    confirmadaInicial,
  );
  const origen = useOrigen();

  const opcionElegida = useMemo(
    () => grupos.flatMap((g) => g.opciones).find((o) => o.bloque === elegido),
    [grupos, elegido],
  );

  const cerrar = async () => {
    if (!elegido) return;
    setCerrando(true);
    try {
      const res = await fetch(`/api/events/${slug}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bloque: elegido, tokenDueno: leerLlave(slug) }),
      });
      if (!res.ok)
        throw new Error(
          (await res.json().catch(() => ({}))).error ??
            "No pudimos cerrar la reunión.",
        );
      // El popup no se cierra: pasa a la confirmación, donde se puede agregar al calendario o copiar el mensaje.
      setConfirmado(elegido);
      setPorConfirmar(false);
      onCerrada?.();
      router.refresh();
    } catch (e) {
      setPorConfirmar(false);
      toast.error(
        e instanceof TypeError
          ? "No pudimos conectarnos. Revisa tu internet e intenta de nuevo."
          : (e as Error).message,
      );
    } finally {
      setCerrando(false);
    }
  };

  const titulo = confirmado
    ? "Reunión cerrada"
    : porConfirmar
      ? "¿Cerrar la reunión?"
      : "Cerrar reunión";
  const descripcion = confirmado
    ? "Agrégala a tu calendario o comparte la confirmación con el grupo."
    : porConfirmar
      ? "Cerrar es definitivo: después no se podrá cambiar el horario ni las respuestas."
      : "Elige el horario definitivo. Cuando cierres la reunión, nadie podrá cambiar sus respuestas.";

  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => !cerrando && onOpenChange(abierto)}
    >
      {/* Crece con la ventana (hasta 56 rem) pero no se estira de alto (máx. 40 rem): solo la lista se desplaza; el título y los botones quedan fijos. */}
      <DialogContent className="flex h-auto max-h-[min(calc(100dvh-3rem),40rem)] max-w-[calc(100%-3rem)] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(calc(100%-5rem),56rem)]">
        <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-3">
          <DialogTitle className="font-heading text-xl font-extrabold tracking-tight">
            {titulo}
          </DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        {confirmado ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <Confirmada
                slug={slug}
                reunion={r}
                bloque={confirmado}
                enlace={`${origen}/e/${slug}`}
              />
            </div>
            <div className="shrink-0 border-t px-5 pt-3 pb-5">
              <Button
                type="button"
                variant="outline"
                className={cn(BOTON.secundario, "ml-auto flex w-full max-w-md")}
                onClick={() => onOpenChange(false)}
              >
                Listo
              </Button>
            </div>
          </>
        ) : porConfirmar && elegido ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="mx-auto flex w-full max-w-md flex-col gap-1 rounded-2xl bg-accent px-4 py-4 text-center">
                <p className="text-xs text-muted-foreground">
                  La reunión quedará el
                </p>
                <p className="font-heading text-xl font-extrabold tracking-tight [overflow-wrap:anywhere]">
                  {textoBloque(r, elegido)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hora de {zonaCorta(r.zona)}
                </p>
                {opcionElegida && opcionElegida.faltan.length > 0 && (
                  <p className="mt-2 text-sm [overflow-wrap:anywhere]">
                    No puede:{" "}
                    <b className="font-semibold">
                      {opcionElegida.faltan.map((f) => f.nombre).join(", ")}
                    </b>
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 border-t px-5 pt-3 pb-5">
              <div className="ml-auto grid max-w-md grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={BOTON.secundario}
                  disabled={cerrando}
                  onClick={() => setPorConfirmar(false)}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  className={BOTON.principal}
                  disabled={cerrando}
                  onClick={cerrar}
                >
                  {cerrando ? "Cerrando…" : "Sí, cerrar"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {grupos.length ? (
              <div
                role="radiogroup"
                aria-label="Horarios"
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-3"
              >
                {grupos.map((g, i) => (
                  <details
                    key={g.id}
                    open={i === 0}
                    className="group rounded-2xl border"
                  >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2 text-sm font-bold [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {g.titulo}
                      </span>
                      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                        {g.opciones.length}
                      </span>
                    </summary>
                    <ul className="grid grid-cols-1 gap-1.5 px-2 pb-2 sm:grid-cols-2 xl:grid-cols-3">
                      {g.opciones.map((o) => {
                        const activo = elegido === o.bloque;
                        return (
                          <li key={o.bloque}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={activo}
                              onClick={() => setElegido(o.bloque)}
                              className={cn(
                                "flex w-full flex-col items-start rounded-xl border-[1.5px] px-3 py-2 text-left text-sm",
                                activo
                                  ? "border-primary bg-accent"
                                  : "border-transparent bg-muted hover:bg-muted/70",
                              )}
                            >
                              <b className="font-semibold">
                                {textoBloque(r, o.bloque).split(", ")[0]} ·{" "}
                                {horaDeFila(r, o.fila)} a{" "}
                                {horaDeFila(r, o.fila + 1)}
                              </b>
                              {o.faltan.length > 0 && (
                                <span className="line-clamp-2 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                                  No puede:{" "}
                                  {o.faltan.map((f) => f.nombre).join(", ")}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                ))}
              </div>
            ) : (
              <p className="m-5 rounded-2xl border-[1.5px] border-dashed p-5 text-center text-sm text-muted-foreground">
                Todavía no hay horarios para elegir: nadie ha respondido, o
                nadie puede en ningún bloque.
              </p>
            )}

            <div className="shrink-0 border-t px-5 pt-3 pb-5">
              <div className="ml-auto grid max-w-md grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={BOTON.secundario}
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className={BOTON.principal}
                  disabled={!elegido}
                  onClick={() => setPorConfirmar(true)}
                >
                  Cerrar reunión
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
