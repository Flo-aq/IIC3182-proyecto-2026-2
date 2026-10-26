# Juntémonos: arquitectura (monolito)

Versión mejorada de When2Meet, mobile-first. Estilo visual elegido: **Cake** (ver artifact de estilos).

## Stack
| Pieza | Elección |
|---|---|
| App | Next.js (App Router, TypeScript): páginas y API en un solo proyecto |
| Deploy | Vercel (plan gratis), un deploy por push al repo |
| Base de datos | Postgres en Supabase (plan gratis) |
| Acceso a datos | Desde el servidor (route handlers / server actions) con la librería `postgres` o Drizzle; el navegador nunca habla directo con la DB |
| Login opcional | Supabase Auth con "Continuar con Google"; sin cuenta se participa con solo un nombre |
| Estilos | CSS Modules o Tailwind con los tokens de Cake |

Reglas del enunciado que condicionan esto: URL pública que abre sin instalar ni pedir cuenta, repo visible para la profesora y la ayudante, y el link debe seguir vivo hasta fines de noviembre.

## Modelo de datos
El SQL completo está en [db/schema.sql](db/schema.sql). Resumen:
- `events`: slug, título, **zona horaria**, días candidatos, **hora de inicio y de término**, **tamaño de bloque (10, 15, 20, 30 o 60 min)**, **máximo de integrantes clave (0 a 2)**, deadline, estado (`open` | `closed`) y horario elegido al cerrar. `owner_id` es null si lo creó alguien sin login.
- `blocked_ranges`: horarios que nadie puede marcar (por ejemplo, almuerzo de 13:00 a 14:00). Valen para un día o para todos.
- `participants`: nombre, `is_key` (integrante clave), `user_id` opcional y un `token` en cookie para volver a editar sin login. Un trigger impide pasarse del máximo de integrantes clave.
- `availability`: una fila por bloque, guardado como instante exacto (`timestamptz`), así cada quien lo ve en su zona horaria.
- `tags`, `event_tags` y `templates` (plantillas guardadas): solo con login.
- Todas las tablas con RLS activado y sin políticas: solo el servidor (clave service role) lee y escribe.

**Quién queda como integrante clave:** cada persona se declara ("Soy integrante clave") mientras queden cupos, y el creador puede quitar la marca. El nombre "integrante clave" es provisorio.

**Integrante clave** reemplaza a los roles ayudante y profe: es alguien cuyo horario delimita la reunión (hasta 2). Los horarios sugeridos son los bloques en que todos los integrantes clave pueden, ordenados por cuánta gente más puede.

## Páginas (como When2Meet, más el perfil)
1. **`/`, crear reunión** (título, zona horaria, días, hora de inicio y de término, tamaño de bloque, horarios bloqueados y cuántos integrantes clave). Funciona sin login; con login se puede guardar como plantilla.
2. **`/e/[slug]`, la página de la reunión.** Todo pasa aquí, sin cambiar de pantalla: elegir rol, marcar bloques, guardar (con confirmación), ver al grupo, copiar el resumen y cerrar la reunión (con confirmación en el mismo lugar). Se ve igual con o sin login; con login se agregan los tags.
3. **`/perfil`, la vista de perfil.**
   - Con login: tus reuniones (abiertas y cerradas) y tus tags.
   - Sin login: invitación a entrar ("Continuar con Google") explicando qué se gana.

El login no bloquea nada: quien no lo hace puede crear y responder igual.

## Login
**Continuar con Google**, usando Supabase Auth. Sin contraseñas ni correos de verificación: un botón, Supabase guarda la sesión. Configuración única: crear un cliente OAuth en Google Cloud y pegar su id y secreto en Supabase.

Se descartó el link al correo: el correo incluido en el plan gratis de Supabase solo envía unos pocos mensajes por hora, y a otros usuarios no les llegaría de forma confiable, lo que rompería la evaluación del otro grupo.

## Endpoints (no son páginas, solo los usa la app)
- `POST /api/events` crear reunión
- `POST /api/events/[slug]/availability` guardar disponibilidad
- `POST /api/events/[slug]/close` cerrar reunión
- `GET /api/events/[slug]/ics` descarga del `.ics`

## Las 3 tareas de la Entrega 2
1. Crear una reunión con horario, bloques e integrantes clave.
2. Responder la disponibilidad y verla guardada.
3. Cerrar la reunión y copiar el resumen.

## Fuera de la primera entrega
Notificaciones por email cuando respondan N personas, invitación enviada por correo, tags y perfil completos.
