import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { BOTON } from "@/lib/botones";
import { cn } from "@/lib/utils";

/** Cuando el link no lleva a ninguna página (por ejemplo, una reunión que no existe o un link mal copiado). */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
      <Logo className="size-10 text-primary" />
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">No encontramos esta página</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">El link puede estar incompleto o la reunión ya no existe. Revisa que esté copiado completo.</p>
      </div>
      <Link href="/" className={cn(buttonVariants(), BOTON.principal, "px-6")}>
        Crear una reunión
      </Link>
    </main>
  );
}
