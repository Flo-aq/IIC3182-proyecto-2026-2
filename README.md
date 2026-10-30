# WeMeet

Coordinar el horario de una reunión de trabajo grupal, pensado para el celular. Es una versión mejorada de When2meet: quien organiza crea la reunión y comparte un link, cada persona marca cuándo puede, y al final se ve dónde coincide más gente y se cierra la reunión con el horario elegido.

Proyecto del curso IIC3182 Interfaces Humano-Computador (2026-2), Entrega 2, grupo 4.

**Interfaz publicada:** https://we-meet-project.vercel.app (abre en cualquier navegador, sin instalar nada y sin crear cuenta).

## Qué se puede hacer

- **Crear una reunión** con días, horario, duración de los bloques (10, 15, 20, 30 o 60 minutos), horarios bloqueados e integrantes clave. Sin cuenta se escribe el nombre de quien organiza; con cuenta se pueden usar plantillas y tags.
- **Responder** abriendo el link, escribiendo un nombre y marcando los bloques en que se puede. Escribir el mismo nombre otra vez permite editar la respuesta.
- **Ver las respuestas** en un mapa de calor, ver quién puede en cada bloque y copiar un resumen para pegar en el chat del grupo.
- **Cerrar la reunión** con el horario elegido, agregarla al calendario (Google, Outlook o archivo `.ics`) y copiar la confirmación.
- **Pedir un aviso por correo** (cuando respondan N personas, o en una fecha o fecha y hora).
- **Con cuenta de Google (opcional):** perfil con todas las reuniones creadas y respondidas, filtros, tags y plantillas.
- **Ayuda:** `/how-to` (cómo se usa cada pantalla) y `/faq` (preguntas frecuentes).

## Probarlo sin instalar nada

1. Entra a https://we-meet-project.vercel.app y toca **Crear reunión** (escribe el nombre de la reunión, tu nombre y elige los días).
2. El link de la reunión se copia solo. Ábrelo en otra ventana o en otro dispositivo, escribe un nombre y marca tus horarios.
3. En **Respuestas** se ve dónde coincide más gente. En **Compartir** se copia el resumen y, si organizas, se cierra la reunión.

## Correrlo en tu computador

Requisitos: Node.js 20 o superior y un proyecto de [Supabase](https://supabase.com) (el plan gratis alcanza).

```bash
npm install
cp .env.example .env.local   # y completar los valores (ver abajo)
npm run dev                  # http://localhost:3000
```

**Base de datos.** En el SQL Editor de Supabase, pegar y ejecutar en este orden los archivos de `supabase/migrations/`:

1. `20261026120000_init.sql` (tablas, reglas y vistas)
2. `20261028120000_funciones.sql` (funciones para crear reuniones y guardar respuestas)
3. `20261029120000_limites.sql` (límite de peticiones y tope de respuestas)
4. `20261030120000_organizador.sql` (nombre de quien organiza sin cuenta)

**Variables de entorno** (`.env.example` explica cada una; las llaves nunca van en el repositorio):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dirección del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Llave pública de Supabase (puede ir en el navegador) |
| `SUPABASE_SECRET_KEY` | Llave secreta de Supabase: solo la usa el servidor |
| `CRON_SECRET` | Protege las tareas programadas y sirve de sal para el límite de peticiones |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envío de avisos por correo con [Resend](https://resend.com). Sin la llave, en desarrollo los correos se muestran en la consola |

El inicio de sesión con Google necesita además activar el proveedor Google en Supabase Auth. Sin eso, todo lo demás funciona y solo falla el botón *Sign in*.

Otros comandos: `npm run build` (compilar), `npm run start` (servir lo compilado) y `npm run lint`.

## Cómo está organizado

| Carpeta | Qué hay |
|---|---|
| `src/app` | Páginas (`/`, `/e/[slug]`, `/perfil`, `/how-to`, `/faq`, páginas legales) y rutas de la API (`/api/...`) |
| `src/components` | Interfaz, agrupada por pantalla: `crear-reunion`, `responder`, `perfil`, más la base de shadcn/ui en `ui` |
| `src/lib` | Lógica que no depende del navegador (bloques y horas, colores del mapa de calor, textos de la ayuda, clientes de la API) |
| `src/server` | Lo que solo corre en el servidor: base de datos, reuniones, avisos, correo y límite de peticiones |
| `supabase/migrations` | El esquema de la base de datos |
| `public/ayuda` | Fotos que usa el How to |
| `.github/workflows` | Tarea programada que envía los avisos cada 10 minutos |

Stack: Next.js (App Router) con TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (Postgres y Auth), Resend y Vercel. El detalle de la base de datos, los endpoints y las reglas está en [`ARQUITECTURA.md`](ARQUITECTURA.md).

## Despliegue

La rama `main` se despliega en Vercel (la configuración está en `vercel.json`; las demás ramas no se despliegan). Vercel gratis solo permite una tarea programada al día, así que los avisos por correo los dispara un workflow de GitHub Actions cada 10 minutos, que llama a `/api/cron/avisos` con los secretos `APP_URL` y `CRON_SECRET` del repositorio.

## Uso de IA

Siguiendo la política del curso, el código de este prototipo se escribió con ayuda de una herramienta de IA (Claude Code). El anexo de uso de IA del informe declara el detalle.
