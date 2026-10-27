import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Responder } from "@/components/responder/responder";
import { REUNIONES_DE_EJEMPLO, reunionDeEjemplo } from "@/lib/demo-reuniones";

// Mientras no hay base de datos, la página muestra reuniones de ejemplo: una por caso que hay que evaluar.
export function generateStaticParams() {
  return REUNIONES_DE_EJEMPLO.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const datos = reunionDeEjemplo(slug);
  return { title: datos ? `${datos.reunion.titulo} · WeMeet` : "WeMeet" };
}

async function Reunion({ params }: { params: PageProps<"/e/[slug]">["params"] }) {
  const { slug } = await params;
  const datos = reunionDeEjemplo(slug);
  if (!datos) notFound();
  return <Responder datos={datos} />;
}

export default function Page({ params }: PageProps<"/e/[slug]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-background" />}>
      <Reunion params={params} />
    </Suspense>
  );
}
