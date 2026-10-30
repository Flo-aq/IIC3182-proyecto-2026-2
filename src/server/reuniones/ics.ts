import "server-only";

const escapar = (s: string): string => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fecha = (d: Date): string => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Las líneas de un .ics no pueden pasar de 75 bytes: se parten y la continuación empieza con un espacio. */
function plegar(linea: string): string {
  const bytes = Buffer.from(linea);
  if (bytes.length <= 75) return linea;
  const partes: string[] = [];
  let actual = "";
  for (const c of linea) {
    if (Buffer.byteLength(actual + c) > (partes.length ? 74 : 75)) {
      partes.push(actual);
      actual = "";
    }
    actual += c;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

/** El archivo de calendario (.ics) de la reunión confirmada; la hora va en UTC y cada calendario la muestra en la zona de quien la abre. */
export function crearIcs(r: { slug: string; titulo: string; inicio: Date; minutos: number; enlace: string }): string {
  const fin = new Date(r.inicio.getTime() + r.minutos * 60_000);
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WeMeet//Reuniones//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${r.slug}@wemeet`,
    `DTSTAMP:${fecha(new Date())}`,
    `DTSTART:${fecha(r.inicio)}`,
    `DTEND:${fecha(fin)}`,
    `SUMMARY:${escapar(r.titulo)}`,
    `DESCRIPTION:${escapar(`Reunión coordinada con WeMeet.\n${r.enlace}`)}`,
    `URL:${r.enlace}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.map(plegar).join("\r\n") + "\r\n";
}
