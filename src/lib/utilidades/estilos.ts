/** El margen lateral de las pantallas, respetando las zonas seguras del celular. */
export const PAD = "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]";

/** Una pantalla completa: ocupa el alto y, en pantalla ancha, se centra con un máximo de ancho. */
export const PAGINA = "mx-auto flex min-h-dvh w-full flex-col bg-background lg:max-w-[88rem]";

/** Los títulos: el de una pantalla o de un diálogo (grande) y el de una sección (medio). */
export const TITULO = {
  grande: "font-heading text-xl font-extrabold tracking-tight",
  medio: "font-heading text-lg font-extrabold tracking-tight",
} as const;

/** Un campo de texto grande, como el del nombre. */
export const CAMPO_TEXTO = "h-12 rounded-2xl border-[1.5px] px-3.5 text-base";
