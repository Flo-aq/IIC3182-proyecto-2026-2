# WeMeet: arquitectura (monolito)

Versión mejorada de When2Meet, mobile-first. Estilo visual **Cake** (blanco, violeta `#4823ff`, amarillo `#e7ff6e`, gris cálido).
Los flujos de usuario con sus diagramas están en `flujos-de-usuario.md`; las decisiones de diseño, en `registro-de-decisiones.md`.

## Estado de la implementación

Todo lo de la entrega está hecho, conectado a Supabase y desplegado en Vercel (https://we-meet-project.vercel.app).

| Parte | Estado |
|---|---|
| Interfaz (crear reunión, responder, perfil, plantillas, ayuda) | Hecha y conectada a la base de datos real |
| Cuenta | Hecha: "Continuar con Google" con Supabase Auth; perfil, tags y plantillas con datos reales |
| Base de datos y endpoints | Hechos (ver "Modelo de datos" y "Endpoints") |
| Cerrar la reunión y el `.ics` | Hechos (D-36 y D-45 en el registro de decisiones) |
| Avisos por correo | Hechos (pedir, quitar, enviar por Resend, cron cada 10 min); falta verificar un dominio en Resend para enviar a cualquier correo |
| Límite de peticiones | Hecho (D-43) |
| Ayuda (How to y FAQ) | Hecha, con fotos de la interfaz real (D-44) |

**Pasos manuales de despliegue:** correr en el SQL Editor de Supabase las migraciones de `supabase/migrations/` en orden (`20261026120000_init`, `20261028120000_funciones`, `20261029120000_limites`, `20261030120000_organizador`); variables de entorno en Vercel (llaves de Supabase, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`) y secretos de GitHub (`APP_URL`, `CRON_SECRET`).

## Stack
| Pieza | Elección |
|---|---|
| App | Next.js (App Router, TypeScript): páginas y API en un solo proyecto |
| UI | Tailwind v4, shadcn/ui (base-nova), Lucide, react-day-picker, selector de hora de ReUI, sonner |
| Deploy | Vercel (plan gratis); `main` se despliega, `dev` no (`vercel.json`) |
| Base de datos | Postgres en Supabase (plan gratis) |
| Acceso a datos | Solo desde el servidor (route handlers) con `@supabase/supabase-js` y la llave secreta; el navegador nunca habla directo con la base. Lo que debe guardarse junto va en funciones SQL |
| Cuenta | Supabase Auth con "Continuar con Google". Sin cuenta se participa con solo un nombre |
| Correo | Resend (avisos), enviados desde un cron: un workflow de GitHub Actions cada 10 minutos (Vercel gratis solo permite uno al día) |

Reglas del enunciado que condicionan esto: URL pública que abre sin instalar ni pedir cuenta, repo visible para la profesora y la ayudante, y el link debe seguir vivo hasta fines de noviembre.

## Qué es una cuenta y qué no
- **Sin cuenta**: se puede crear una reunión, responderla y pedir un aviso por correo. Al responder basta un nombre.
- **Escribir el nombre no es una cuenta.** Sirve para responder y para volver a editar la respuesta (escribir el mismo nombre, sin importar mayúsculas, carga esa respuesta). No abre el perfil.
- **Con cuenta** (Google): perfil con todas tus reuniones (creadas y respondidas), tags, plantillas y avisos. Quien crea con cuenta cierra la reunión desde cualquier dispositivo.
- **Quien organiza sin cuenta** escribe "Tu nombre" al crear la reunión y la cierra entrando con ese nombre (como al editar una respuesta); también vale la llave que queda guardada en el navegador donde la creó (D-45).
- Un nombre no protege la respuesta: cualquiera con el link podría reescribir la de otra persona escribiendo su nombre. Es una decisión de diseño (sin contraseñas); el riesgo se acota con límite de peticiones y con que las respuestas de una reunión ya son visibles para todos los que tienen el link.

## Modelo de datos
El SQL completo y probado está en `supabase/migrations/` (ver "Migraciones y funciones SQL" más abajo).

### En resumen
Postgres en Supabase, con **9 tablas de la aplicación, una vista y una tabla técnica** (`rate_limits`). Todo gira en torno a la **reunión** (`events`): de ella cuelgan sus horarios bloqueados, las personas que respondieron (con los bloques en que pueden) y los avisos por correo. Aparte está lo que solo existe con **cuenta** (`auth.users` de Supabase Auth): los tags, las plantillas y los avisos ligados a la cuenta. Quien responde sin cuenta tiene `user_id` nulo.

### Cómo se relacionan
- Una **reunión** tiene muchos **horarios bloqueados** (`blocked_ranges`), muchas **personas** (`participants`) y muchos **avisos** (`notifications`). Si la reunión se borra, todo eso se borra con ella (`on delete cascade`).
- Cada **persona** tiene muchos **bloques** (`availability`, uno por fila): es la tabla más grande. El nombre es único dentro de la reunión.
- Una **cuenta** (`auth.users`) puede haber **creado** reuniones (`events.owner_id`), **respondido** reuniones (`participants.user_id`) y **pedido** avisos (`notifications.user_id`). Esos tres vínculos son opcionales (`on delete set null`): sin cuenta quedan en nulo. La vista `profile_events` junta las creadas y las respondidas para armar el perfil.
- Una cuenta tiene muchos **tags** (`tags`) y muchas **plantillas** (`templates`); si la cuenta se borra, se borran con ella. Un tag se pone a **reuniones** (`event_tags`) y a **plantillas** (`template_tags`): son relaciones de muchos a muchos. Un tag deja de existir cuando ya no está en ninguna reunión ni plantilla.
- `rate_limits` no se relaciona con nada: cuenta las peticiones por IP (código irreversible) y ventana de tiempo.

### Las tablas
| Tabla | Para qué | Datos clave |
|---|---|---|
| `events` | La reunión | `slug` (va en el link), `title` (1 a 80), `owner_id` (null si no hay cuenta), `owner_token` (secreto del creador), `owner_name` (nombre de quien organiza sin cuenta; con él puede cerrar desde cualquier dispositivo), `timezone`, `days date[]` (pueden pasar de 7), `start_time`, `end_time` (`24:00` vale), `slot_minutes` (10, 15, 20, 30 o 60), `max_key` (0 a 2), `status`, `chosen_start`, `created_at` |
| `blocked_ranges` | Horarios que nadie puede marcar | `days date[]`, `start_time`, `end_time`: una regla vale para uno o más días |
| `participants` | Quien respondió | `name` (1 a 40, único por reunión sin distinguir mayúsculas), `is_key`, `user_id` (null sin cuenta), `created_at` ("Respondida el…") |
| `availability` | Los bloques en que alguien puede | una fila por bloque, como instante exacto (`timestamptz`): cada quien lo ve en su zona |
| `tags` | Tags de una cuenta | `user_id`, `name` (1 a 24 letras, único por cuenta sin distinguir mayúsculas) |
| `event_tags` | Tag puesto a una reunión | de la cuenta dueña del tag, a una reunión que creó o respondió |
| `templates` | Plantillas de una cuenta | `name` (1 a 50, único por cuenta), `slot_minutes`, `start_time`, `end_time`, `max_key`, `blocked jsonb` |
| `template_tags` | Tags de una plantilla | |
| `notifications` | Avisos por correo | `email`, `kind` (`count`, `date`, `datetime`), `target_count`, `notify_at`, `status` (`pending`, `sent`, `cancelled`), `cancel_token`, `user_id` (null sin cuenta) |
| `profile_events` (vista) | La lista del perfil | una fila por reunión de la cuenta: `role` (`creada` o `respondida`), `role_date`, `response_count` |
| `rate_limits` | Límite de peticiones | `clave` (ruta + código de la IP), `hits` (cuántas van), `expires_at` (cuándo termina la ventana); migración `20261029120000_limites` |

### Diagrama
```mermaid
erDiagram
  auth_users {
    uuid id PK
  }
  events {
    uuid id PK
    text slug UK
    text title
    uuid owner_id FK
    text owner_token
    text owner_name
    text timezone
    date_array days
    time start_time
    time end_time
    smallint slot_minutes
    smallint max_key
    text status
    timestamptz chosen_start
  }
  blocked_ranges {
    uuid id PK
    uuid event_id FK
    date_array days
    time start_time
    time end_time
  }
  participants {
    uuid id PK
    uuid event_id FK
    uuid user_id FK
    text name
    boolean is_key
  }
  availability {
    uuid participant_id PK
    timestamptz slot_start PK
  }
  notifications {
    uuid id PK
    uuid event_id FK
    uuid user_id FK
    text email
    text kind
    text status
  }
  tags {
    uuid id PK
    uuid user_id FK
    text name
  }
  event_tags {
    uuid event_id PK
    uuid tag_id PK
  }
  templates {
    uuid id PK
    uuid user_id FK
    text name
    smallint slot_minutes
    smallint max_key
    jsonb blocked
  }
  template_tags {
    uuid template_id PK
    uuid tag_id PK
  }
  auth_users ||--o{ events : "crea (owner_id)"
  auth_users ||--o{ participants : "responde (user_id)"
  auth_users ||--o{ notifications : "pide (user_id)"
  auth_users ||--o{ tags : "tiene"
  auth_users ||--o{ templates : "guarda"
  events ||--o{ blocked_ranges : "bloquea"
  events ||--o{ participants : "reciben"
  events ||--o{ notifications : "avisan"
  events ||--o{ event_tags : "llevan"
  participants ||--o{ availability : "marca"
  tags ||--o{ event_tags : "se pone en"
  tags ||--o{ template_tags : "se pone en"
  templates ||--o{ template_tags : "llevan"
```

### Migraciones y funciones SQL
| Archivo (`supabase/migrations/`) | Qué agrega |
|---|---|
| `20261026120000_init.sql` | Las tablas, los índices únicos, los triggers y la vista `profile_events` |
| `20261028120000_funciones.sql` | `create_event` (crea la reunión con sus bloqueos), `save_response` (guarda o reemplaza una respuesta con sus bloques) y `purge_stale_events` (la limpieza diaria): lo que debe guardarse junto va en una sola función |
| `20261029120000_limites.sql` | La tabla `rate_limits`, la función `rate_limit` (atómica) y el tope de 300 respuestas por reunión en `save_response` |
| `20261030120000_organizador.sql` | La columna `events.owner_name` (nombre de quien organiza sin cuenta) |

### Reglas que la base hace cumplir (triggers y restricciones)
| Regla | Dónde |
|---|---|
| Máximo de integrantes clave por reunión (`max_key`) | trigger en `participants` |
| Un nombre por reunión, sin distinguir mayúsculas ni espacios de más | índice único en `participants` |
| 24 letras por tag, 5 tags por reunión, 5 por plantilla y 30 por cuenta | checks y triggers en `tags`, `event_tags`, `template_tags` |
| Un tag deja de existir cuando ya no está en ninguna reunión ni plantilla | trigger que borra los huérfanos |
| Un solo aviso pendiente por correo y reunión, y uno por cuenta y reunión | índices únicos parciales en `notifications` |
| La forma del aviso (`count` lleva cantidad, `date` y `datetime` llevan fecha) | check en `notifications` |
| Hora de término posterior a la de inicio; reunión cerrada si y solo si tiene `closed_at` | checks en `events`, `blocked_ranges`, `templates` |
| Todo cerrado al navegador: RLS activado sin políticas; solo el servidor (service role) accede | todas las tablas; la vista se cierra con `revoke` |

Lo que valida la API además (no se puede expresar bien en SQL): que los días de un bloqueo sean días de la reunión, que el horario sea múltiplo del bloque, y que los bloques marcados caigan en un día y una hora de la reunión y no estén bloqueados.

**Se quitó respecto a la primera versión:** la fecha límite (`deadline`), el `token` por participante (la identidad es el nombre) y el campo `day` único de los bloqueos (ahora `days`).

## Páginas
| Ruta | Qué es | Quién |
|---|---|---|
| `/` | Crear reunión: nombre, días, horario, bloque, horarios bloqueados, integrantes clave, zona; con cuenta, también tags y plantillas propias | todos |
| `/?plantilla=<id>` | Lo mismo, con una plantilla de la cuenta ya aplicada | con cuenta (si no, se ignora) |
| `/e/[slug]` | La reunión: acceso por nombre, Mi horario, Respuestas, Compartir (celular: pestañas; computador: dos grillas a la vez y Compartir flotante) | todos |
| `/perfil` | Pestañas Reuniones y Plantillas | solo con cuenta; sin cuenta, pide iniciar sesión |
| `/how-to`, `/faq` | Ayuda, una página fija con pestañas por pantalla (`#crear`, `#responder`, `#respuestas`, `#compartir`, `#avisos`, `#cerrar`, `#perfil`); el `#` elige la pestaña antes de pintar | todos |
| `/privacidad`, `/terminos` | Las páginas legales que pide Google para el inicio de sesión | todos |
| `/auth/login`, `/auth/callback` | Inicio de sesión con Google | todos |
| `not-found` | Cuando el link no lleva a ninguna parte (por ejemplo, una reunión que no existe) | todos |

## Endpoints
Todos pasan por el servidor. Los de `/api/me/*` exigen sesión (cookie de Supabase Auth); los demás son públicos. Los errores devuelven `{ error: "mensaje para la persona" }` con el código HTTP que corresponda (400 validación, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto, 429 muchas peticiones).

**Implementado (28 oct):** `POST /api/events`, `GET /api/events/[slug]`, `PUT /api/events/[slug]/responses`, `GET /api/cron/limpieza`, el login (`/auth/login`, `/auth/callback`) y todos los `/api/me/*` y los avisos por correo. Sin sesión, `/api/me/*` responde `401`. Con sesión, `POST /api/events` guarda `owner_id` y los `etiquetas` (tags) de la reunión, y `PUT …/responses` guarda `user_id`. La sesión vive en cookies de Supabase Auth (`@supabase/ssr`); `src/proxy.ts` renueva el token, y cerrar sesión se hace desde el navegador (no hay `POST /auth/signout`). Las plantillas se duplican desde la interfaz, creando una nueva con `POST` (no hay endpoint `duplicate`). El servidor usa `@supabase/supabase-js` con la llave secreta (`src/server/db.ts`) y valida con `zod`; lo que debe guardarse junto va en funciones SQL (`create_event`, `save_response`, `purge_stale_events`, en `supabase/migrations/20261028120000_funciones.sql`), que solo puede llamar el servidor. La grilla habla en bloques `"AAAA-MM-DD|fila"` (hora de la zona de la reunión); el servidor los convierte a instantes (`timestamptz`) con `@date-fns/tz` y de vuelta. Tope de 120 días por reunión (`src/lib/limites.ts`).

### Reuniones (públicos)
| Método y ruta | Qué hace | Cuerpo / respuesta |
|---|---|---|
| `POST /api/events` | Crea la reunión | La misma forma que `Reunion` en `src/lib/reunion.ts`: `{ titulo, zona, dias[], desde, hasta, bloqueMin, claves, bloqueos: [{ id, dias[], desde, hasta }], organizador? }` → `201 { slug, tokenDueno }`. `organizador` es el nombre de quien organiza (sin cuenta) y se guarda en `owner_name`. Con sesión guarda `owner_id` y los tags (`etiquetas`) |
| `GET /api/events/[slug]` | Los datos de la reunión y todas las respuestas | → `{ slug, reunion, personas: [{ nombre, clave, disp[] }], cerrada, organizador }`, con `disp` en bloques `"AAAA-MM-DD\|fila"`, `cerrada` el bloque elegido (o `null` si sigue abierta) y `organizador` el nombre que puso quien organizó sin cuenta (o `null`). No incluye el id de la cuenta ni la llave de quien la creó. `404` si no existe |
| `PUT /api/events/[slug]/responses` | Guarda (crea o reemplaza) una respuesta por nombre | `{ nombre, clave, bloques[] }` → `200 { clave, claveDenegada }`. Si ya no hay lugar de integrante clave se guarda igual como participante normal (`claveDenegada: true`, no es un 409). `400` si algún bloque no existe; `409` si la reunión está cerrada. Con sesión guarda `user_id` |
| `POST /api/events/[slug]/close` | Cierra la reunión con el horario elegido | `{ bloque: "AAAA-MM-DD\|fila", tokenDueno?, nombre? }` → `200`. Solo su creador: con sesión si la cuenta es la dueña, con el `tokenDueno` que devolvió `POST /api/events` (el navegador lo guarda en `localStorage`) o con `nombre` igual al `organizador` (sin distinguir mayúsculas; como al editar una respuesta, no hay contraseña). `403` si no es el creador, `400` si el bloque no existe o está bloqueado, `409` si ya está cerrada. Desde entonces `PUT …/responses` responde `409` |
| `POST /api/events/[slug]/reopen` | Reabre una reunión cerrada | `{ tokenDueno?, nombre? }` → `200`; mismo permiso. Borra `chosen_start` y `closed_at`. **La interfaz no lo usa** (se decidió que una reunión cerrada queda cerrada, D-39) |
| `GET /api/events/[slug]/ics` | Descarga el `.ics` del horario confirmado | `text/calendar`, un evento de `slot_minutes` minutos con la hora en UTC. `404` si la reunión sigue abierta |
| `POST /api/events/[slug]/notifications` | Pide un aviso por correo | `{ tipo: "personas", personas, correo }`, `{ tipo: "fecha", fecha, correo }` o `{ tipo: "fecha-hora", fecha, hora, correo }` (fecha y hora en la zona de la reunión; "fecha" a secas llega ese día a las 9:00) → `201 { id, tokenCancelar }`. `400` si la fecha ya pasó, la cantidad ya se alcanzó o el correo no es válido; `409` si ya hay uno pendiente para ese correo (o para esa cuenta) en la reunión o si la reunión está cerrada; `429` si ese correo ya tiene 5 avisos pendientes o la reunión recibió 30 pedidos en una hora. Con sesión, queda ligado a la cuenta (`user_id`) |
| `GET /api/events/[slug]/aviso` | El aviso pendiente de quien pregunta | → `{ id, aviso: { tipo, personas?, fecha?, hora?, correo } }` o `null`. Con sesión, el de su cuenta; sin cuenta, el que pidió desde este navegador (`?id=` y `?token=` con la llave que recibió) |
| `DELETE /api/notifications/[id]` | Quita un aviso pendiente (pasa a `cancelled`) | `204`. Su dueño con la sesión, o quien lo pidió sin cuenta con `?token=<tokenCancelar>`; `403` si no es suyo; `404` si ya se envió o no existe |

### Cuenta (con sesión)
| Método y ruta | Qué hace | Cuerpo / respuesta |
|---|---|---|
| `GET /api/me/events` | La lista del perfil: las reuniones creadas y respondidas (una sola vez cada una) | → `[{ slug, titulo, tags[], respuestas, rol: "creada"\|"respondida", fecha (instante ISO), aviso: null }]`. Los filtros y el orden se hacen en el navegador |
| `POST /api/me/events/[slug]/tags` | Pone un tag a una reunión de la cuenta (lo crea si no existe, sin distinguir mayúsculas) | `{ nombre }` → `201`. `409` si la reunión ya tiene 5 tags o la cuenta ya tiene 30; `404` si la cuenta no creó ni respondió esa reunión |
| `DELETE /api/me/events/[slug]/tags/[name]` | Quita un tag de una reunión (si queda sin uso, desaparece) | `204` |
| `GET /api/me/tags` | Tus tags con en cuántas reuniones y plantillas está cada uno | `[{ name, count }]` |
| `GET /api/me/templates` | Tus plantillas, las más nuevas primero | `[{ id, nombre, detalle, bloqueMin, desde, hasta, claves, bloqueos: [{ desde, hasta }], tags[] }]` |
| `POST /api/me/templates` | Crea una plantilla | `{ nombre, bloqueMin, desde, hasta, claves, bloqueos[], tags[] }` → `201` con la plantilla. `409` si el nombre se repite; `400` si algo no es válido |
| `PUT /api/me/templates/[id]` | Reemplaza una plantilla | igual que el anterior → `200`; `409` si el nombre ya lo tiene otra |
| `DELETE /api/me/templates/[id]` | La borra (las reuniones ya creadas no cambian) | `204` |

### Sesión y tareas programadas
| Método y ruta | Qué hace |
|---|---|
| `GET /auth/login?next=/ruta` | Empieza el inicio de sesión con Google y, al terminar, vuelve a `next` (solo rutas de la app) |
| `GET /auth/callback` | Vuelta de Google: cambia el código por la sesión (cookies) y redirige a `next`; si falla, vuelve con `?error=login` |
| `GET /api/cron/limpieza` | Cron de Vercel (diario, con `CRON_SECRET`): borra las reuniones sin respuestas hace 2 meses (o sin ninguna y creadas hace 2 meses), con todo lo que cuelga de ellas. Al tocar la base a diario evita que Supabase pause el proyecto |
| `GET /api/cron/avisos` | Con `Authorization: Bearer <CRON_SECRET>`: envía los avisos `date` y `datetime` cuyo `notify_at` ya pasó y revisa de nuevo los `count`. Lo llama el workflow de GitHub Actions `.github/workflows/avisos.yml` **cada 10 minutos** (Vercel en el plan gratis solo permite un cron al día, así que `vercel.json` lo llama además una vez al día como respaldo) |

**Límite de peticiones (implementado):** `src/server/limite.ts` cuenta las peticiones por IP en una ventana de tiempo con la función SQL `rate_limit` (tabla `rate_limits`, migración `20261029120000_limites.sql`); es una función de la base y no una variable en memoria porque Vercel corre en funciones sin memoria compartida, y es atómica (probado con 10 llamadas simultáneas). La IP no se guarda: se convierte en un código con una sal (`CRON_SECRET`) y solo ese código queda, hasta que vence la ventana (la limpieza diaria borra los vencidos). Los límites son holgados porque en una sala de clases todos comparten la IP del wifi: crear reuniones **30 por hora**, responder **300 cada 10 minutos**, pedir avisos **20 por hora**, cerrar reuniones **60 por hora**; al pasarse, `429` con `Retry-After`. Si el contador falla o la función aún no existe, se deja pasar (mejor sin límite que sin servicio). Además, cada reunión admite como máximo **300 respuestas** (lo revisa `save_response`; editar una existente sigue permitido; `409` si no).

**Avisos por correo (implementado):** el correo sale por Resend (`src/server/correo.ts`, variables `RESEND_API_KEY` y `EMAIL_FROM`); sin la clave, en desarrollo se imprime en la consola. Un aviso se manda **una sola vez**: primero se "reclama" (`pending` → `sent`) para que dos procesos no lo manden doble, y si el envío falla vuelve a `pending` (se reintenta en el siguiente ciclo, hasta 24 h después de su hora; después se cancela). El aviso "cuando respondan N personas" se revisa justo después de guardar cada respuesta (`PUT …/responses`, con `after()`, sin hacer esperar a quien responde) y el cron lo repasa por si alguno se quedó sin enviar. Al cerrar la reunión, los avisos pendientes se cancelan. El correo trae el resumen de la reunión (el mismo texto de "Copiar resumen") y un botón "Ver la reunión". El perfil muestra el aviso real de cada reunión (`aviso` y `avisoId` en `GET /api/me/events`).

## Login
**Continuar con Google**, usando Supabase Auth. Sin contraseñas ni correos de verificación: un botón, Supabase guarda la sesión. Configuración única: crear un cliente OAuth en Google Cloud y pegar su id y secreto en Supabase.

Se descartó el link al correo: el correo incluido en el plan gratis de Supabase solo envía unos pocos mensajes por hora, y a otros usuarios no les llegaría de forma confiable, lo que rompería la evaluación del otro grupo.

`useSesion()` (`src/lib/sesion.ts`) lee la sesión real de Supabase Auth; `src/proxy.ts` renueva el token en cada petición y los endpoints `/api/me/*` exigen la sesión. Quien entra con cuenta no escribe su nombre al responder: entra directo a Mi horario con el de su cuenta.

## Límites y validaciones (iguales en pantalla y en la API)
| Qué | Límite |
|---|---|
| Nombre de la reunión | 1 a 80 letras |
| Nombre de quien responde | 1 a 40 letras; único en la reunión sin distinguir mayúsculas |
| Nombre de quien organiza (sin cuenta) | 1 a 40 letras; obligatorio al crear sin cuenta |
| Días de la reunión | al menos 1; si son más de 7, se muestran por semanas (lunes a domingo) |
| Duración del bloque | 10, 15, 20, 30 o 60 minutos |
| Integrantes clave | 0 a 2 por reunión |
| Tags | 24 letras; 5 por reunión; 5 por plantilla; 30 por cuenta |
| Plantillas | nombre de 1 a 50 letras, único por cuenta |
| Aviso por correo | uno pendiente por correo y reunión; no se edita, se quita y se pide otro |

## Las tareas de las entregas
1. Crear una reunión con horario, bloques e integrantes clave.
2. Responder la disponibilidad y verla guardada.
3. Ver las respuestas y copiar el resumen para el grupo.
4. *(Con cuenta)* Encontrar una reunión en el perfil por sus tags.

## Pendiente y fuera de alcance
- Verificar un dominio en Resend para que los avisos lleguen a cualquier correo (hoy, solo al de la cuenta de Resend).
- Reabrir una reunión cerrada: el endpoint existe, pero la interfaz no lo ofrece (D-39).
- Borrar una cuenta: Supabase no deja borrar un usuario con plantillas o tags ("Database error deleting user"), probablemente por el trigger que borra los tags huérfanos; habría que arreglarlo antes de ofrecer "borrar mi cuenta".
