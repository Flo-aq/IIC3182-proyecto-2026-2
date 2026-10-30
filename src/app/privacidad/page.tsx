import type { Metadata } from "next";

import { PaginaLegal } from "@/components/comunes/pagina-legal";

export const metadata: Metadata = { title: "Política de privacidad · WeMeet" };

export default function Page() {
  return (
    <PaginaLegal
      titulo="Política de privacidad"
      actualizada="28 de octubre de 2026"
      otra={{ href: "/terminos", texto: "Ver las condiciones del servicio →" }}
      secciones={[
        {
          titulo: "Qué es WeMeet",
          contenido: (
            <p>
              WeMeet es una aplicación para coordinar horarios entre varias personas. Es un proyecto del curso IIC3182 (Interfaces
              Humano-Computador) de la universidad, hecho con fines educativos.
            </p>
          ),
        },
        {
          titulo: "Qué datos guardamos",
          contenido: (
            <>
              <p>
                <b>Si no tienes cuenta</b> (no hace falta para usar WeMeet):
              </p>
              <ul>
                <li>Los datos de la reunión que se crea: nombre, días, horario, duración de los bloques, zona horaria e integrantes clave.</li>
                <li>El nombre que escribes al responder y los horarios en que puedes.</li>
              </ul>
              <p>
                <b>Si inicias sesión con Google:</b> además guardamos tu correo y tu nombre de Google, para mostrarte tus reuniones,
                tags y plantillas. No recibimos ni guardamos tu contraseña de Google.
              </p>
              <p>
                <b>Si pides un aviso por correo:</b> guardamos el correo que escribes, solo para enviarte ese aviso.
              </p>
            </>
          ),
        },
        {
          titulo: "Para qué los usamos",
          contenido: (
            <p>
              Solo para que la aplicación funcione: mostrar la reunión y las respuestas a quien tenga el link, mostrarte tu perfil y
              enviar los avisos que pidas. No vendemos tus datos, no mostramos publicidad y no los usamos para nada más.
            </p>
          ),
        },
        {
          titulo: "Quién puede ver tus datos",
          contenido: (
            <>
              <p>
                Cualquier persona que tenga el link de una reunión puede ver su nombre, quiénes respondieron con qué nombre y sus horarios.
                Por eso, comparte el link solo con quienes quieras que participen y no pongas datos sensibles en el título ni en los nombres.
              </p>
              <p>
                Para guardar los datos usamos Supabase (base de datos e inicio de sesión) y Vercel (alojamiento). Ambos procesan los datos
                en nuestro nombre y no los usan para sus propios fines.
              </p>
            </>
          ),
        },
        {
          titulo: "Cuánto tiempo los guardamos",
          contenido: (
            <p>
              Una reunión, con todas sus respuestas, se borra automáticamente <b>2 meses después de su última respuesta</b> (o 2 meses
              después de crearla, si nadie respondió). Los datos de tu cuenta se conservan mientras la tengas.
            </p>
          ),
        },
        {
          titulo: "Tus derechos",
          contenido: (
            <p>
              Puedes pedirnos que borremos una reunión, tus respuestas o tu cuenta, o que te mostremos qué datos tuyos tenemos.
              Escríbenos a <a className="font-semibold text-primary hover:underline" href="mailto:florenciajas@gmail.com">florenciajas@gmail.com</a> y
              lo hacemos.
            </p>
          ),
        },
      ]}
    />
  );
}
