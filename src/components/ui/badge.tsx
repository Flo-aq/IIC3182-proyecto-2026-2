"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

/** Una etiqueta redonda y chica (Creada, Cerrada, un tag...), con los colores de WeMeet. */
const badgeVariants = cva("rounded-full", {
  variants: {
    variant: {
      /** Amarillo: lo que hay que notar (Creada, Cerrada, Tuyas). */
      lima: "bg-lime font-bold",
      /** Violeta claro: etiquetas normales, como los tags. */
      acento: "bg-accent font-semibold text-accent-foreground",
    },
    tamano: {
      normal: "px-2.5 py-0.5 text-xs",
      compacto: "px-2 py-0.5 text-xs",
      mini: "px-2 py-0.5 text-[0.6875rem]",
    },
  },
  defaultVariants: { variant: "acento", tamano: "normal" },
})

function Badge({
  className,
  variant,
  tamano,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, tamano }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
