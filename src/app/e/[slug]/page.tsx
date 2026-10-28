import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Responder } from "@/components/responder/responder";
import { usuarioActual } from "@/lib/supabase/servidor";
import { leerReunion, paraElNavegador } from "@/server/reuniones";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const datos = await leerReunion(slug);
  return { title: datos ? `${datos.reunion.titulo} · WeMeet` : "WeMeet" };
}

async function Reunion({ params }: { params: PageProps<"/e/[slug]">["params"] }) {
  const { slug } = await params;
  const datos = await leerReunion(slug);
  if (!datos) notFound();
  // Con sesión, si la reunión es de esta cuenta puede cerrarla; sin cuenta, el navegador usa la llave que guardó al crearla.
  const usuario = await usuarioActual();
  const esDuenoCuenta = usuario !== null && datos.duenoId === usuario.id;
  // Se sabe desde el servidor si hay cuenta, para que Mi horario ya salga lista al cargar (sin un instante de pantalla de nombre).
  return <Responder datos={paraElNavegador(datos)} esDuenoCuenta={esDuenoCuenta} cuentaNombre={usuario?.nombre ?? null} />;
}

export default function Page({ params }: PageProps<"/e/[slug]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-background" />}>
      <Reunion params={params} />
    </Suspense>
  );
}
