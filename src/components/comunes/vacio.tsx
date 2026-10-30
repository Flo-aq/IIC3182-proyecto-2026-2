import type { ReactNode } from "react";

/** El recuadro punteado que ocupa el lugar de una lista vacía. */
export function Vacio({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded-2xl border-[1.5px] border-dashed p-5 text-center text-sm text-muted-foreground">{children}</div>;
}
