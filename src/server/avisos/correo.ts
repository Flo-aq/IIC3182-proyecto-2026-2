import "server-only";

type Correo = { a: string; asunto: string; texto: string; html: string };

/**
 * Envía un correo con Resend (`RESEND_API_KEY`). `EMAIL_FROM` es el remitente ("WeMeet <avisos@tudominio.cl>"): Resend solo deja
 * enviar a cualquier destinatario desde un dominio verificado; sin dominio, solo se puede enviar al correo de la cuenta de Resend,
 * desde `onboarding@resend.dev`.
 *
 * Sin `RESEND_API_KEY`, en desarrollo el correo se muestra en la consola (simulado) y en producción falla, para que el aviso
 * se reintente en vez de darse por enviado.
 */
export async function enviarCorreo(c: Correo): Promise<"enviado" | "simulado"> {
  const llave = process.env.RESEND_API_KEY;
  if (!llave) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[correo simulado] a ${c.a} · ${c.asunto}\n${c.texto}\n`);
      return "simulado";
    }
    throw new Error("Falta RESEND_API_KEY: no hay con qué enviar correos.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "WeMeet <onboarding@resend.dev>",
      to: [c.a],
      subject: c.asunto,
      text: c.texto,
      html: c.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return "enviado";
}
