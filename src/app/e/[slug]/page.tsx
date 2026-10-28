import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Responder } from "@/components/responder/responder";
import { obtenerReunion } from "@/lib/reuniones";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const datos = await obtenerReunion(slug);
  return { title: datos ? `${datos.reunion.titulo} · WeMeet` : "WeMeet" };
}

async function Reunion({ params }: { params: PageProps<"/e/[slug]">["params"] }) {
  const { slug } = await params;
  const datos = await obtenerReunion(slug);
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
