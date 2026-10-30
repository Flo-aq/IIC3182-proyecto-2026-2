import { toast } from "sonner";

import { MAX_TAGS_POR_REUNION, MAX_TAGS_TOTALES } from "./perfil";

/** Los avisos de cuando no se puede agregar otro tag: los mismos en el perfil y al crear una reunión. */
export const avisarTopeReunion = (sujeto = "Esta reunión") =>
  toast.error(`${sujeto} ya tiene ${MAX_TAGS_POR_REUNION} tags, el máximo`, { description: "Quita uno para poder agregar otro." });

export const avisarTopeTotal = () =>
  toast.error(`Ya tienes ${MAX_TAGS_TOTALES} tags, el máximo`, {
    description: "Un tag deja de contar cuando ya no está en ninguna reunión. Quítalo de todas para crear otro.",
  });
