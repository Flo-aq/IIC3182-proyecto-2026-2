"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CerrarDialog } from "@/components/responder/cerrar-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { type ReunionConRespuestas, conjuntos } from "@/lib/respuestas";

type Props = {
  slug: string;
  onOpenChange: (open: boolean) => void;
  /** Se llama cuando la reunión quedó cerrada. */
  onCerrada: () => void;
};

/**
 * El popup de cierre desde el perfil: la lista solo trae lo básico de cada reunión, así que al abrir se piden sus datos
 * (GET /api/events/[slug]) y, mientras llegan, el popup dice "Cargando…". Si la reunión ya estaba cerrada, abre directo en la
 * confirmación (cuándo quedó, agendar y copiar); si no, en la lista de horarios para elegir.
 */
export function CerrarDesdePerfil({ slug, onOpenChange, onCerrada }: Props) {
  const [datos, setDatos] = useState<ReunionConRespuestas | null>(null);
  const personas = useMemo(() => conjuntos(datos?.personas ?? []), [datos]);

  useEffect(() => {
    let vigente = true;
    fetch(`/api/events/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No pudimos cargar la reunión.");
        return (await res.json()) as ReunionConRespuestas;
      })
      .then((d) => vigente && setDatos(d))
      .catch((e: Error) => {
        if (!vigente) return;
        toast.error(e instanceof TypeError ? "No pudimos conectarnos. Revisa tu internet e intenta de nuevo." : e.message);
        onOpenChange(false);
      });
    return () => {
      vigente = false;
    };
    // Se pide una vez al abrir; `onOpenChange` cambia en cada render del perfil y no debe repetir la petición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!datos) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[calc(100%-3rem)] rounded-3xl p-5 text-center sm:max-w-xs" aria-busy="true">
          <DialogTitle className="font-heading text-lg font-extrabold tracking-tight">Cargando…</DialogTitle>
          <DialogDescription>Estamos buscando las respuestas de la reunión.</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <CerrarDialog
      open
      onOpenChange={onOpenChange}
      slug={slug}
      reunion={datos.reunion}
      personas={personas}
      onCerrada={onCerrada}
      confirmadaInicial={datos.cerrada}
    />
  );
}
