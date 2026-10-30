import type { Metadata } from "next";

import { PaginaLegal } from "@/components/comunes/pagina-legal";

export const metadata: Metadata = { title: "Condiciones del servicio · WeMeet" };

export default function Page() {
  return (
    <PaginaLegal
      titulo="Condiciones del servicio"
      actualizada="28 de octubre de 2026"
      otra={{ href: "/privacidad", texto: "Ver la política de privacidad →" }}
      secciones={[
        {
          titulo: "Uso del servicio",
          contenido: (
            <p>
              WeMeet es un proyecto educativo gratuito para coordinar horarios. Puedes crear reuniones y responder sin cuenta. Úsalo
              de buena fe: no lo uses para spam, para hacerte pasar por otra persona ni para guardar contenido ilegal u ofensivo.
            </p>
          ),
        },
        {
          titulo: "Tu responsabilidad",
          contenido: (
            <p>
              Eres responsable de lo que escribes (nombres y títulos) y de con quién compartes el link. Cualquiera que tenga el link de
              una reunión puede verla y responder, y quien escribe el mismo nombre que otra persona edita su respuesta: WeMeet no
              verifica identidades.
            </p>
          ),
        },
        {
          titulo: "Sin garantías",
          contenido: (
            <p>
              Al ser un proyecto del curso, el servicio se ofrece tal cual, sin garantía de que esté siempre disponible ni libre de
              errores. Las reuniones se borran automáticamente 2 meses después de su última respuesta, y el servicio puede cambiar o
              cerrarse sin aviso.
            </p>
          ),
        },
        {
          titulo: "Cambios y contacto",
          contenido: (
            <p>
              Podemos actualizar estas condiciones; la fecha de arriba indica la última vez. Si tienes dudas, escríbenos a{" "}
              <a className="font-semibold text-primary hover:underline" href="mailto:florenciajas@gmail.com">florenciajas@gmail.com</a>.
            </p>
          ),
        },
      ]}
    />
  );
}
