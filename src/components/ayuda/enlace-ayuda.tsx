import Link from "next/link";

const CLASE = "inline-flex min-h-9 items-center rounded-full px-2 text-[0.8125rem] font-bold text-primary hover:underline";

/** Vínculos a "How to" y a las preguntas frecuentes (FAQ), iguales en todas las pantallas. */
export function EnlacesAyuda() {
  return (
    <nav aria-label="Ayuda" className="flex items-center">
      <Link href="/how-to" className={CLASE}>
        How to
      </Link>
      <Link href="/faq" className={CLASE}>
        FAQ
      </Link>
    </nav>
  );
}
