import { desdeIso } from "./reunion";
import type { Aviso } from "@/components/responder/notificar-dialog";
import { mesCorto } from "./respuestas";

/** Una reunión en la lista del perfil: creada o respondida por la cuenta. */
export type ReunionDePerfil = {
  slug: string;
  titulo: string;
  tags: string[];
  respuestas: number;
  /** Si la creaste tú o la respondiste. */
  rol: "creada" | "respondida";
  /** Día (AAAA-MM-DD) en que la creaste o respondiste. */
  fecha: string;
  /** El aviso por correo que pediste, si pediste alguno. */
  aviso: Aviso | null;
};

export type Tipo = "todas" | ReunionDePerfil["rol"];
export type Orden = { clave: "fecha" | "nombre"; sentido: "asc" | "desc" };

/** Lo más reciente primero. */
export const ORDEN_INICIAL: Orden = { clave: "fecha", sentido: "desc" };

export const TIPOS: { valor: Tipo; texto: string }[] = [
  { valor: "todas", texto: "Todas" },
  { valor: "creada", texto: "Creadas" },
  { valor: "respondida", texto: "Respondidas" },
];

/** Cuántos caracteres puede tener un tag. */
export const MAX_TAG = 24;
/** Cuántos tags puede tener una reunión. */
export const MAX_TAGS_POR_REUNION = 5;
/** Cuántos tags distintos puede tener una cuenta en total. */
export const MAX_TAGS_TOTALES = 30;

/** El texto de un tag, como se guarda: sin "#" ni espacios de más. Se respeta cómo lo escribiste ("IHC" sigue siendo "IHC"). */
export const normalizarTag = (texto: string): string => texto.replace(/^#+/, "").trim().replace(/\s+/g, " ").slice(0, MAX_TAG);

/** El tag de la lista que es el mismo que `tag` sin distinguir mayúsculas ("ihc" es "IHC"), si existe. */
export const buscarTag = (tag: string, tags: string[]): string | undefined => tags.find((t) => t.toLowerCase() === tag.toLowerCase());

export const todosLosTags = (reuniones: ReunionDePerfil[]): string[] =>
  [...new Set(reuniones.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, "es"));

/** Las reuniones del tipo pedido que tienen todos los tags elegidos. */
export const filtrar = (reuniones: ReunionDePerfil[], tipo: Tipo, tags: string[]): ReunionDePerfil[] =>
  reuniones.filter((r) => (tipo === "todas" || r.rol === tipo) && tags.every((t) => r.tags.includes(t)));

export function ordenar(reuniones: ReunionDePerfil[], orden: Orden): ReunionDePerfil[] {
  const signo = orden.sentido === "asc" ? 1 : -1;
  return [...reuniones].sort((a, b) => signo * (orden.clave === "fecha" ? a.fecha.localeCompare(b.fecha) : a.titulo.localeCompare(b.titulo, "es")));
}

/** "Creada el 27 oct" o "Respondida el 26 oct". */
export function textoFecha(r: Pick<ReunionDePerfil, "rol" | "fecha">): string {
  return `${r.rol === "creada" ? "Creada" : "Respondida"} el ${desdeIso(r.fecha).getDate()} ${mesCorto(r.fecha)}`;
}

export const textoRespuestas = (n: number): string => `${n} ${n === 1 ? "respuesta" : "respuestas"}`;
