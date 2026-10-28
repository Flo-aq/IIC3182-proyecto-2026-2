// Textos de la ayuda: los pasos de "Cómo funciona" (que también van en la ventana de crear reunión), la guía por pantalla de
// How to y las preguntas frecuentes de FAQ, agrupadas por pantalla.

export const PASOS = [
  {
    titulo: "Configura la reunión",
    texto: "Elige nombre, días, horario y duración de los bloques. Puedes bloquear horarios y definir integrantes clave.",
  },
  { titulo: "Comparte el link", texto: "Al crearla te damos un link. Cualquiera lo abre sin cuenta." },
  { titulo: "Cada persona marca cuándo puede", texto: "Tocan los bloques en que están disponibles y guardan." },
  {
    titulo: "Elige el mejor horario",
    texto: "Ves dónde coincide más gente, copias el resumen y cierras la reunión para enviar la invitación al calendario.",
  },
];

/** Cada pantalla tiene un `id` (para enlazar a su sección, como /how-to#perfil) y un nombre `corto` para la pestaña. */
export type Guia = { vista: string; id: string; corto: string; resumen: string; pasos: string[]; nota?: string };

/** How to: qué se hace en cada pantalla, en el orden en que se usa. */
export const GUIAS: Guia[] = [
  {
    vista: "Crear una reunión",
    id: "crear",
    corto: "Crear",
    resumen: "Para quien organiza. No necesitas cuenta.",
    pasos: [
      "Escribe el nombre de la reunión y elige los días en el calendario. Si son más de 7, se ven por semanas.",
      "Define el horario y cuánto dura cada bloque (10, 15, 20, 30 o 60 minutos). También puedes elegir todo el día.",
      "Bloquea los horarios que no se pueden usar, como el almuerzo, y define hasta dos integrantes clave si la reunión depende de alguien. Si quieres, parte desde una plantilla.",
      "Revisa el resumen (al costado en el computador, o con \"Ver resumen\" en el celular) y toca \"Crear reunión\".",
    ],
    nota: "Con una cuenta también puedes ponerle tags a la reunión, para encontrarla después en tu perfil.",
  },
  {
    vista: "Responder una reunión",
    id: "responder",
    corto: "Responder",
    resumen: "Para quien recibe el link. No necesitas cuenta: basta con tu nombre.",
    pasos: [
      "Abre el link y escribe tu nombre. Si ya habías respondido, escribe el mismo nombre para cargar y editar tus horarios.",
      "Si eres integrante clave, márcalo al escribir tu nombre.",
      "En Mi horario toca los bloques en que puedes, o arrastra para pintar varios. Los bloques con rayas están bloqueados y no se pueden marcar.",
      "Toca \"Guardar mis horarios\". Puedes volver cuando quieras a cambiarlos.",
    ],
  },
  {
    vista: "Ver las respuestas",
    id: "respuestas",
    corto: "Respuestas",
    resumen: "Para decidir cuándo juntarse.",
    pasos: [
      "En Respuestas, el gris muestra cuánta gente puede en cada bloque: más oscuro, más gente. El violeta aparece donde pueden todos los integrantes clave.",
      "Pasa el mouse por un bloque, o tócalo en el celular, para ver quién puede y quién no.",
      "En el computador ves Mi horario y Respuestas a la vez. En el celular, cambias entre las pestañas.",
    ],
  },
  {
    vista: "Compartir y avisos",
    id: "compartir",
    corto: "Compartir",
    resumen: "Para invitar y para enterarte cuando haya novedades.",
    pasos: [
      "En Compartir, copia el link para invitar a más gente y copia el resumen para pegarlo en el chat del grupo. En el computador, es el botón \"Compartir\" de arriba a la derecha.",
      "Con \"Notificarme\" pides un aviso por correo: cuando respondan cierta cantidad de personas, en una fecha, o en una fecha y hora.",
      "Un aviso no se edita: si quieres cambiarlo, quítalo y pide uno nuevo.",
    ],
  },
  {
    vista: "Tu perfil",
    id: "perfil",
    corto: "Perfil",
    resumen: "Solo con una cuenta, que es distinto de escribir tu nombre al responder.",
    pasos: [
      "Ves todas tus reuniones, las que creaste y las que respondiste, con cuándo las creaste o respondiste y cuántas respuestas tienen.",
      "Filtra por tipo y por tag, y ordena por fecha o por nombre.",
      "Con \"Editar tags\" agregas o quitas tags desde la misma lista: hasta 5 por reunión y 30 en total.",
      "En cada reunión ves si pediste aviso (y a qué correo) y puedes copiar su link.",
      "En la pestaña Plantillas ves tus plantillas (lo que se repite de una reunión: horario, duración del bloque, bloqueos, integrantes clave y tags). Puedes usarlas al crear una reunión, crear nuevas, editarlas, duplicarlas y borrarlas.",
    ],
    nota: "Inicia sesión con tu cuenta de Google desde «Sign in» arriba a la derecha.",
  },
];

export type Pregunta = { pregunta: string; respuesta: string };

/** FAQ: las preguntas frecuentes, agrupadas por pantalla. */
export const GRUPOS_PREGUNTAS: { vista: string; id: string; corto: string; preguntas: Pregunta[] }[] = [
  {
    vista: "Crear una reunión",
    id: "crear",
    corto: "Crear",
    preguntas: [
      {
        pregunta: "¿Necesito una cuenta?",
        respuesta: "No. Para crear una reunión y para responderla basta con abrir el link; al responder solo escribes tu nombre. Una cuenta de Google sirve para tener tu perfil: tus reuniones, tags y plantillas.",
      },
      {
        pregunta: "¿Qué es un integrante clave?",
        respuesta: "Una persona sin la que la reunión no tiene sentido, como la profe o el ayudante. Cada reunión puede tener hasta dos. Quien lo es lo marca al escribir su nombre. En Respuestas se resaltan en violeta los bloques en que pueden todos los integrantes clave.",
      },
      {
        pregunta: "¿Qué puedo bloquear?",
        respuesta: "Horarios en que nadie puede, como el almuerzo. Cada regla tiene una hora de inicio y de término, y sirve para uno o más días. Esos bloques salen con rayas y no se pueden marcar.",
      },
      {
        pregunta: "¿Qué duración tienen los bloques?",
        respuesta: "10, 15, 20, 30 o 60 minutos, a elección de quien crea la reunión. Lo ve cualquiera en el botón de información (la i) junto al título, con los días, el horario y la zona horaria.",
      },
      {
        pregunta: "¿Qué son las plantillas?",
        respuesta: "Configuraciones listas para partir, como una ayudantía o una reunión de equipo: guardan el horario, la duración del bloque, los horarios bloqueados, los integrantes clave y, con cuenta, los tags (los días no). Las eliges y después puedes cambiar lo que quieras. Con una cuenta, también puedes crear las tuyas en tu perfil.",
      },
    ],
  },
  {
    vista: "Responder una reunión",
    id: "responder",
    corto: "Responder",
    preguntas: [
      {
        pregunta: "¿Cómo marco cuándo puedo?",
        respuesta: "En Mi horario, toca un bloque o arrastra para pintar varios. Toca de nuevo para quitarlo. Cuando termines, guarda.",
      },
      {
        pregunta: "¿Cómo edito lo que ya respondí?",
        respuesta: "Abre el link otra vez y escribe el mismo nombre que usaste: se cargan tus horarios para que los cambies y vuelvas a guardar.",
      },
      {
        pregunta: "¿Qué son los bloques con rayas?",
        respuesta: "Son horarios que bloqueó quien creó la reunión. No se pueden marcar.",
      },
      {
        pregunta: "¿Y si la reunión tiene más de 7 días?",
        respuesta: "Se muestra una semana, de lunes a domingo, con flechas para pasar a la anterior o a la siguiente. Los días que no son de la reunión quedan vacíos.",
      },
      {
        pregunta: "¿Por qué a veces veo 5 días y a veces 7?",
        respuesta: "En una pantalla angosta se ven 5 días, y el resto con un desplazamiento hacia el lado. Si la pantalla es lo bastante ancha, se ven los 7.",
      },
    ],
  },
  {
    vista: "Respuestas",
    id: "respuestas",
    corto: "Respuestas",
    preguntas: [
      {
        pregunta: "¿Cómo leo los colores?",
        respuesta: "El gris muestra cuánta gente puede (sin contar a los integrantes clave): más oscuro, más gente. El violeta aparece donde pueden todos los integrantes clave y, dentro de él, más oscuro también significa más gente. La leyenda de abajo lo resume.",
      },
      {
        pregunta: "¿Cómo veo quién puede en un horario?",
        respuesta: "Pasa el mouse por un bloque de Respuestas, o tócalo en el celular: aparece quién puede y quién no. Si la lista es larga, se corta con \"…\" en el computador.",
      },
      {
        pregunta: "¿Por qué Respuestas se ve más chica que Mi horario en el computador?",
        respuesta: "Porque Respuestas se mira y Mi horario se rellena. Así ves las dos a la vez; Respuestas se desplaza hacia abajo si no caben todas las horas.",
      },
    ],
  },
  {
    vista: "Compartir y avisos",
    id: "compartir",
    corto: "Compartir",
    preguntas: [
      {
        pregunta: "¿Cómo comparto el estado con el grupo?",
        respuesta: "En Compartir puedes copiar el link para invitar y copiar un resumen con cuántas personas respondieron, los mejores horarios y qué falta, listo para pegar en el chat.",
      },
      {
        pregunta: "¿Cómo funciona \"Notificarme\"?",
        respuesta: "Eliges cuándo quieres el aviso (cuando respondan cierta cantidad de personas, en una fecha, o en una fecha y hora) y escribes tu correo. Te escribimos una sola vez, con cómo va la reunión. Las fechas y horas son de la zona de la reunión; si eliges solo una fecha, el correo llega ese día a las 9:00. Si la reunión se cierra antes, el aviso se cancela.",
      },
      {
        pregunta: "¿Puedo cambiar un aviso?",
        respuesta: "No se edita: se quita y se pide uno nuevo. Lo puedes hacer desde Compartir o desde tu perfil.",
      },
    ],
  },
  {
    vista: "Tu perfil",
    id: "perfil",
    corto: "Perfil",
    preguntas: [
      {
        pregunta: "¿Cómo llego a mi perfil?",
        respuesta: "Con una cuenta. Escribir tu nombre al responder una reunión no abre tu perfil. Inicia sesión con tu cuenta de Google desde «Sign in».",
      },
      {
        pregunta: "¿Qué veo en mi perfil?",
        respuesta: "Las reuniones que creaste y las que respondiste, con cuándo las creaste o respondiste, sus tags, cuántas respuestas tienen, si pediste aviso y un botón para copiar el link.",
      },
      {
        pregunta: "¿Cómo busco por tags?",
        respuesta: "Con los filtros: en el computador están en la barra lateral y en el celular, en el botón \"Filtros\". Puedes elegir varios tags a la vez (se muestran las reuniones que tienen todos), el tipo de reunión y el orden por fecha o por nombre.",
      },
      {
        pregunta: "¿Cómo creo, edito o borro una plantilla?",
        respuesta: "En la pestaña Plantillas de tu perfil. \"Nueva plantilla\" abre el mismo formulario de crear una reunión, sin los días, con el resumen al lado (en el celular, con \"Ver resumen\"). Cada plantilla tiene los botones Usar, Editar, Duplicar y Borrar; al borrar se pide confirmar.",
      },
      {
        pregunta: "¿Cuántos tags puedo poner?",
        respuesta: "Hasta 5 por reunión y 30 tags distintos en total, de hasta 24 letras cada uno. Con \"Editar tags\" los agregas o los quitas desde tu lista de reuniones, o al crear la reunión.",
      },
    ],
  },
];
