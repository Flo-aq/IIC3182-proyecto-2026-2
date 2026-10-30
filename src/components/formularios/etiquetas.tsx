"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { BOTON } from "@/lib/utilidades/botones";
import { Input } from "@/components/ui/input";
import { avisarTopeReunion, avisarTopeTotal } from "@/lib/cuenta/avisos-tags";
import { MAX_TAG, MAX_TAGS_POR_REUNION, MAX_TAGS_TOTALES, buscarTag, normalizarTag } from "@/lib/cuenta/perfil";
import { cn } from "@/lib/utils";

type Props = {
  /** Los tags de esta reunión. */
  elegidos: string[];
  onChange: (tags: string[]) => void;
  /** Todos los tags que ya tiene la cuenta, para elegirlos con un toque. */
  deLaCuenta: string[];
  /** De qué son los tags ("Esta reunión", "Esta plantilla") y para qué sirven, en el mensaje de abajo. */
  sujeto?: string;
  ayuda?: string;
};

/** Los tags de la reunión que se está creando: se eligen entre los de la cuenta o se crea uno. Solo para quien tiene cuenta. */
export function Etiquetas({ elegidos, onChange, deLaCuenta, sujeto = "Esta reunión", ayuda = "Sirven para buscar tus reuniones después." }: Props) {
  const [texto, setTexto] = useState("");
  const idCampo = useId();
  const todos = [...new Set([...deLaCuenta, ...elegidos])].sort((a, b) => a.localeCompare(b, "es"));
  const nuevo = normalizarTag(texto);

  /** Agrega el tag si hay lugar. Devuelve si lo agregó; si no, avisa por qué. */
  const agregar = (escrito: string): boolean => {
    // Si ya existe con otras mayúsculas ("ihc" y "IHC"), se usa el que ya existe.
    const tag = buscarTag(escrito, todos) ?? escrito;
    if (elegidos.includes(tag)) return true;
    if (elegidos.length >= MAX_TAGS_POR_REUNION) {
      avisarTopeReunion(sujeto);
      return false;
    }
    if (!todos.includes(tag) && todos.length >= MAX_TAGS_TOTALES) {
      avisarTopeTotal();
      return false;
    }
    onChange([...elegidos, tag]);
    return true;
  };

  const alternar = (tag: string) => (elegidos.includes(tag) ? onChange(elegidos.filter((t) => t !== tag)) : agregar(tag));

  return (
    <div className="flex flex-col gap-3">
      {todos.length > 0 && (
        <div role="group" aria-label="Tags" className="flex flex-wrap gap-1.5">
          {todos.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={elegidos.includes(t)}
              onClick={() => alternar(t)}
              className={cn("inline-flex h-8 max-w-full items-center rounded-full border-[1.5px] px-3 text-[0.8125rem] font-semibold", elegidos.includes(t) && "border-primary bg-primary text-primary-foreground")}
            >
              <span className="truncate">{t}</span>
            </button>
          ))}
        </div>
      )}
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (nuevo && agregar(nuevo)) setTexto("");
        }}
      >
        <label htmlFor={idCampo} className="sr-only">
          Nombre del tag nuevo
        </label>
        <Input id={idCampo} value={texto} maxLength={MAX_TAG} autoComplete="off" placeholder="Crear tag nuevo" className="h-10 rounded-full px-3.5" onChange={(e) => setTexto(e.target.value)} />
        <Button type="submit" variant="outline" className={BOTON.compacto} disabled={!nuevo}>
          Crear
        </Button>
      </form>
      <p role="status" className="text-xs text-muted-foreground">
        {sujeto} tiene {elegidos.length} de {MAX_TAGS_POR_REUNION} tags. {ayuda}
      </p>
    </div>
  );
}
