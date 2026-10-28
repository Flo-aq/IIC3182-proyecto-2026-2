// Textos de la ayuda: los pasos de "Cómo funciona" (que también van en la ventana de crear reunión), la guía por pantalla de
// How to y las preguntas frecuentes de FAQ, agrupadas por pantalla.

export const PASOS = [
  {
    titulo: "Configura la reunión",
    texto:
      "Elige nombre, días, horario y duración de los bloques. Puedes bloquear horarios y definir integrantes clave.",
  },
  {
    titulo: "Comparte el link",
    texto: "Al crearla te damos un link. Cualquiera lo abre sin cuenta.",
  },
  {
    titulo: "Cada persona marca cuándo puede",
    texto: "Tocan los bloques en que están disponibles y guardan.",
  },
  {
    titulo: "Elige el mejor horario",
    texto:
      "Ves dónde coincide más gente, copias el resumen y cierras la reunión con el horario elegido: cada persona puede agregarlo a su calendario.",
  },
];

/** Un texto y, si lo tiene, su subtexto: lo secundario va en letra más chica bajo el texto, para que ocupe menos. */
export type TextoConApunte = { t: string; a?: string };

/** Las notas de How to › Crear: lo que no es un paso, pero conviene saber. */
export const NOTAS_CREAR: Record<
  "obligatorios" | "desplegables" | "resumen",
  TextoConApunte
> = {
  obligatorios: {
    t: "Para crear la reunión hay que completar todos los campos obligatorios, los que llevan un asterisco rojo (*).",
  },
  desplegables: {
    t: "Cada ajuste es un desplegable: toca su título para abrirlo y vuelve a tocarlo para cerrarlo.",
    a: "Solo uno queda abierto a la vez.",
  },
  resumen: {
    t: "El resumen muestra cómo va quedando la reunión.",
    a: 'Incluye los días, el horario, la duración de los bloques, los horarios bloqueados, los integrantes clave y la zona horaria. En el computador está siempre al costado; en el celular se abre con "Ver resumen".',
  },
};

/** Los subtextos de cada paso de How to › Crear, en el mismo orden que los pasos. */
export const APUNTES_CREAR = [
  "Sin cuenta, tu nombre sirve para cerrar la reunión después, desde cualquier dispositivo. Si los días son más de 7, se ven por semanas.",
  "También puedes elegir todo el día.",
  "Si quieres, parte desde una plantilla.",
  "Al crear, el link se copia solo y, a los 5 segundos, te llevamos a la reunión.",
];

/** Los subtextos de los pasos de How to › Responder, en el mismo orden que los pasos. */
export const APUNTES_RESPONDER = [
  "Si ya habías respondido, escribe el mismo nombre para cargar y editar tus horarios. Para no repetir nombres, mira en la pestaña *Compartir* quiénes ya respondieron.",
  "Esta casilla solo aparece si quien creó la reunión definió integrantes clave (hasta 2). Cuando ya están ocupados, queda desactivada.",
  "Los bloques con rayas están bloqueados y no se pueden marcar. Si la reunión dura más de una semana, cambia de semana con las flechas de arriba.",
  "Puedes volver mientras la reunión siga abierta a cambiarlos.",
];

/** Las notas de How to › Responder que rodean a los pasos. */
export const NOTAS_RESPONDER: Record<
  "google" | "sesion" | "conteo",
  TextoConApunte
> = {
  google: {
    t: "En esta misma pantalla también puedes iniciar sesión con Google, en vez de escribir tu nombre.",
  },
  sesion: {
    t: "Si ya iniciaste sesión, esta pantalla no aparece.",
    a: "Entras directo a marcar tus horarios, con el nombre de tu cuenta.",
  },
  conteo: {
    t: "Sobre el botón de guardar ves cuántos bloques has marcado.",
    a: "Y de cuánto es cada bloque.",
  },
};

/** Las notas de How to › Ver las respuestas: no hay pasos, solo cómo se lee la pantalla. */
export const NOTAS_RESPUESTAS: Record<
  "ubicacion" | "colores" | "quien",
  TextoConApunte
> = {
  ubicacion: {
    t: "El mapa de calor está en la pestaña *Respuestas*.",
    a: "Es como el calendario de *Mi horario*, pero cada bloque se pinta según cuánta gente puede. En el computador, *Mi horario* y *Respuestas* se ven a la vez.",
  },
  colores: {
    t: "El gris muestra cuánta gente puede en cada bloque: más oscuro, más gente. El violeta aparece donde pueden todos los integrantes clave.",
    a: "La leyenda, bajo el mapa, resume los colores: de 0 a todas las personas en gris, y de 0 a todos los integrantes clave en violeta.",
  },
  quien: {
    t: "Pasa el mouse por un bloque, o tócalo en el celular, para ver quién puede y quién no.",
  },
};

/** Las notas de How to › Compartir: no hay pasos, cada parte de la pestaña se explica sola. */
export const NOTAS_COMPARTIR: Record<
  "donde" | "link" | "quien" | "cerrar" | "notificar" | "resumen",
  TextoConApunte
> = {
  donde: {
    t: 'En el celular, *Compartir* es una pestaña; en el computador, es el botón "Compartir" de arriba a la derecha.',
  },
  link: {
    t: '"Copiar link" copia el link de la reunión para invitar a más gente.',
    a: "Cualquiera lo abre sin cuenta.",
  },
  quien: {
    t: "Más abajo ves quién ya respondió.",
    a: 'Los integrantes clave van en amarillo y, si respondiste, tu nombre lleva un borde violeta. Con "Ver más" se ve el resto de la lista.',
  },
  cerrar: {
    t: 'Quien creó la reunión ve además "Cerrar reunión" (mira la guía de *Cerrar la reunión*).',
  },
  notificar: {
    t: 'Con "Notificarme" pides un aviso por correo (mira la guía de *Avisos*).',
  },
  resumen: {
    t: '"Copiar resumen" copia un texto para pegar en el chat del grupo.',
    a: 'Dice quiénes respondieron, los mejores horarios y el link para responder. Con "Ver el texto del resumen" lo lees antes de copiarlo.',
  },
};

/** Los subtextos y notas de How to › Avisos (el popup de Notificarme). */
export const NOTAS_AVISOS: Record<
  "zona" | "unaVez" | "quitar",
  TextoConApunte
> = {
  zona: {
    t: "",
    a: "Las fechas y horas son de la zona de la reunión. Si eliges solo una fecha, el correo llega ese día a las 9:00.",
  },
  unaVez: {
    t: "Te escribimos una sola vez, con cómo va la reunión.",
    a: "Si la reunión se cierra antes, el aviso se cancela.",
  },
  quitar: {
    t: 'Con un aviso pedido, el botón pasa a "Quitar mi aviso".',
    a: "Un aviso no se edita: si quieres cambiarlo, quítalo y pide uno nuevo.",
  },
};

/** Los subtextos de los pasos de How to › Cerrar la reunión, en el mismo orden que los pasos. */
export const APUNTES_CERRAR = [
  "Solo la ve quien creó la reunión: con su cuenta, o entrando con el nombre que puso como organizador al crearla.",
  "Los bloques vienen en grupos, del que más gente reúne al que menos: primero donde pueden todos los integrantes clave y toda la gente, y después donde falta una persona o algún integrante clave. Cada bloque dice quién no puede.",
  undefined,
  "Puedes elegir Google Calendar, Outlook o un archivo .ics.",
];

/** Todo lo que se puede hacer desde la lista de reuniones del perfil (la primera nota de How to › Tu perfil). */
export const ACCIONES_PERFIL = [
  "Abrir una reunión",
  "Filtrar y ordenar",
  "Editar tags",
  "Ver tu aviso",
  "Copiar el link",
  "Cerrar las que creaste",
  "Ver horario de las cerradas",
];

/** Las notas de How to › Tu perfil: no hay pasos, cada parte de la pantalla se explica sola. */
export const NOTAS_PERFIL: Record<
  "lista" | "filtros" | "tags" | "abierta" | "cerrada" | "plantillas",
  TextoConApunte
> = {
  lista: {
    t: "Ves todas tus reuniones: las que creaste y las que respondiste.",
    a: "Desde la lista puedes:",
  },
  filtros: {
    t: 'Con "Filtros" filtras por tipo y por tag, y ordenas por fecha o por nombre.',
  },
  tags: {
    t: 'Con "Editar tags" agregas o quitas tags desde la misma lista.',
    a: "Hasta 5 por reunión y 30 en total.",
  },
  abierta: {
    t: "En cada reunión ves si pediste aviso (y a qué correo) y puedes copiar su link.",
    a: "En las que creaste y siguen abiertas hay además un botón para cerrarlas.",
  },
  cerrada: {
    t: 'Las reuniones cerradas llevan la etiqueta "Cerrada".',
    a: 'El botón pasa a "Ver horario" y muestra cuándo quedó, con los botones para agendarla y copiarla.',
  },
  plantillas: {
    t: "En la pestaña *Plantillas* ves tus plantillas.",
    a: "Son lo que se repite de una reunión: horario, duración del bloque, bloqueos, integrantes clave y tags. Puedes usarlas al crear una reunión, crear nuevas, editarlas, duplicarlas y borrarlas.",
  },
};

/** Cada pantalla tiene un `id` (para enlazar a su sección, como /how-to#perfil) y un nombre `corto` para la pestaña. */
export type Guia = {
  vista: string;
  id: string;
  corto: string;
  resumen: string;
  pasos: string[];
  nota?: string;
};

/** How to: qué se hace en cada pantalla, en el orden en que se usa. */
export const GUIAS: Guia[] = [
  {
    vista: "Crear una reunión",
    id: "crear",
    corto: "Crear",
    resumen: "Para quien organiza. No necesitas cuenta.",
    pasos: [
      "Escribe el nombre de la reunión y tu nombre, y elige los días en el calendario.",
      "Define el horario y cuánto dura cada bloque (10, 15, 20, 30 o 60 minutos).",
      "Bloquea los horarios que no se pueden usar, como el almuerzo, y define hasta dos integrantes clave si la reunión depende de alguien.",
      'Revisa el resumen y toca "Crear reunión".',
    ],
    nota: "Con una cuenta también puedes ponerle tags a la reunión, para encontrarla después en tu perfil.",
  },
  {
    vista: "Responder una reunión",
    id: "responder",
    corto: "Responder",
    resumen:
      "Para quien recibe el link. No necesitas cuenta: basta con tu nombre.",
    pasos: [
      "Abre el link y escribe tu nombre.",
      "Si eres integrante clave, márcalo al escribir tu nombre.",
      "En *Mi horario* toca los bloques en que puedes, o arrastra para pintar varios.",
      'Toca "Guardar mis horarios".',
    ],
  },
  {
    vista: "Ver las respuestas",
    id: "respuestas",
    corto: "Respuestas",
    resumen: "Para decidir cuándo juntarse.",
    // Sin pasos: son notas (ver NOTAS_RESPUESTAS).
    pasos: [],
  },
  {
    vista: "Compartir",
    id: "compartir",
    corto: "Compartir",
    resumen: "Para invitar a más gente y contar cómo va la reunión.",
    // Sin pasos: son notas (ver NOTAS_COMPARTIR).
    pasos: [],
  },
  {
    vista: "Pedir un aviso por correo",
    id: "avisos",
    corto: "Avisos",
    resumen:
      "Para enterarte cuando haya novedades, sin volver a abrir la reunión.",
    pasos: [
      'En *Compartir*, toca "Notificarme".',
      "Elige cuándo quieres el aviso: cuando respondan cierta cantidad de personas, en una fecha, o en una fecha y hora.",
      'Escribe tu correo y toca "Activar aviso".',
    ],
  },
  {
    vista: "Cerrar la reunión",
    id: "cerrar",
    corto: "Cerrar",
    resumen:
      "Para quien creó la reunión: elegir el horario definitivo y dejarlo en el calendario de todos.",
    pasos: [
      'En *Compartir*, toca "Cerrar reunión".',
      "Elige un horario.",
      "Confirma. Cerrar es definitivo: después nadie puede cambiar sus respuestas ni el horario.",
      "Agrega el horario a tu calendario o copia la confirmación para pegarla en el chat del grupo.",
    ],
    nota: 'Una vez cerrada, todos ven arriba "Reunión confirmada" con el horario, y en *Mi horario* los mismos botones para agendarla y copiarla.',
  },
  {
    vista: "Tu perfil",
    id: "perfil",
    corto: "Perfil",
    resumen:
      "Solo con una cuenta, que es distinto de escribir tu nombre al responder.",
    // Sin pasos: son notas (ver NOTAS_PERFIL).
    pasos: [],
    nota: "Inicia sesión con tu cuenta de Google desde «Sign in» arriba a la derecha.",
  },
];

export type Pregunta = { pregunta: string; respuesta: string };

/** FAQ: las preguntas frecuentes, agrupadas por pantalla. */
export const GRUPOS_PREGUNTAS: {
  vista: string;
  id: string;
  corto: string;
  preguntas: Pregunta[];
}[] = [
  {
    vista: "Crear una reunión",
    id: "crear",
    corto: "Crear",
    preguntas: [
      {
        pregunta: "¿Necesito una cuenta?",
        respuesta:
          "No. Para crear una reunión y para responderla basta con abrir el link; al responder solo escribes tu nombre. Una cuenta de Google sirve para tener tu perfil: tus reuniones, tags y plantillas.",
      },
      {
        pregunta: "¿Qué es un integrante clave?",
        respuesta:
          "Una persona sin la que la reunión no tiene sentido, como la profe o el ayudante. Cada reunión puede tener hasta dos. Cualquiera puede marcarse como integrante clave al escribir su nombre, mientras queden lugares: no se verifica, así que conviene avisar quién debe marcarlo. En *Respuestas* se resaltan en violeta los bloques en que pueden todos los integrantes clave.",
      },
      {
        pregunta: "¿Qué puedo bloquear?",
        respuesta:
          "Horarios en que nadie puede, como el almuerzo. Cada regla tiene una hora de inicio y de término, y sirve para uno o más días. Esos bloques salen con rayas y no se pueden marcar.",
      },
      {
        pregunta: "¿Qué duración tienen los bloques?",
        respuesta:
          "10, 15, 20, 30 o 60 minutos, a elección de quien crea la reunión. Lo ve cualquiera en el botón de información (la i) junto al título, con los días, el horario y la zona horaria.",
      },
      {
        pregunta: "¿Qué son las plantillas?",
        respuesta:
          "Configuraciones listas para partir, como una ayudantía o una reunión de equipo: guardan el horario, la duración del bloque, los horarios bloqueados, los integrantes clave y, con cuenta, los tags (los días no). Las eliges y después puedes cambiar lo que quieras. Con una cuenta, también puedes crear las tuyas en tu perfil.",
      },
      {
        pregunta: '¿Qué pasa cuando toco "Crear reunión"?',
        respuesta:
          'El link se copia solo (verás el aviso "Link copiado") y, a los 5 segundos, te llevamos a la página de la reunión. También puedes ir antes con "Ir a la reunión ahora". Si tu navegador no deja copiar solo, te avisamos y queda el botón Copiar.',
      },
      {
        pregunta: "¿Cuánto dura una reunión y cuántas respuestas admite?",
        respuesta:
          "Una reunión se guarda hasta 2 meses después de su última respuesta (o de que se creó, si nadie respondió); después se borra con todas sus respuestas. Admite hasta 120 días y hasta 300 respuestas. Para evitar abusos, desde una misma conexión se pueden crear hasta 30 reuniones por hora: si te pasas verás un aviso y puedes intentar un rato después.",
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
        respuesta:
          "En *Mi horario*, toca un bloque o arrastra para pintar varios. Toca de nuevo para quitarlo. Cuando termines, guarda.",
      },
      {
        pregunta: "¿Cómo edito lo que ya respondí?",
        respuesta:
          "Abre el link otra vez y escribe el mismo nombre que usaste: se cargan tus horarios para que los cambies y vuelvas a guardar. Solo se puede mientras la reunión siga abierta.",
      },
      {
        pregunta: "Si inicié sesión, ¿tengo que escribir mi nombre?",
        respuesta:
          'No. Con una cuenta entras directo a *Mi horario* con el nombre de tu cuenta, y se carga lo que ya habías respondido, si respondiste. Si la reunión tiene integrantes clave y todavía hay lugar, puedes marcar "Soy integrante clave" sobre el botón de guardar.',
      },
      {
        pregunta: "¿Qué son los bloques con rayas?",
        respuesta:
          "Son horarios que bloqueó quien creó la reunión. No se pueden marcar.",
      },
      {
        pregunta: "¿Y si la reunión tiene más de 7 días?",
        respuesta:
          "Se muestra una semana, de lunes a domingo, con flechas para pasar a la anterior o a la siguiente. Los días que no son de la reunión quedan vacíos.",
      },
      {
        pregunta: "¿Por qué a veces veo 5 días y a veces 7?",
        respuesta:
          "En una pantalla angosta se ven 5 días, y el resto con un desplazamiento hacia el lado. Si la pantalla es lo bastante ancha, se ven los 7.",
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
        respuesta:
          "El gris muestra cuánta gente puede (sin contar a los integrantes clave): más oscuro, más gente. El violeta aparece donde pueden todos los integrantes clave y, dentro de él, más oscuro también significa más gente. La leyenda de abajo lo resume.",
      },
      {
        pregunta: "¿Cómo veo quién puede en un horario?",
        respuesta:
          'Pasa el mouse por un bloque de *Respuestas*, o tócalo en el celular: aparece quién puede y quién no. Si la lista es larga, se corta con "…" en el computador.',
      },
      {
        pregunta:
          "¿Por qué *Respuestas* se ve más chica que *Mi horario* en el computador?",
        respuesta:
          "Porque *Respuestas* se mira y *Mi horario* se rellena. Así ves las dos a la vez; *Respuestas* se desplaza hacia abajo si no caben todas las horas.",
      },
    ],
  },
  {
    vista: "Compartir",
    id: "compartir",
    corto: "Compartir",
    preguntas: [
      {
        pregunta: "¿Cómo comparto el estado con el grupo?",
        respuesta:
          'En *Compartir* puedes copiar el link para invitar y copiar un resumen con quiénes respondieron, los mejores horarios (con quién no puede en cada uno) y el link para responder, listo para pegar en el chat. Con "Ver el texto del resumen" lo lees antes de copiarlo.',
      },
      {
        pregunta: "¿Dónde veo quién ya respondió?",
        respuesta:
          'En *Compartir*, en la lista *Respuestas*. Los integrantes clave van en amarillo y, si respondiste, tu nombre lleva un borde violeta. Con "Ver más" se ve el resto de la lista. Sirve también para no repetir nombres al responder.',
      },
    ],
  },
  {
    vista: "Avisos por correo",
    id: "avisos",
    corto: "Avisos",
    preguntas: [
      {
        pregunta: '¿Cómo funciona "Notificarme"?',
        respuesta:
          "Eliges cuándo quieres el aviso (cuando respondan cierta cantidad de personas, en una fecha, o en una fecha y hora) y escribes tu correo. Te escribimos una sola vez, con cómo va la reunión. Las fechas y horas son de la zona de la reunión; si eliges solo una fecha, el correo llega ese día a las 9:00. Si la reunión se cierra antes, el aviso se cancela.",
      },
      {
        pregunta: "¿Puedo cambiar un aviso?",
        respuesta:
          "No se edita: se quita y se pide uno nuevo. Lo puedes hacer desde *Compartir* o desde tu perfil.",
      },
      {
        pregunta: "¿Por qué no me deja pedir un aviso?",
        respuesta:
          "Puede ser que ya pediste uno en esa reunión (con cuenta, hay uno por cuenta; sin cuenta, uno por correo; el nombre no cuenta), que la fecha o la hora ya pasaron, que la cantidad de personas ya se alcanzó, que ese correo tenga ya 5 avisos pendientes, o que la reunión ya esté cerrada: una reunión cerrada no manda avisos.",
      },
    ],
  },
  {
    vista: "Cerrar la reunión",
    id: "cerrar",
    corto: "Cerrar",
    preguntas: [
      {
        pregunta: "¿Quién puede cerrar la reunión?",
        respuesta:
          "Solo quien la creó. Con una cuenta, desde cualquier dispositivo. Sin cuenta, entrando a la reunión con el mismo nombre que escribió como organizador al crearla, igual que se entra a editar una respuesta. Como no hay contraseña, cualquiera que escriba ese nombre también podría cerrarla, y cerrar es definitivo: por eso conviene crearla con una cuenta.",
      },
      {
        pregunta: "¿En qué orden me muestra los horarios para elegir?",
        respuesta:
          'En grupos, del que más gente reúne al que menos: 1) están todos los integrantes clave y toda la gente; 2) están todos los clave y a la gente le falta una persona; 3) está toda la gente pero falta algún clave; 4) falta una persona y falta algún clave. "Toda la gente" no cuenta a los integrantes clave. Si en ningún bloque está toda la gente, los grupos bajan un nivel (falta 1 persona, faltan 2). Cada bloque dice quién no puede.',
      },
      {
        pregunta: "¿Se puede deshacer?",
        respuesta:
          "No. Cerrar es definitivo: después nadie puede cambiar sus respuestas ni el horario. Por eso, antes de cerrar, el popup te pide confirmar el horario que elegiste.",
      },
      {
        pregunta: "¿Cómo agrego la reunión a mi calendario?",
        respuesta:
          'Con el botón "Agregar a mi calendario", que abre un menú. Google Calendar y Outlook abren su calendario con el evento ya escrito (solo falta guardar); "Apple u otro calendario" descarga un archivo .ics que tu calendario abre. La hora se muestra en la zona de quien lo agrega.',
      },
      {
        pregunta: '¿Qué copia "Copiar confirmación"?',
        respuesta:
          'Un texto de tres líneas para pegar en el chat del grupo: el nombre de la reunión, "Confirmada: <día y hora> (hora de <zona>)." y el link de la reunión.',
      },
      {
        pregunta: "¿Qué pasa con los avisos al cerrar?",
        respuesta:
          "Los avisos por correo que seguían pendientes se cancelan, porque una reunión cerrada ya no espera respuestas.",
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
        respuesta:
          "Con una cuenta. Escribir tu nombre al responder una reunión no abre tu perfil. Inicia sesión con tu cuenta de Google desde «Sign in».",
      },
      {
        pregunta: "¿Qué veo en mi perfil?",
        respuesta:
          "Las reuniones que creaste y las que respondiste, con cuándo las creaste o respondiste, sus tags, cuántas respuestas tienen, si pediste aviso, un botón para copiar el link y, en las que creaste y siguen abiertas, un botón para cerrarlas.",
      },
      {
        pregunta: '¿Qué significa la etiqueta "Cerrada"?',
        respuesta:
          'Que la reunión ya tiene horario confirmado y no se puede cambiar. En esas reuniones el botón pasa a "Ver horario": abre un popup con cuándo quedó, "Agregar a mi calendario" y "Copiar confirmación". Las reuniones cerradas ya no tienen aviso.',
      },
      {
        pregunta: '¿Por qué están apagados "Filtros" y "Editar tags"?',
        respuesta:
          "Porque todavía no tienes reuniones: no hay nada que filtrar ni a qué ponerle tags. Se encienden en cuanto crees o respondas una reunión con tu cuenta.",
      },
      {
        pregunta: "¿Cómo busco por tags?",
        respuesta:
          'Con los filtros: en el computador están en la barra lateral y en el celular, en el botón "Filtros". Puedes elegir varios tags a la vez (se muestran las reuniones que tienen todos), el tipo de reunión y el orden por fecha o por nombre.',
      },
      {
        pregunta: "¿Cómo creo, edito o borro una plantilla?",
        respuesta:
          'En la pestaña *Plantillas* de tu perfil. "Nueva plantilla" abre el mismo formulario de crear una reunión, sin los días, con el resumen al lado (en el celular, con "Ver resumen"). Cada plantilla tiene los botones Usar, Editar, Duplicar y Borrar; al borrar se pide confirmar.',
      },
      {
        pregunta: "¿Cuántos tags puedo poner?",
        respuesta:
          'Hasta 5 por reunión y 30 tags distintos en total, de hasta 24 letras cada uno. Con "Editar tags" los agregas o los quitas desde tu lista de reuniones, o al crear la reunión.',
      },
    ],
  },
];
