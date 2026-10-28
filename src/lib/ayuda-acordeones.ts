// Cómo se arman las guías de How to que usan filas con las fotos escondidas (Crear y Responder): qué fotos lleva cada
// paso y qué notas hay entre los pasos. Los textos viven en ayuda.ts; las fotos, en ayuda-fotos-*.ts.

import {
  ACCIONES_PERFIL,
  APUNTES_CERRAR,
  APUNTES_CREAR,
  APUNTES_RESPONDER,
  type TextoConApunte,
  NOTAS_AVISOS,
  NOTAS_COMPARTIR,
  NOTAS_CREAR,
  NOTAS_PERFIL,
  NOTAS_RESPONDER,
  NOTAS_RESPUESTAS,
} from "@/lib/ayuda";

export type FotoItem = {
  foto: string;
  alt: string;
  leyenda?: string;
  etiqueta?: string;
  grande?: boolean;
};

/**
 * Una fila de la guía. `paso` lleva número; `nota` es lo que no es un paso. `apunte` es un subtexto, siempre visible bajo el
 * texto. Con `fotos`, la fila se abre con "Ver foto"; sin ellas, es una fila fija.
 */
export type Item = {
  tipo: "paso" | "nota" | "grupo";
  n?: number;
  texto: string;
  apunte?: string;
  /** Una lista con viñetas bajo el texto (por ejemplo, todo lo que se puede hacer desde una pantalla). */
  lista?: string[];
  fotos?: FotoItem[];
};

const paso = (
  n: number,
  texto: string,
  apunte?: string,
  fotos?: FotoItem[],
): Item => ({ tipo: "paso", n, texto, apunte, fotos });
const grupo = (texto: string): Item => ({ tipo: "grupo", texto });
/** Una nota: su texto (con subtexto, si lo tiene) y, si quiere, sus fotos. */
const nota = (x: string | TextoConApunte, fotos?: FotoItem[]): Item => ({
  tipo: "nota",
  texto: typeof x === "string" ? x : x.t,
  apunte: typeof x === "string" ? undefined : x.a,
  fotos,
});

export function itemsCrear(pasos: string[]): Item[] {
  return [
    nota(NOTAS_CREAR.obligatorios),
    nota(NOTAS_CREAR.desplegables, [
      {
        foto: "crear-desplegable-cerrado",
        alt: "La fila Días, cerrada",
        leyenda: "Cerrado: toca el título para abrirlo.",
      },
      {
        foto: "crear-desplegable-abierto",
        alt: "La fila Días, abierta, con el calendario",
        leyenda: "Abierto: toca el título otra vez para cerrarlo.",
      },
    ]),
    paso(1, pasos[0], APUNTES_CREAR[0], [
      {
        foto: "crear-nombre",
        alt: "El campo Nombre de la reunión, en el celular",
      },
    ]),
    paso(2, pasos[1], APUNTES_CREAR[1], [
      {
        foto: "crear-horario",
        alt: "La fila Horario, abierta",
        leyenda: "Horario",
      },
      {
        foto: "crear-bloque",
        alt: "La fila de la duración de cada bloque, abierta",
        leyenda: "Duración de cada bloque",
      },
    ]),
    paso(3, pasos[2], APUNTES_CREAR[2], [
      {
        foto: "crear-bloqueos",
        alt: "La fila Bloquear horarios, con una regla",
        leyenda: "Bloquear horarios",
      },
      {
        foto: "crear-claves",
        alt: "La fila Integrantes clave, con dos integrantes",
        leyenda: "Integrantes clave (hasta 2)",
      },
      {
        foto: "crear-plantilla",
        alt: "El interruptor Usar plantilla activado, con las plantillas",
        leyenda: "Usar plantilla (opcional)",
      },
    ]),
    // Solo este paso distingue celular y computador.
    paso(4, pasos[3], APUNTES_CREAR[3], [
      {
        foto: "crear-boton-celular",
        alt: "Los botones Ver resumen y Crear reunión, en el celular",
        leyenda: "Ver resumen y Crear reunión.",
        etiqueta: "Celular",
      },
      {
        foto: "crear-boton-computador",
        alt: "El botón Crear reunión, en el computador",
        leyenda: "Crear reunión (el resumen ya está al costado).",
        etiqueta: "Computador",
        grande: true,
      },
    ]),
    nota(NOTAS_CREAR.resumen),
  ];
}

/** Los pasos 3 y 4 no tienen fotos limpias todavía: se ven como filas fijas y su foto marcada va debajo, en la página. */
export function itemsResponder(pasos: string[]): Item[] {
  return [
    grupo("Escribir tu nombre"),
    paso(1, pasos[0], APUNTES_RESPONDER[0], [
      {
        foto: "acceso-nombre",
        alt: "El título Tu nombre y la caja para escribirlo, en el celular",
      },
    ]),
    paso(2, pasos[1], APUNTES_RESPONDER[1], [
      {
        foto: "acceso-clave",
        alt: "La casilla Soy integrante clave, en el celular",
      },
    ]),
    nota(NOTAS_RESPONDER.google, [
      {
        foto: "acceso-google",
        alt: "El botón Iniciar sesión con Google, en el celular",
      },
    ]),
    nota(NOTAS_RESPONDER.sesion),
    grupo("Marcar tus horarios"),
    paso(3, pasos[2], APUNTES_RESPONDER[2], [
      {
        foto: "responder-horario",
        alt: "Mi horario con bloques pintados en violeta, el almuerzo bloqueado con rayas, las horas, los días y las flechas para cambiar de semana, en el celular",
      },
    ]),
    nota(NOTAS_RESPONDER.conteo, [
      {
        foto: "responder-conteo",
        alt: "El texto con cuántos bloques marcaste y de cuántos minutos son, encima del botón Guardar mis horarios, en el celular",
      },
    ]),
    paso(4, pasos[3], APUNTES_RESPONDER[3], [
      {
        foto: "responder-guardar",
        alt: "El botón Guardar mis horarios, en el celular",
      },
    ]),
  ];
}

/** Ver las respuestas no tiene pasos: son notas sobre dónde está el mapa de calor y cómo se lee. */
export function itemsRespuestas(): Item[] {
  return [
    nota(NOTAS_RESPUESTAS.ubicacion, [
      {
        foto: "respuestas-ubicacion",
        alt: "La pestaña Respuestas elegida y, debajo, el mapa de calor, en el celular",
      },
    ]),
    nota(NOTAS_RESPUESTAS.colores, [
      {
        foto: "respuestas-mapa",
        alt: "El mapa de calor de Respuestas, con bloques grises y violetas, en el celular",
      },
      {
        foto: "respuestas-leyenda",
        alt: "La leyenda de colores de Respuestas, en el celular",
      },
    ]),
    nota(NOTAS_RESPUESTAS.quien, [
      {
        foto: "respuestas-quien",
        alt: "Un bloque elegido y el cuadro con quiénes pueden y quiénes no, en el celular",
      },
    ]),
  ];
}

/** Compartir no tiene pasos: cada parte de la pestaña es una nota con su foto. */
export function itemsCompartir(): Item[] {
  return [
    nota(NOTAS_COMPARTIR.donde),
    nota(NOTAS_COMPARTIR.link),
    nota(NOTAS_COMPARTIR.quien, [
      {
        foto: "compartir-quien",
        alt: "La lista de quiénes respondieron, con los integrantes clave en amarillo, en el celular",
      },
    ]),
    nota(NOTAS_COMPARTIR.cerrar),
    nota(NOTAS_COMPARTIR.notificar),
    nota(NOTAS_COMPARTIR.resumen, [
      {
        foto: "compartir-resumen",
        alt: "El botón Copiar resumen y, debajo, el texto del resumen que se copia, en el celular",
      },
    ]),
  ];
}

/** Avisos: tres pasos en el popup de Notificarme, y notas sobre cuántas veces se escribe y cómo quitarlo. */
export function itemsAvisos(pasos: string[]): Item[] {
  return [
    paso(1, pasos[0]),
    paso(2, pasos[1], NOTAS_AVISOS.zona.a, [
      {
        foto: "avisos-personas",
        alt: "El popup Notificarme con la opción de avisar cuando respondan cierta cantidad de personas",
        leyenda: "Cuando respondan cierta cantidad de personas",
      },
      {
        foto: "avisos-fecha",
        alt: "El popup Notificarme con la opción de avisar en una fecha",
        leyenda: "En una fecha",
      },
      {
        foto: "avisos-fecha-hora",
        alt: "El popup Notificarme con la opción de avisar en una fecha y hora",
        leyenda: "En una fecha y hora",
      },
    ]),
    paso(3, pasos[2], undefined, [
      {
        foto: "avisos-correo",
        alt: "El campo Tu correo y el botón Activar aviso",
      },
    ]),
    nota(NOTAS_AVISOS.unaVez),
    nota(NOTAS_AVISOS.quitar, [
      {
        foto: "avisos-quitar",
        alt: "El botón Quitar mi aviso y el texto que dice cuándo y a qué correo te avisaremos, en el celular",
      },
    ]),
  ];
}

/** Cerrar la reunión: cuatro pasos, cada uno con la foto del popup en que ocurre. */
export function itemsCerrar(pasos: string[]): Item[] {
  return [
    paso(1, pasos[0], APUNTES_CERRAR[0]),
    paso(2, pasos[1], APUNTES_CERRAR[1], [
      {
        foto: "cerrar-elegir",
        alt: "El popup para elegir el horario, con los bloques en grupos, en el celular",
      },
    ]),
    paso(3, pasos[2], APUNTES_CERRAR[2], [
      {
        foto: "cerrar-confirmar",
        alt: "El popup que pide confirmar el horario antes de cerrar, en el celular",
      },
    ]),
    paso(4, pasos[3], APUNTES_CERRAR[3], [
      {
        foto: "cerrar-calendario",
        alt: "El menú de Agregar a mi calendario, con Google Calendar, Outlook y el archivo .ics, en el celular",
        leyenda: "El menú de Agregar a mi calendario",
      },
    ]),
  ];
}

/** Tu perfil no tiene pasos: cada parte de la pantalla es una nota. */
export function itemsPerfil(): Item[] {
  return [
    {
      ...nota(NOTAS_PERFIL.lista, [
        {
          foto: "perfil-lista",
          alt: "La parte de arriba del perfil: el botón Filtros, Editar tags y las dos primeras reuniones, en el celular",
        },
      ]),
      lista: ACCIONES_PERFIL,
    },
    nota(NOTAS_PERFIL.filtros, [
      {
        foto: "perfil-filtros",
        alt: "La hoja de Filtros: mostrar todas, creadas o respondidas, ordenar por fecha o nombre y filtrar por tag, en el celular",
        etiqueta: "Celular",
      },
      {
        foto: "perfil-filtros-escritorio",
        alt: "La barra de Filtros al costado de la lista de reuniones, en el computador",
        etiqueta: "Computador",
      },
    ]),
    nota(NOTAS_PERFIL.tags, [
      {
        foto: "perfil-tags",
        alt: "La lista de reuniones con Editar tags activado: cada tag con una x para quitarlo y un botón para agregar otro, en el celular",
      },
    ]),
    nota(NOTAS_PERFIL.abierta, [
      {
        foto: "perfil-abierta",
        alt: "Una reunión abierta de la lista, con los botones para cerrarla, ver el aviso y copiar el link, en el celular",
      },
    ]),
    nota(NOTAS_PERFIL.cerrada, [
      {
        foto: "perfil-cerrada",
        alt: "Una reunión cerrada de la lista, con la etiqueta Cerrada, en el celular",
      },
    ]),
    nota(NOTAS_PERFIL.plantillas, [
      {
        foto: "perfil-plantillas",
        alt: "La pestaña Plantillas con dos plantillas, en el celular",
      },
    ]),
  ];
}
