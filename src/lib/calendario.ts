// Del horario de una reunión (día y fila en la zona de la reunión) al instante exacto, y de ahí a los enlaces de calendario.
// Lo usan el servidor (para guardar y para el .ics) y el navegador (para los enlaces de Google y Outlook).

import { TZDate } from "@date-fns/tz";

import { type Reunion, aMinutos } from "./reunion";

type ConfigHora = Pick<Reunion, "zona" | "desde" | "bloqueMin">;

/** El instante en que empieza el bloque `fila` del día `dia`, contado en la zona de la reunión. */
export function instanteDe(r: ConfigHora, dia: string, fila: number): Date {
  const [a, m, d] = dia.split("-").map(Number);
  const minutos = aMinutos(r.desde) + fila * r.bloqueMin;
  return new Date(new TZDate(a, m - 1, d, Math.floor(minutos / 60), minutos % 60, 0, r.zona).getTime());
}

/** El instante de inicio de un bloque ("AAAA-MM-DD|fila"). */
export function instanteDeBloque(r: ConfigHora, bloque: string): Date {
  const [dia, fila] = bloque.split("|");
  return instanteDe(r, dia, Number(fila));
}

/** 2026-11-03T12:00:00.000Z → 20261103T120000Z, el formato de fecha que piden los calendarios. */
const compacta = (d: Date): string => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/**
 * Enlaces que abren el calendario del usuario con el evento ya escrito (solo falta que toque "Guardar"):
 * los mismos que traen los correos con "Agregar a Google Calendar" o a Outlook. Las horas van en UTC y cada calendario las muestra
 * en la zona de quien las abre.
 */
export function enlacesDeCalendario(r: ConfigHora & Pick<Reunion, "titulo">, bloque: string, enlace: string): { google: string; outlook: string } {
  const inicio = instanteDeBloque(r, bloque);
  const fin = new Date(inicio.getTime() + r.bloqueMin * 60_000);
  const descripcion = `Reunión coordinada con WeMeet.\n${enlace}`;
  const google = new URLSearchParams({ action: "TEMPLATE", text: r.titulo, dates: `${compacta(inicio)}/${compacta(fin)}`, details: descripcion });
  const outlook = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: r.titulo,
    startdt: inicio.toISOString(),
    enddt: fin.toISOString(),
    body: descripcion,
  });
  return {
    google: `https://calendar.google.com/calendar/render?${google}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?${outlook}`,
  };
}
