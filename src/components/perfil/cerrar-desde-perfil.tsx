"use client";

import { TITULO } from "@/lib/utilidades/estilos";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CerrarDialog } from "@/components/compartidos/cerrar-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { pedir } from "@/lib/api";
import { type ReunionConRespuestas, conjuntos } from "@/lib/reunion/respuestas";

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
    pedir<ReunionConRespuestas>(`/api/events/${slug}`, { porDefecto: "No pudimos cargar la reunión." })
      .then((d) => vigente && setDatos(d))
      .catch((e: Error) => {
        if (!vigente) return;
        toast.error(e.message);
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
          <DialogTitle className={TITULO.medio}>Cargando…</DialogTitle>
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
