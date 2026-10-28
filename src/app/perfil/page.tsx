import type { Metadata } from "next";

import { PerfilConSesion } from "@/components/perfil/perfil-con-sesion";

export const metadata: Metadata = { title: "Tu perfil · WeMeet" };

export default function Page() {
  return <PerfilConSesion />;
}
