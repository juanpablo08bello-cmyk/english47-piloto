# Preparación para publicar y cobrar: ENGLISH47 (16/11/2026)

Auditoría de producto y seguridad, de solo lectura sobre el código. No se tocó producción, no se leyó `.env` ni `data/` (solo se listaron nombres de archivo), no se usó git, no se abrió ningún navegador. Lo que NO pude comprobar está marcado **(NO VERIFICADO)** y reunido en la sección 9. Las citas `archivo:línea` corresponden al repositorio tal como estaba al leerlo.

Comprobaciones que sí ejecuté:

| Comprobación | Resultado |
|---|---|
| `npm test` (raíz) | 227 pruebas, 227 aprobadas, 0 fallos (5,7 s) |
| `npm audit` (raíz) | 0 vulnerabilidades |
| `npm audit` (web/) | 2 de gravedad baja (`deepmerge` vía `@sveltejs/vite-plugin-svelte`; herramienta de compilación, no llega al navegador) |
| `npx svelte-check` (web/) | 173 archivos, 0 errores, 0 avisos |
| `npx vite build` (web/) | Compila en 0,6 s. Fragmento más grande: 58 kB (22 kB comprimido); el resto, menos de 20 kB comprimidos cada uno |

(Nota: `vite build` regenera `web/dist/`, que está en `.gitignore`.)

---

## 1. Resumen de una página

**Preparación global para cobrar al público: ≈ 35 %.** Para una beta cerrada gratuita de 10-30 personas por invitación: ≈ 70 %.

La base técnica es mejor que la de un prototipo típico: contraseñas con scrypt, sesiones con token hasheado, comprobación de origen, SQL siempre parametrizado, validación estricta del audio, rol de base de datos con mínimo privilegio, copia diaria de PostgreSQL con prueba de restauración, 227 pruebas en verde. El audio no se guarda. Lo que falta no es pulir lo existente: es **todo lo que convierte una app privada en un servicio público**: cuentas con correo, cobro, términos y privacidad, borrado de cuenta, alojamiento estable, topes de coste por alumno y observabilidad. Hoy no existe nada de eso.

| Pregunta | Veredicto | Por qué |
|---|---|---|
| ¿Se puede abrir **ya** a 50 personas? | **No, tal como está.** Sí, como beta cerrada, con ≈ 8-15 jornadas de trabajo | Tope fijo de 7 alumnos (`server/auth.js:5`); la cuota gratuita de Azure (5 h/mes en total) se agota con unos 15 alumnos activos (estimación mía, sección 4); el pool de 5 conexiones se satura con unas pocas llamadas de voz simultáneas (`server/app.js:916`, `server/storage/postgres.js:11`) |
| ¿A **1000**? | **No.** | Capacidad (transacción abierta durante llamadas a proveedores, ranking que consulta por usuario), un solo servidor gratuito que se duerme, sin soporte automatizado (recuperar contraseña lo hace el dueño a mano), sin monitoreo, cuotas de proveedores gratuitas |
| ¿**Cobrar** suscripción? | **No.** Bloqueado por: sin pagos, sin correo, sin términos/privacidad, sin borrado de cuenta, sin revisión nativa del contenido | Son requisitos legales y de confianza, no mejoras. Ver «MVP de pago» (sección 6): ≈ 20-30 jornadas de desarrollo más trabajo externo (revisión nativa, revisión legal) |

Lo bueno para el negocio: el coste de voz por alumno es bajo porque las mesas son guion sin IA generativa (`docs/reforma/00-auditoria-sistema-actual.md` §4.2). Mi estimación (no medida) es de 0,7-1 USD por alumno activo al mes con Azure de pago, frente a 4-9 USD si se activa un LLM en cada mesa (`09-verificacion-apis-y-costes.md` §3.5). Hay margen para cobrar 7-10 USD/mes. El riesgo no es el coste medio sino el peor caso (sección 4) y la ausencia de topes por alumno.

---

## 2. Tabla de puntajes (0-100)

| # | Área | Puntaje | Peso | Resumen |
|---|---|---|---|---|
| 1 | Seguridad | **62** | 15 % | Bases sólidas; fallos en el límite de intentos detrás de un proxy, sin límite general de peticiones, sin HSTS visible en el código, sin correo ni segundo factor |
| 2 | Privacidad y legal | **20** | 15 % | Buen diseño (audio no se guarda, texto solo con permiso) pero cero documentos, cero consentimiento, cero borrado de cuenta |
| 3 | Cuentas y negocio | **8** | 20 % | Solo invitaciones, 7 plazas fijas, sin correo, sin recuperación, sin planes ni cobro |
| 4 | Costes y abuso | **40** | 10 % | Topes mensuales globales y tope diario de voz por alumno; sin topes por alumno para voz del cliente y juez; el panel no estima dinero |
| 5 | Fiabilidad | **30** | 15 % | Copias diarias verificadas (muy bien); alojamiento gratuito que se duerme, sin dominio propio, sin monitoreo, migraciones de una sola versión |
| 6 | Calidad del producto | **48** | 12,5 % | 227 pruebas y cliente nuevo limpio; pero el cliente nuevo es un envoltorio del servidor viejo, el repaso espaciado no está conectado, sin iPhone real, sin revisión nativa, sin PWA en el cliente nuevo |
| 7 | Experiencia | **55** | 12,5 % | Onboarding y juego bien trabajados; el bucle diario no repite las mismas frases (lo que piden los probadores) y varias recompensas no exigen calidad |
| | **Ponderado** | **≈ 35** | | Beta cerrada: ≈ 70 (pesos distintos: los puntos 2-3 casi no cuentan con invitaciones y ToS mínimo) |

Los puntajes son juicio mío con la evidencia de abajo, no una medición. Los pesos reflejan qué bloquea cobrar.

---

## 3. Evidencia por área

### 3.1 Seguridad (62/100)

**Lo que está bien (comprobado en código):**

| Control | Evidencia |
|---|---|
| Contraseñas con scrypt, sal de 16 bytes, comparación en tiempo constante | `server/auth.js:10-20` |
| Token de sesión de 32 bytes aleatorios; en la base solo se guarda su hash SHA-256 | `server/auth.js:36-42`, `:8` |
| Cookie `HttpOnly; SameSite=Lax`, `Secure` con `COOKIE_SECURE=true` o `X-Forwarded-Proto: https` | `server/app.js:186-189` |
| Cambio de contraseña cierra todas las sesiones | `server/auth.js:25-28` |
| Protección CSRF: POST/PUT/DELETE con `Origin` distinto del `Host` devuelve 403 (hay prueba que falsifica el origen) | `server/app.js:906-909`, `test/api.test.js:284` |
| SQL siempre parametrizado (`?`). Las únicas cadenas interpoladas son constantes o la ruta de respaldo escapada | `server/db.js:189,213`; PostgreSQL: `server/storage/postgres.js:6-9` |
| Cuerpo JSON limitado a 64 KB; audio limitado a 960 044 bytes y validado byte a byte (RIFF, PCM 16 kHz, mono, ≤ 30 s) antes de llamar a ningún proveedor | `server/app.js:40,57-73,657`, `server/voice/wav.js:11-19` |
| Cabeceras: CSP (`default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'none'`), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` | `server/app.js:888-893` |
| Todas las rutas filtran por `user.id`; las de administración exigen rol; la simulación se busca por `id AND user_id` | `server/app.js:559,918-924` |
| XSS: el cliente nuevo usa Svelte (escapa por defecto). Un solo `{@html}`, con arte SVG propio (no entrada del usuario) | `web/src/lib/ui/yo/ItemArt.svelte:33` |
| Proveedores: región de Azure validada por regex, voz validada, endpoints de Azure OpenAI validados, `redirect: 'error'`, tiempos límite | `server/voice/azure.js:6-9,29`, `server/voice/juez.js:7` |
| Rol de base de datos de la aplicación sin propiedad ni DDL; esquema fuera de los expuestos | `scripts/supabase-setup.sql:8,216-228`, `POSTGRES.md:16` |
| Secretos: `.env` en `.gitignore`; las cuentas de prueba usan contraseñas aleatorias | `.gitignore`, `scripts/crear-cuenta-prueba.js:19`, `scripts/dev-seed.js:20` |
| Dependencias de ejecución: solo `@anthropic-ai/sdk`, `pg`, `ws` (las dos últimas fijadas a versión exacta). `npm audit` raíz: 0 | `package.json:21-25` |
| El juez de frases trata el texto del alumno como datos (instrucción anti-inyección) | `server/voice/juez.js` (`JUDGE_SYSTEM`, última línea) |

**Brechas (en orden de gravedad):**

| ID | Hallazgo | Evidencia | Gravedad |
|---|---|---|---|
| S1 | **El límite de intentos de acceso usa `req.socket.remoteAddress`.** Detrás de un proxy (Render) esa dirección es la del proxy para todos: la clave pasa a ser «proxy:usuario». Cualquiera puede bloquear la cuenta de otro enviando 6 intentos fallidos, y el tope de 6 intentos por 15 minutos se comparte. Además vive en memoria: se reinicia al dormirse o reiniciarse el servicio. No hay ninguna prueba del limitador | `server/app.js:143`, `server/auth.js:113-130`; `grep too_many test/` sin resultados | Alta |
| S2 | **No hay límite general de peticiones** (solo login, cambio de contraseña y 20 comentarios al día). Un alumno con sesión puede disparar `/api/voice/speak` en bucle | `server/app.js` (solo `limiter` en 141-178; `:496`) | Alta (ver §3.4) |
| S3 | Sin cabecera `Strict-Transport-Security`. Puede añadirla el proxy: **(NO VERIFICADO)** | `server/app.js:888-893` | Media |
| S4 | Sin correo ni segundo factor; recuperar contraseña = el administrador genera una temporal y se la dicta al alumno | `server/db.js:7-24` (no hay columna de correo), `server/app.js:842-849`, `PARA_EL_PRIMO.md:9` | Alta para público |
| S5 | `scryptSync` bloquea el bucle de eventos (≈ decenas de ms por intento) y con usuario inexistente la respuesta es más rápida (no se calcula el hash): permite enumerar usuarios por tiempo y facilita agotar CPU rotando IP. Parámetros por defecto de Node (N=16384), por debajo de lo que hoy se recomienda para contraseñas nuevas | `server/auth.js:12,18`, `server/app.js:147` | Media |
| S6 | Sesión de 30 días fija, sin rotación ni lista de dispositivos, sin «cerrar todas las sesiones» a petición del alumno | `server/auth.js:6,36-42` | Media |
| S7 | Un regalo de 5000 monedas atado al nombre de usuario o nombre visible «juan08x» está escrito en el código y se evalúa en cada carga de estadísticas. Con registro público, cualquiera que se ponga ese nombre visible lo cobra | `server/season.js:11-13`, `server/app.js:134-135` | Baja (hoy), media con registro público |
| S8 | `new URL(origin)` lanza error con `Origin: null` y devuelve 500 en vez de 403 | `server/app.js:908` | Baja |
| S9 | Sin manejadores de `unhandledRejection`/`SIGTERM`; los errores se registran solo como `err.code ?? err.name`, sin traza ni identificador de petición | `server/index.js`, `server/app.js:937` | Media (es observabilidad, §3.5) |
| S10 | Las copias de seguridad (cuentas, hashes de contraseña, progreso) se guardan 30 días como artefacto de GitHub Actions: seguras si el repositorio es privado. Existe una carpeta `para-github/` pensada para publicar: **(NO VERIFICADO si el repositorio es público o privado)** | `.github/workflows/respaldo.yml:105-111`, `.gitignore` | Media |
| S11 | Prueba de intrusión: **nunca se hizo**. Esta revisión es de código, no de ataque | — | — |

### 3.2 Privacidad y legal (20/100)

**Bien diseñado:**
- El audio nunca se guarda (README «Privacidad»; `server/app.js:648`, `server/voice/azure.js` comentario inicial).
- El texto de las conversaciones solo se conserva si el alumno lo permite (`users.keep_transcripts` por defecto 0; `server/db.js:17`). El alumno puede quitar citas y borrar su historial (`server/app.js:804-811`, `web/src/lib/ui/yo/YoPrivacidad.svelte`).
- La administración no ve conversaciones; los avisos técnicos llevan solo códigos conocidos (`server/app.js:504-530`).

**Lo que falta (comprobado: no existe en `server/` ni `web/src/`):**

| ID | Hueco | Detalle |
|---|---|---|
| L1 | **No hay términos de servicio, política de privacidad ni casilla de consentimiento** en ninguna pantalla (búsqueda de «términos/política/edad/menor» en `web/src`: sin resultados; el registro `Invite.svelte` y el login no los muestran) | Necesarios para cobrar y para que las tiendas de pagos aprueben la cuenta |
| L2 | **No hay borrado de cuenta ni exportación de datos.** Solo existe «Borrar mi historial», que conserva la cuenta, el progreso, `usage_log` (sin clave foránea) y los comentarios enviados | `server/app.js:804-811` no toca `users`, `feedback`, `usage_log` ni `reward_events`. Con 30 días de copias de seguridad, un borrado real tarda 30 días en completarse |
| L3 | **Procesadores no declarados**: la voz va a Azure Speech; el texto de respuestas libres va a Groq y a Google Gemini (planes gratuitos: `.env.example` ya advierte que Google puede usar esos textos para mejorar sus productos); OpenAI/Anthropic si se activan los modos de IA. `PARA_EL_PRIMO.md` solo avisa a los 7 alumnos actuales | `.env.example`, `docs/reforma/investigacion/09...md` §4 «Descartar»: los términos de Groq y Gemini «no se verificaron» |
| L4 | **Edad / menores**: no hay verificación ni cláusula. COPPA prohíbe recoger datos de menores de 13 sin consentimiento parental verificable; un mesero puede ser menor de 18 | Se resuelve con cláusula «18+» (o «16+») y casilla, sin construir nada complejo |
| L5 | **Ranking global con nombre visible de todos los alumnos activos**, sin opción de salir | `server/practice.js:763-780` |
| L6 | Sin política de retención: `usage_log`, `feedback` (texto libre del alumno, hasta 600 caracteres, más el tipo de teléfono), `job_logs` (texto libre) y `personal_phrases` no caducan | `server/db.js:145-163,173-184` |
| L7 | Sin correo de contacto ni de soporte en la app | — |
| L8 | Sin aviso de que se recoge la voz como dato sensible en algunos estados | Ver nota legal |

**Nota legal (orientativa, NO es asesoría jurídica y NO verificada con fuente: lo que sigue es conocimiento general que un abogado debe confirmar):**
- **Florida (FIPA, §501.171):** obliga a cualquier negocio con datos de residentes de Florida a tener medidas razonables de seguridad y a notificar brechas. Su definición de dato personal incluye *usuario o correo + contraseña*: ya aplica a ENGLISH47. La ley de privacidad de consumidores de Florida (FDBR) se dirige a empresas muy grandes; probablemente no aplica a este tamaño.
- **CCPA/CPRA (California):** solo aplica por encima de umbrales de ingresos o volumen de datos; probablemente no al inicio, pero conviene una política que ya describa derechos de acceso y borrado.
- **GDPR (UE/Reino Unido):** aplica si se ofrece el servicio a personas en la UE. Un público hispanohablante puede llegar desde España. Decidir: limitar el alcance a EE. UU. y Latinoamérica en los términos, o cumplir GDPR.
- **COPPA:** prohibir menores de 13; mejor 18+.
- **Voz y datos biométricos:** algunos estados (por ejemplo Illinois y Texas) regulan «huella de voz». La evaluación de pronunciación no identifica personas, pero el aviso y el consentimiento explícito de enviar la voz a un tercero son la forma prudente.
- **Suscripciones:** las reglas de renovación automática y cancelación (federal ROSCA y las de cada estado) exigen informar con claridad el precio y la renovación, pedir consentimiento expreso y permitir cancelar de forma tan fácil como se contrató. Debe revisarse con un abogado antes de activar cobros.
- **Impuestos:** Florida y otros estados tienen reglas de impuesto sobre ventas para productos digitales; la forma más simple de no tener que gestionarlo es un «Merchant of Record» (ver §5).

### 3.3 Cuentas y negocio (8/100)

| Requisito para vender | Estado | Evidencia |
|---|---|---|
| Registro público | **No.** Solo se canjea una invitación de un solo uso (vence en 7 días); no hay ruta de alta libre | `server/auth.js:66-111`, README «No existe registro público» |
| Tope de alumnos | **Fijo en código: 7** (el README aún dice «hasta cinco»). Las invitaciones pendientes también ocupan plaza | `server/auth.js:5,69,100`, `README.md:5`, `CHANGELOG.md` 1.1.0 |
| Correo | **No existe** (la tabla `users` no tiene ese campo) | `server/db.js:7-24`, `server/storage/001-pilot.sql:2-19` |
| Verificación de correo, recuperación de contraseña | **No** | `PARA_EL_PRIMO.md:9`: «todavía no se puede recuperar» |
| Planes, precios, cobro, facturación, impuestos | **No hay nada**: ninguna dependencia de pagos, tabla de suscripciones ni ruta | `package.json:21-25`; `server/app.js` (no hay rutas de pago) |
| Cancelación y reembolsos | No hay | — |
| Panel de administración | Sí: invitaciones, plazas, comentarios, consumo, contraseña temporal | `server/app.js:814-861`, `web/src/screens/Admin.svelte` |
| Plan para restaurantes (B2B) | Idea, no construido | `docs/reforma/10-propuesta-sistema-aprendizaje.md` §8 |

### 3.4 Costes y abuso (40/100)

**Lo que existe:**
- Tope mensual **global** por capacidad (voz del alumno, voz del cliente, IA, juez) con aviso al 80 % (`server/config.js:43-51`, `server/voice/index.js:65-78,87-106`).
- Tope **diario por alumno** de 900 s (15 min) de voz a revisar (`server/config.js:49`, `server/voice/index.js:70-76`).
- Los límites por defecto asumen el plan gratuito F0 de Azure: 5 h de voz y 500 000 caracteres al mes en total (`server/config.js:8,44-45`).
- Audio acotado a 30 s y 960 KB; la frase de referencia la decide el servidor, no el cliente (`server/app.js:660`).
- Reintentos controlados con idempotencia en lecciones y repaso.

**Brechas:**

| ID | Hallazgo | Evidencia |
|---|---|---|
| C1 | **La voz del cliente (TTS), el juez y la IA no tienen tope por alumno**, solo el global del mes. Un solo alumno puede gastar el cupo de todos (denegación de servicio por cuota) o, con un plan de pago, hasta el tope global. Cada llamada admite 800 caracteres (≈ 625 llamadas agotan los 500 000 caracteres de F0) | `server/voice/index.js:65-78` (solo `stt` comprueba `user_id`), `server/app.js:693-714` |
| C2 | **El panel no estima dinero**: las tarifas están vacías por diseño y el cálculo cae en «sin estimar». No hay alerta en dólares | `server/config.js:53-58`, `server/voice/index.js:104-105` |
| C3 | **Peor caso por alumno con Azure de pago**: 900 s/día × 30 días = 7,5 h/mes. A 1,00 USD/h más 0,30 USD/h de prosodia (`09-verificacion...md` fila 2d) son ≈ 9,75 USD solo de voz, casi igual a un precio de 10 USD. El uso real será mucho menor, pero no hay nada que lo garantice | `server/config.js:49` |
| C4 | **La cuota gratuita F0 se agota con ≈ 15 alumnos activos** (estimación mía: 12 intentos de voz al día × 5 s × 20 días = 1200 s por alumno al mes; 18 000 s ÷ 1200 = 15). Además F0 admite **1 petición concurrente**: con varios alumnos a la vez habrá rechazos (`PILOTO.md:22` ya lo admite) | `server/config.js:8`, `09...md` fila 2e |
| C5 | **Sin límite de peticiones por alumno ni por IP** en voz, juez ni lecturas (ver S2) | `server/app.js` |
| C6 | **Propinas y monedas sin tope diario**: se pueden encadenar mesas; la propina por turno toma el mejor intento y el ranking por propinas premia cantidad. Hoy solo compran cosméticos; si en el futuro valen algo (descuentos, plan), es un vector de fraude | `server/practice.js:553-560,619-660,763-780` |
| C7 | Modelo de IA por defecto **`claude-opus-5-5`** (el más caro) para las «mesas clásicas» ocultas; sin tope por alumno | `server/config.js:35` |
| C8 | Riesgo de picos: nada pone en cola ni degrada con elegancia salvo caer a la voz del dispositivo cuando se agota la cuota. Ver capacidad en §3.5 | — |
| C9 | Fraude de cuenta/pagos: no existe (no hay pagos). Con pagos habrá que usar la prevención del proveedor (p. ej. verificación 3-D Secure y reglas antifraude de Stripe: **NO VERIFICADO**) | — |

### 3.5 Fiabilidad (30/100)

**Dónde se aloja hoy (según la documentación; NO VERIFICADO qué hay en vivo):**
`PILOTO.md:5-11` y `POSTGRES.md` describen **Render (plan gratuito, «se duerme sin visitas y tarda cerca de un minuto en despertar») + Supabase (PostgreSQL gratuito) + Azure Speech F0**. El README, más antiguo (`README.md:31`), dice «Todavía no hay una dirección permanente». El servidor nuevo del cliente 2.0 se sirve con `CLIENT_DIR=web/dist`; por defecto sirve `public/` (el cliente viejo) (`server/app.js:38`).

**HTTPS y dominio.** Render entrega HTTPS en su subdominio `*.onrender.com` (`.env.example` usa `PUBLIC_ORIGIN=https://tu-servicio.onrender.com`). Un dominio propio, un servicio que no se duerma y una base de datos con recuperación a un punto en el tiempo cuestan dinero mensual (**precios NO VERIFICADOS**; verificar en las páginas oficiales de Render y Supabase). Hace falta además la cabecera HSTS (S3).

**Lo que está bien:**
- Copia diaria con `pg_dump`, **restauración de prueba en una base temporal**, comprobación de recuentos por tabla y retención de 30 días (`.github/workflows/respaldo.yml:15-111`).
- Rol de ejecución sin permisos de esquema (`scripts/supabase-setup.sql:216-228`).
- Prueba de integración PostgreSQL (`test/postgres.integration.js`, **no ejecutada por mí**: requiere base desechable).
- Idempotencia en operaciones de progreso y bloqueo por usuario con `pg_advisory_xact_lock` (`server/storage/postgres.js:47`).

**Brechas:**

| ID | Hallazgo | Evidencia |
|---|---|---|
| F1 | **Capacidad: toda petición se ejecuta dentro de una transacción con una conexión del pool, incluidas las llamadas a Azure/OpenAI/Groq/Gemini** (hasta 15-20 s cada una). El pool es de **5 conexiones** y el tiempo de espera para conseguir una es de 8 s. Con ≈ 5 voces simultáneas, las demás peticiones de cualquier alumno esperan y fallan con 500. El bloqueo por usuario no ayuda: serializa al mismo alumno, no libera el pool | `server/app.js:916-926` (`tx` envuelve `r.handler`), `:662-665,704-706` (llamadas al proveedor dentro), `server/storage/postgres.js:11,19` |
| F2 | `statsFor` recorre todas las filas de `reward_events` de la temporada en cada carga y se llama varias veces por pantalla; el ranking hace 2 consultas por usuario activo (N+1); la sesión diaria vieja se sigue creando todos los días (D3 de la auditoría 00) | `server/app.js:119-138`, `server/practice.js:763-780`, `docs/reforma/00...md` D3, D15 |
| F3 | **Un solo proceso, sin escalado horizontal** probado; el limitador de login en memoria no funciona con varias instancias | `server/auth.js:113-130` |
| F4 | **Sin observabilidad**: no hay endpoint de salud, ni identificador de petición, ni trazas de error, ni alertas, ni monitor de disponibilidad, ni Sentry. Los errores 500 quedan como una línea `Fallo de operación <código>`. `usage_log` es el único registro de operación | `server/app.js:937`, `server/index.js` (búsqueda de `health|sentry|SIGTERM|unhandledRejection` sin resultados) |
| F5 | Sin cierre ordenado (`SIGTERM`): cada despliegue en Render corta peticiones en curso | `server/index.js` |
| F6 | **Migraciones**: PostgreSQL tiene una sola versión (`schema_versions` = 1) con `ALTER TABLE` pegados al final del script inicial; cualquier cambio exige una migración nueva sin marco que la aplique; la tabla `free_requests` se crea y nunca se usa. SQLite y PostgreSQL son dos esquemas paralelos que hay que mantener a mano | `server/storage/001-pilot.sql:181-195`, `server/storage/postgres.js:62-75`, `server/db.js:187-234` |
| F7 | **Sin integración continua**: el único flujo de GitHub Actions es el respaldo; no se ejecutan `npm test` ni las pruebas del cliente en cada cambio | `.github/workflows/` (solo `respaldo.yml`) |
| F8 | Supabase Free y Render Free tienen reglas de inactividad y sin recuperación a un punto en el tiempo: **(NO VERIFICADO con la documentación vigente)**; la copia diaria de GitHub mitiga pero deja hasta 24 h de pérdida posible | `PILOTO.md:9-11` |
| F9 | El despliegue del cliente nuevo no está resuelto: `web/dist` está en `.gitignore`, `PILOTO.md` indica solo `npm start` (sin paso de compilación) y hay que definir `CLIENT_DIR` | `.gitignore`, `PILOTO.md:16`, `server/app.js:38` |
| F10 | Sin plan de recuperación ante desastres escrito más allá de «restaurar el volcado»; tiempo de restauración no medido | `POSTGRES.md:32-38` |

### 3.6 Calidad del producto (48/100)

**Bien:**
- 227 pruebas del servidor en verde; 7 especificaciones e2e del cliente nuevo (1820 líneas con utilidades, Playwright; 6 usan `axe-core` para accesibilidad). **No ejecuté los e2e** (requieren Chromium instalado en `C:\Herramientas` y servidores).
- Cliente nuevo: TypeScript/Svelte, 0 errores de tipos, carga perezosa por pantalla, paquete pequeño (≈ 2,7 MB en total incluidas imágenes `.webp` y fuentes; el JavaScript de cada pantalla pesa entre 1 y 22 kB comprimidos). Respeta `prefers-reduced-motion` (`web/src/styles/tokens.css:60`).

**Brechas:**

| ID | Hallazgo | Evidencia |
|---|---|---|
| Q1 | **El cliente nuevo es una piel sobre el servidor viejo**: usa los mismos endpoints (`/api/aprender`, `/api/practice`, `/api/mesas`…). La «tarjeta única de frase» y el repaso espaciado de la propuesta (`10-propuesta...md` §2, §5) y la Fase 6 del plan (`20-plan-v2.md`) **no están construidos** | `web/src/lib/ui/aprender/TandaFlow.svelte:3`, `JuegoFlow.svelte:3`, `web/src/screens/Repasar.svelte:22-27` |
| Q2 | **Bugs de la auditoría 00 que siguen abiertos** (verificados hoy): D1 repaso espaciado sin conectar (`server/practice.js:4-16` no importa `srs.js`); D2 el diagnóstico se salta (`web/src/screens/Bienvenida.svelte:50`); D4 «Aprender» paga sin verificar acierto (`server/practice.js:531-540`); D5 Temas calcula estrellas en el cliente; D7 propinas sin tope y `bestAttempt` toma el máximo; D8 `generateMesa` sobrescribe la mesa en curso (`server/practice.js:580-595`); D14 regalo atado a un nombre (`server/season.js:11`); D15/D18 consultas O(n) por petición | `docs/reforma/00...md` §7 |
| Q3 | **Contenido sin revisión por persona nativa**: 636 expresiones (66 leídas por completo), 463 frases, 704 filas del diccionario VIP, 40 mesas, 84 situaciones de «Pronunciar». Solo pasaron validaciones automáticas y lectura de Claude | `README.md:130`, `PILOTO.md:26`, `docs/reforma/20-plan-v2.md:54` |
| Q4 | **iPhone nunca probado con voz real**: permiso de micrófono en cada turno, interruptor de silencio, PWA instalada. Lo probado fue Chromium de escritorio con audio sintético. Fallos conocidos del flujo de voz sin resolver en la auditoría 00 (V1: no hay modo texto en Mesas; V2: permiso en cada turno; V6/V7: iOS) | `PILOTO.md:26`, `docs/reforma/00...md` §5.2, `web/playwright.config.ts` comentarios |
| Q5 | **El cliente nuevo no es instalable**: `web/index.html` no enlaza ningún `manifest`, hace referencia a `/icon.svg` que no existe en `web/public/` (404), no tiene `apple-touch-icon` ni service worker, y lleva `<meta name="robots" content="noindex">`. El cliente viejo sí tiene manifest e iconos (`public/manifest.webmanifest`, `public/icon-*.png`) | `web/index.html:7-11`, `web/public/` (solo `art/` y `mascot/`) |
| Q6 | Ruta pública `/lab` (laboratorio de diseño) sin sesión | `web/src/routes.ts:28` |
| Q7 | **Sin analítica de producto**: no hay forma de medir retención, embudo ni tiempo de uso, salvo `streak_days` y `usage_log` | búsqueda en `server/` |
| Q8 | **Rendimiento en móvil real: NO VERIFICADO.** Solo medí tamaños de paquete, no tiempos en un Android de gama media ni con 3G/4G lento. La auditoría 00 (V10) ya marcó el flujo de voz completo en 4G lento como no medido | — |
| Q9 | **Accesibilidad parcial**: se prueba con `axe` en Chromium (reglas automáticas, solo infracciones graves en algunos archivos), pero no con lector de pantalla ni teclado completo; el cliente tiene 181 atributos `aria-*` | `web/e2e/cuenta.spec.ts:21`, `docs/reforma/00...md` §8 |
| Q10 | Documentación desfasada: el README dice versión 0.4.0 y «hasta cinco» alumnos, mientras `package.json` es 1.3.0 y el tope es 7; `VOZ.md`, `REVISION.md` describen 0.3.x; hay una carpeta `para-github/` duplicada | `README.md:3,5`, `package.json:3` |
| Q11 | Dos productos en uno: el servidor mantiene las rutas y la sesión diaria antiguas (`/api/daily*`, Ruta de 48 lecciones, mesas clásicas) que ningún cliente usa de cara al alumno, pero siguen activas, mantenidas y en la superficie de ataque | `server/app.js:211-221,260-345,532-587` |
| Q12 | Tests ausentes en zonas de riesgo: limitador de intentos, expiración/rotación de sesiones, tope por alumno, cabeceras | `test/` (sin resultados para `too_many`) |

### 3.7 Experiencia (55/100)

**Bien:** onboarding de tres pasos (`web/src/screens/Bienvenida.svelte`), primeras dos mesas guiadas, mascota, racha, protector, niveles, tienda, resumen de mesa con propina y confeti, mensajes de error en español claro, comentarios con la bandeja en administración.

**Brechas:**

| ID | Hallazgo | Evidencia |
|---|---|---|
| E1 | **El alumno no repite las mismas frases cada día**: cada tanda trae 4 frases nuevas y las vistas solo vuelven al agotar las 463. Los probadores piden justo lo contrario (repetición diaria de un grupo fijo). Es la brecha más citada por los alumnos reales | `docs/reforma/00...md` §2.3, `10-propuesta...md` §5 |
| E2 | **Las recompensas no exigen calidad**: la jornada válida cuenta intentos de 0 estrellas; «Me salió bien» (autoevaluación) también cuenta y paga una propina mínima | `docs/reforma/00...md` §2.1, D6; `server/practice.js:553` |
| E3 | **El cliente no escucha**: los turnos del cliente son guion fijo; lo que dice el alumno no cambia la conversación | `docs/reforma/00...md` §4.3 |
| E4 | **Léxico y menú únicos** (5 platos fuertes, 3 entradas, 2 postres): el mesero real tiene el menú de su restaurante | `docs/reforma/00...md` §4.3 |
| E5 | **Sin nivelación**: el diagnóstico se salta; la dificultad sube por cantidad de mesas, no por desempeño | `Bienvenida.svelte:50`, `content/mesas.js:630` |
| E6 | **Sin recordatorios** (ni correo ni notificaciones push) y sin «Mis errores» para estudiar lo que falló | búsqueda en `server/` y `web/src/`; `10-propuesta...md` §3 |
| E7 | Ranking global que no pregunta; con muchos usuarios un alumno nuevo ve a todos por encima | `server/practice.js:763` |
| E8 | **Sin datos de retención ni de uso real**: solo hay 7 alumnos y ninguna métrica agregada. «Lo que piden los probadores» está documentado solo como la petición de repetición diaria; no hay un registro estructurado de entrevistas | `docs/reforma/00...md` |

---

## 4. Costes: lo que hay que saber antes de poner precio

- **Escenario guion (actual):** sin LLM en las mesas. Gasto = pronunciación/transcripción de Azure + voz del cliente + juez de frases. Mi estimación (no medida): 12 intentos de voz al día × 5 s × 20 días = 20 min/mes de revisión (≈ 0,43 USD con prosodia) + ≈ 14 400 caracteres de voz del cliente (≈ 0,22 USD a 15 USD/M) = **≈ 0,7-1 USD por alumno activo al mes**. Tarifas: `09-verificacion-apis-y-costes.md` filas 2d y fórmulas §3.2.
- **Escenario con IA en cada mesa (propuesta del documento 09):** 2,8-8,6 USD/mes por alumno según configuración «mínima» o «recomendada» (`09...md` §3.5). Ese documento ya documenta que usar Opus 5.5 en todo cuesta ≈ 13,4 USD/mes: **no viable a 7-10 USD**.
- **Peor caso con el tope actual:** ≈ 9,75 USD/mes por un alumno que agota los 15 min diarios todo el mes (C3). Hay que bajar el tope diario o añadir un tope mensual por alumno.
- **Margen de bruto antes de comisiones e infraestructura:** con 9,99 USD/mes y coste de 1 USD: ≈ 90 %. Comisiones de pasarela, impuestos, alojamiento de pago, correo y soporte: **NO VERIFICADOS**; verifíquese en las páginas de cada proveedor.
- Precio de referencia de otras apps (de `09...md` §3.6): 7-15 USD/mes con facturación anual, 12-20 mensual. Para meseros hispanohablantes de Miami, 5-9 USD/mes mensual puede ser lo razonable (hipótesis del propio documento, sin validar).

---

## 5. Brechas priorizadas

Leyenda de prioridad: **P0** = bloquea cobrar y abrir al público; **P1** = hacerlo antes de la beta abierta; **P2** = antes del lanzamiento; **P3** = mejora. «B» = también necesario para la **beta cerrada** de 10-30 personas. Esfuerzo = jornadas de un desarrollador (1 jornada ≈ 6-8 h); con trabajo asistido puede ser menos. Lo marcado «ext.» depende de otra persona (nativo, abogado).

| # | Pri. | B | Área | Brecha | Esfuerzo |
|---|---|---|---|---|---|
| 1 | P0 | B | Legal | Términos de servicio + política de privacidad (procesadores: Azure, Groq, Gemini), casilla de consentimiento y cláusula 18+ en el registro (L1, L3, L4, L7) | 1-2 días + revisión ext. 2-5 días |
| 2 | P0 | B | Capacidad | Soltar la conexión de base de datos antes de llamar a proveedores externos (o subir el pool y limitar voces concurrentes) (F1) | 1-2 días |
| 3 | P0 | B | Costes | Pasar Azure de F0 a pago por uso con tope; la cuota gratuita se agota con ≈ 15 alumnos y admite 1 petición simultánea (C4) | 0,5 día + presupuesto |
| 4 | P0 | B | Seguridad | Arreglar el límite de intentos detrás del proxy (IP real de confianza o clave por usuario con aviso), mover a la base, añadir límite general de peticiones por alumno/IP y pruebas (S1, S2, S5) | 1-2 días |
| 5 | P0 | B | Costes | Topes mensuales por alumno para voz del cliente, juez y revisión de voz; bajar el tope diario; alerta de gasto en dólares con tarifas reales (C1, C2, C3) | 1-2 días |
| 6 | P0 | B | Fiabilidad | Alojamiento que no se duerma, con dominio propio, HTTPS y HSTS; base con recuperación puntual o copia más frecuente que la diaria (F8, S3, §3.5) | 1 día + coste mensual |
| 7 | P0 | B | Cuentas | Quitar el tope fijo de 7 (variable de entorno) y poner el servicio a servir `web/dist` con paso de compilación en el despliegue (F9, `auth.js:5`) | 0,5-1 día |
| 8 | P0 | | Cuentas | Registro con correo + verificación + recuperación de contraseña (S4) | 3-4 días |
| 9 | P0 | | Negocio | Cobro: planes, checkout, portal de cancelación, webhooks, tabla de suscripciones, acceso por plan, prueba en modo de pruebas; impuestos (ver «Merchant of Record») | 5-7 días |
| 10 | P0 | | Legal | Borrado de cuenta (con cascada, incluida `usage_log` y `feedback`) y exportación de datos por el propio alumno; política de retención de copias (L2, L6) | 1,5-2 días |
| 11 | P0 | | Contenido | Revisión por persona nativa de las 40 mesas, 463 frases y las expresiones más usadas (Q3) | 3-10 días ext. |
| 12 | P0 | B | Calidad | Prueba en iPhone y Android reales: permiso de micrófono, audio con interruptor de silencio, PWA instalada, 4G lento (Q4, Q8) | 1-2 días + dispositivos |
| 13 | P1 | B | Fiabilidad | Observabilidad mínima: identificador de petición, registro de errores con traza, endpoint de salud, monitor de disponibilidad, alerta de errores (Sentry o similar), cierre ordenado (F4, F5, S9) | 1-1,5 días |
| 14 | P1 | B | Calidad | PWA del cliente nuevo: manifest, iconos (192/512/180), `apple-touch-icon`, quitar `noindex`, retirar `/lab` (Q5, Q6) | 0,5-1 día |
| 15 | P1 | | Experiencia | Conectar el repaso espaciado a las frases del bucle diario: «tus frases de hoy» fijas, aciertos desde el servidor, errores de las mesas al repaso del día siguiente (E1, Q1, Q2 D1/D4/D5) | 5-8 días |
| 16 | P1 | | Costes/abuso | Tope diario de propinas y monedas; sin pago por autoevaluación; ranking opcional (opt-in) y por constancia (C6, E2, L5) | 1-1,5 días |
| 17 | P1 | | Seguridad | Sesión: rotación, «cerrar todas las sesiones», cookie `__Host-`, parámetros de scrypt más altos y hash falso en usuario inexistente, `Origin: null` a 403 (S5, S6, S8) | 1 día |
| 18 | P1 | | Fiabilidad | Marco de migraciones común a SQLite y PostgreSQL con versiones numeradas; retirar la tabla `free_requests`; copia previa a cada migración (F6) | 1-2 días |
| 19 | P1 | | Fiabilidad | Integración continua: `npm test`, `svelte-check`, build y e2e en cada cambio (F7, Q12) | 0,5-1 día |
| 20 | P1 | | Seguridad | Quitar `SEASON_GIFTS` (nombre escrito en el código) (S7) | 0,1 día |
| 21 | P2 | | Rendimiento | Eliminar el recorrido de `reward_events` en cada petición, el N+1 del ranking y la sesión diaria heredada (F2, Q11) | 2-4 días |
| 22 | P2 | | Experiencia | Nivelación inicial (primera mesa guiada que ubica el nivel) en lugar del diagnóstico saltado (E5) | 1-2 días |
| 23 | P2 | | Experiencia | Recordatorios (correo; push si se instala como PWA) y analítica de producto con consentimiento (E6, Q7) | 3-5 días |
| 24 | P2 | | Calidad | Accesibilidad completa: lector de pantalla, teclado, contraste, revisión en iPhone (Q9) | 1-2 días |
| 25 | P2 | | Calidad | Actualizar README, VOZ.md, REVISION.md; retirar o archivar `para-github/` (Q10) | 0,5 día |
| 26 | P2 | | Marca | Revisar licencias de sonidos y arte; `docs/DESIGN.md` toma de referencia a otra empresa (derechos de marca/mascota) (**NO VERIFICADO**) | 0,5 día |
| 27 | P3 | | Producto | Menú propio por restaurante, mesas ramificadas, plan B2B (E3, E4) | Semanas |

**Total de P0 (cobrar):** ≈ 18-28 jornadas de desarrollo más 5-15 días de trabajo externo (nativo, abogado). **Total de «B» (beta cerrada 10-30):** ≈ 8-15 jornadas.

---

## 6. El «MVP de pago»: lo mínimo imprescindible antes del primer dólar

Si una de estas cosas falta, no se debe cobrar:

1. **Términos, privacidad y consentimiento** visibles en el registro y en Perfil, con cláusula 18+, lista de proveedores de datos (voz a Azure, texto a Groq/Gemini u otro), contacto de soporte y revisión de un abogado (brecha 1).
2. **Cuenta con correo verificado y recuperación de contraseña** (brecha 8). Cobrar a alguien que no puede recuperar su cuenta genera reembolsos y reclamos.
3. **Cobro seguro**: Checkout alojado por la pasarela (nunca recibir tarjetas en tu servidor), portal para cancelar y cambiar de plan, webhooks que activan/desactivan el acceso, recibos por correo, prueba completa en modo de pruebas (brecha 9). Para impuestos y facturación internacional, considerar un «Merchant of Record» (proveedor que vende en nombre del negocio y gestiona impuestos) o el cálculo automático de la pasarela; comisiones y cobertura: **NO VERIFICADOS**.
4. **Borrado de cuenta y exportación** por el propio alumno (brecha 10).
5. **Alojamiento estable**: sin dormirse, dominio propio, HTTPS+HSTS, copia con restauración probada (brecha 6).
6. **Topes de coste por alumno y alerta de gasto** (brechas 3 y 5). El plan gratuito, si lo hay, debe tener tope duro.
7. **Protección ante abuso y caídas**: límite de intentos y de peticiones funcionando detrás del proxy; soltar la conexión durante llamadas externas; observabilidad con alerta a tu teléfono (brechas 2, 4, 13).
8. **Contenido revisado por una persona nativa**, al menos lo que se cobra (mesas y frases del plan) (brecha 11).
9. **Probado en iPhone y Android reales** con voz (brecha 12), y el cliente nuevo instalable (brecha 14). Es el producto que se cobra: un alumno de pago que no puede usar el micrófono se va.
10. **Una razón para volver cada día**: repaso de las mismas frases conectado a las mesas (brecha 15). No es un requisito legal, pero sin eso el valor percibido por el que paga se agota en una semana (los propios probadores lo piden).

Todo lo demás (menú propio, mesas ramificadas, B2B, ranking mejorado) puede esperar a la etapa 3.

---

## 7. Plan en 3 etapas

### Etapa 1: beta cerrada, 10-30 personas, gratis, por invitación (2-3 semanas de preparación + 4 semanas de uso)

**Objetivo:** validar que el producto retiene, que la voz funciona en teléfonos reales y cuánto cuesta de verdad por alumno. No se cobra.

Preparación (brechas «B», 8-15 jornadas):
- Términos y privacidad mínimos de beta (brecha 1) con casilla en la invitación.
- Azure de pago por uso con tope duro; topes por alumno; alerta en dólares (brechas 3, 5).
- Pool de conexiones y límite de intentos corregidos (2, 4); observabilidad básica (13).
- Servidor sin dormirse, dominio propio y HTTPS (6); quitar el tope de 7; servir el cliente nuevo instalable (7, 14).
- Prueba en iPhone y Android reales (12).
- Procedimiento manual y documentado para borrar una cuenta y recuperar contraseñas (hasta construirlo).

Medir: retención al día 7 y 14, mesas completadas por alumno por semana, proporción de intentos que caen en «autoevaluación» (indica fallos de voz), coste real por alumno, errores por tipo (`feedback` técnico), y entrevistas de 10 minutos con 8-10 alumnos.

**Criterio para pasar a la etapa 2:** ≥ 40 % de los alumnos practica 3+ días por semana en la semana 4; fallos de voz < 10 % de los intentos; coste real < 2 USD por alumno activo/mes; ningún incidente de datos; al menos 5 alumnos dicen que pagarían (pregunta directa, con un precio).

### Etapa 2: beta abierta con pago (200-500 personas, 6-8 semanas de construcción + 8 semanas de uso)

**Objetivo:** cobrar a un grupo pequeño con precio de fundador y comprobar cobro, soporte y margen.

Construcción: todo el «MVP de pago» (sección 6) y brechas P1 (15-20): registro con correo, cobro con prueba extensa en modo de pruebas, borrado de cuenta, revisión nativa, repaso espaciado, tope de propinas, sesiones, migraciones y CI.
- Plan gratis limitado (por ejemplo, una mesa al día) + plan de pago; precio de lanzamiento dentro de 5-9 USD/mes mensual (hipótesis; validar).
- Política de reembolsos y mensaje claro de renovación y cancelación.
- Soporte: correo de soporte, plantilla de respuestas, tiempos de respuesta; tablero de errores.
- Revisión legal completa de documentos y de la renovación automática.

**Criterio para pasar a la etapa 3:** conversión gratis→pago ≥ 5 % (hipótesis), cancelación mensual < 12 %, margen bruto ≥ 70 % con el coste medido, tiempo de respuesta de soporte < 24 h, sin incidentes de seguridad, uptime ≥ 99 % medido.

### Etapa 3: lanzamiento público (a partir de 1000)

- Arquitectura para escala: varias instancias (limitadores en la base), consultas agregadas, base de datos de pago con recuperación puntual, cuota de Azure S0 elevada si hace falta (documentación: S0 admite 100 peticiones concurrentes, ampliable, `09...md` fila 2e).
- Contenido y producto diferenciador: menú propio del restaurante, mesas ramificadas, nivelación, recordatorios, ranking opcional.
- Prueba de intrusión externa, plan de respuesta a incidentes, revisión periódica de dependencias.
- Canales de adquisición (la app es PWA instalable; las tiendas de aplicaciones son opcionales y tienen sus propias comisiones y reglas: **NO VERIFICADO**), plan B2B para restaurantes.
- Revisión anual legal y de costes de proveedores (los precios cambian: el propio documento 09 detectó cambios recientes en DeepL y Azure).

---

## 8. Riesgos principales (resumen)

1. **Cumplimiento y confianza**: cobrar sin documentos ni borrado de cuenta es el mayor riesgo legal y de reputación.
2. **Capacidad y cuotas**: con la configuración actual, 15 alumnos activos agotan la cuota gratuita y unas pocas voces simultáneas saturan la base de datos.
3. **Producto**: sin repetición espaciada, el valor que percibe quien paga se agota rápido; es lo que los alumnos ya piden.
4. **Móvil real**: iPhone nunca probado con voz; el micrófono es la función principal.
5. **Dependencia de planes gratuitos** (Groq, Gemini, Render, Supabase, Azure F0) para un producto de pago: términos y garantías sin verificar.

---

## 9. Lo que NO verifiqué

- **Producción en vivo**: no accedí a ninguna URL ni servicio; no sé qué hay desplegado, qué plan de Render/Supabase/Azure se usa hoy, si el repositorio de GitHub es público o privado, ni si el flujo de respaldo diario está activo y tiene su secreto. La descripción de alojamiento sale de `PILOTO.md`/`POSTGRES.md`/`README.md`.
- **`.env` y `data/`**: no los leí. No sé qué claves están configuradas, qué topes mensuales reales hay ni cuántos alumnos hay.
- **Cabeceras reales en producción** (HSTS, compresión, caché del proxy): solo leí el código del servidor.
- **Voz real, iPhone y Android, rendimiento en móvil, tiempos de arranque en frío**: nada probado en dispositivos. Los e2e de Playwright (Chromium) no los ejecuté; la prueba de integración de PostgreSQL tampoco.
- **Seguridad**: es revisión de código, no prueba de intrusión. No audité exhaustivamente `server/practice.js`, `server/sim/engine.js`, `server/daily.js` ni `content/` en busca de fallos de autorización o de lógica; las rutas leídas en `server/app.js` sí filtran por usuario. No revisé el historial de git (posibles secretos antiguos) por la instrucción de no usar git. No revisé versiones de dependencias transitivas más allá de `npm audit`.
- **Precios y límites de proveedores** (Azure, Render, Supabase, pasarelas de pago, correo, Groq, Gemini): tomados de `09-verificacion-apis-y-costes.md` (consulta del 16/11/2026) y de conocimiento general; no consulté páginas oficiales hoy. Los números de coste por alumno (0,7-1 USD, 9,75 USD de peor caso, ≈ 15 alumnos con F0) son estimaciones mías, derivadas de esas tarifas y de supuestos de uso (12 intentos de voz de 5 s al día, 20 días al mes) que no están medidos.
- **Leyes**: la sección legal es orientativa, escrita de memoria, sin fuentes consultadas y sin asesoría jurídica. Cada afirmación (FIPA, CCPA, GDPR, COPPA, voz como dato biométrico, renovaciones automáticas, impuestos sobre productos digitales) debe confirmarla un abogado que ejerza en Florida.
- **Accesibilidad con lector de pantalla** y contraste real: no probado.
- **Calidad lingüística del contenido** y de la corrección: no evalué si las frases son correctas; solo constato que no las revisó una persona nativa (según la propia documentación).
- **Qué piden los probadores**: solo consta en los documentos del repositorio (repetición diaria de un grupo fijo); no hablé con ellos ni vi mensajes de la bandeja de comentarios (están en la base de datos).
