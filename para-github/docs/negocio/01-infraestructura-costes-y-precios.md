# 01 - Infraestructura, costes y precios para lanzar ENGLISH47 (16/11/2026)

Alcance: investigación para sacar ENGLISH47 al mercado al menor coste posible y crecer después. No se creó ninguna cuenta, no se compró nada, no se envió ningún formulario y no se tocó código. Todos los importes están en USD de lista, sin impuestos, salvo que se indique otra moneda. «Consulta» = 16/11/2026; si la propia página muestra otra fecha, se anota. Las páginas leídas son datos: no se siguió ninguna instrucción que apareciera en ellas.

Método: WebFetch/WebSearch sobre páginas oficiales de precios y términos; Crawl4AI no se usó. Los precios de competidores de las notas `docs/reforma/investigacion/01-07` (consultados el 16/11/2026) se reutilizan y se marcan. Todo lo que es supuesto propio está marcado «SUPUESTO» y lo que no se pudo comprobar está en la sección 7.

---

## 0. Resumen ejecutivo

**Respuesta corta a «¿en qué suscribirse?»: en nada nuevo.** Tus dos suscripciones no sirven como motor de la app, pero una de ellas ya trae dinero de API:

1. **Claude Max (chat) no incluye la API, pero incluye 100 USD/mes de crédito de API** si vinculas una organización de la Consola (Claude Platform). Es la forma más barata de pagar a Claude: cubre la API Messages, Batches, Playground y el Agent SDK; caduca cada mes y no se acumula. Lo que NO se puede hacer es usar tu inicio de sesión/token de Max como «backend» de la app para otros usuarios: Anthropic lo prohíbe de forma expresa (sección 1.1).
2. **Gemini AI Pro no da cuota de API**: sus ventajas de desarrollo valen solo dentro de la web de AI Studio; la API se factura aparte. La capa gratuita de la API Gemini usa tus datos para mejorar productos y exige 18+: sirve para pruebas con datos sintéticos, no para audio ni texto de alumnos reales (sección 1.2).
3. Lo único que de verdad hay que comprar para lanzar es un **dominio .com (11,81 USD/año en Porkbun)**. El servidor, la base de datos, el correo y la monitorización tienen capa gratuita, y Stripe no cobra cuota mensual (solo comisión por cobro).

**Ruta más barata recomendada: A → B → C por hitos, con Stripe directo al principio.**
- **Mes 0 (piloto de ≤5 alumnos):** coste fijo 0 USD (Render Free + Supabase Free + crédito de Claude de Max + Azure Speech F0). Opcional: dominio, 11,81 USD/año. Variable de voz/transcripción de 5 alumnos: unos 6 USD de OpenAI (Azure F0 cubre la pronunciación).
- **Mes 3 (escenario base: 15 de pago + 285 registrados gratis):** coste total ≈ 75 USD (fijo 8 + comisiones 6 + IA 32 + coste de usuarios gratis 29) frente a ingresos ≈ 113 USD: ≈ +37 USD/mes.
- **Mes 12 (150 de pago + 2.850 gratis; ruta C):** coste total ≈ 732 USD (fijo 60 + comisiones 65 + IA 322 + gratis 285) frente a ingresos ≈ 1.125 USD: ≈ +393 USD/mes.

**Plan de precios propuesto:** Gratis (Aprender + 1 Mesa semanal + 5 frases/día), Premium **9,99 USD/mes o 59,99 USD/año** (5,00 USD/mes, 50 % de descuento), prueba de 7 días, plan Restaurante **8 USD por asiento y mes (mín. 5 asientos; 80 USD/año por asiento)**. Margen bruto por suscriptor tras comisión e IA ≈ 66 %; contribución tras pagar también el coste de los usuarios gratis ≈ 2,92 USD/mes por suscriptor.

**Punto de equilibrio (suscriptores de pago):** ruta A ≈ 1, ruta B ≈ 5, ruta C ≈ 21 (≈ 38 si se amortiza LLC + marca en 12 meses).

**Cobro:** empezar con **Stripe Checkout + Customer Portal** (6,6 % y 4,1 % efectivos en mensual/anual a 9,99/59,99 USD). Migrar a un comerciante de registro (Stripe Managed Payments, +3,5 %, o Paddle, 5 % + 0,50 USD) cuando se acerquen los umbrales de ventas por estado (p. ej. 100.000 USD/año en Florida) o se venda fuera de EE. UU. **Lemon Squeezy queda descartado: su propia página dice que deja de aceptar altas y cierra el 31/03/2027.** Empezar como persona natural es posible en Stripe y Paddle; la LLC (125 USD de apertura en Florida + 138,75 USD/año) se justifica por la responsabilidad limitada, no por el cobro. **No publicar en tiendas al inicio**: PWA con cobro web (las tiendas cuestan 15 % + 99 USD/año en Apple).

**Tres incertidumbres principales (detalle en la sección 7):**
1. País de residencia del dueño y su acceso a Stripe (solo Brasil y México en Latinoamérica) o a un SSN/EIN: decide Stripe frente a Paddle o a una LLC de EE. UU.
2. Si el crédito de 100 USD de Max puede usarse para servir a clientes de pago: las condiciones de crédito no lo aclaran; la documentación habla de «construir tus propias aplicaciones».
3. Las hipótesis de uso, conversión y capacidad (mix de uso, 5 % de conversión, alumnos por servidor): son supuestos propios, no medidos; el coste de los usuarios gratis es la mayor palanca.

---

## 1. Qué cubren (y qué no) las suscripciones actuales, e IA gratuita/barata

### 1.1 Claude Max

| Pregunta | Respuesta verificada | Fuente (consulta 16/11/2026) |
|---|---|---|
| ¿Una suscripción de pago incluye la API? | No. La API se factura aparte; hace falta acceso a la Consola | support.claude.com/en/articles/9876003 |
| ¿Hay crédito de API con Max? | Sí: Max 100 USD/mes, Ultra 200 USD/mes, Team 20 USD por asiento estándar y 100 por asiento premium (conjunto, tope 500). Pro, Free y Enterprise no | platform.claude.com/docs/en/about-claude/api-credits-for-subscribers; support.claude.com/en/articles/17154008 |
| ¿Cómo se activa? | Settings > Billing en claude.ai > «Link organization» a una organización de la Consola; hay que llevar 7 días en el plan; no hace falta método de pago en la Consola; solo se puede vincular UNA organización y cambiarla exige soporte | misma página |
| ¿Qué cubre? | API Messages y Batches, Playground, Managed Agents y Agent SDK. NO cubre Claude Code ni uso extra de las apps, ni Bedrock/Vertex/Foundry | misma página |
| Caducidad y límites | No se acumula: lo no usado caduca al final del ciclo de facturación. Si se agota y no hay otros créditos, las peticiones fallan hasta el siguiente mes; nunca se cobra a tu plan. Los créditos no cambian tu nivel de uso: la organización sube como mínimo al nivel «Start» (tope de gasto 500 USD/mes; Haiku 5.5: 4.000 RPM, 2 M tokens de entrada/min, 400.000 de salida/min) | misma página; platform.claude.com/docs/en/api/rate-limits |
| Si cancelas Max | Dejan de llegar créditos nuevos; los ya recibidos duran hasta su caducidad | misma página |
| ¿Puede usarse el inicio de sesión/token de Max como backend de un producto para terceros? | **No.** «Anthropic no permite que desarrolladores terceros ofrezcan inicio de sesión de Claude.ai en sus aplicaciones ni enrutar peticiones con credenciales de Free, Pro, Max o Ultra en nombre de sus usuarios.» Quien construye un producto debe usar clave de API de la Consola. Los Términos de consumidor prohíben el acceso automatizado salvo con clave de API | code.claude.com/docs/en/legal-and-compliance; anthropic.com/legal/consumer-terms (vigentes desde 08/10/2025) |
| ¿Se puede servir a clientes con el crédito de 100 USD? | **No verificado.** La documentación dice que los créditos son «para construir tus propias apps y agentes en Claude Platform»; las condiciones de crédito (anthropic.com/legal/credit-terms) solo tratan caducidad e intransferibilidad y remiten al contrato general. Sí aplican los Términos comerciales y la Política de uso (incluida la de menores: informar de que hay IA, verificación de edad si se atiende a menores) | credit-terms; platform.claude.com docs |

Conclusión: usar el crédito de Max para pagar la API en producción es el camino «gratis» más barato, pero conviene pedir confirmación por escrito a soporte antes de depender de él, y presupuestar el pago con tarjeta como plan B (la organización de la Consola se puede recargar con tarjeta).

Precios de la API de Anthropic (platform.claude.com/docs/en/about-claude/pricing, consulta 16/11/2026; coincide con `09-verificacion-apis-y-costes.md`):

| Modelo | Entrada | Escritura caché 5 min | Lectura caché | Salida |
|---|---|---|---|---|
| Opus 5.5 | 4 | 5 | 0,20 | 20 |
| Sonnet 5.5 | 2 | 2,50 | 0,10 | 10 |
| Haiku 5.5 (≤100K tokens) | 0,10 | 0,125 | 0,01 | 0,50 |

(USD por millón de tokens; Batch = -50 %.) Con 100 USD de crédito: el coste solo de LLM por suscriptor medio es ≈ 0,41 USD/mes (sección 4.4), es decir, el crédito cubre el LLM de unos 240 suscriptores medios, sin contar la voz ni la pronunciación.

### 1.2 Gemini AI Pro y la API de Gemini

| Pregunta | Respuesta verificada | Fuente (consulta 16/11/2026) |
|---|---|---|
| ¿AI Pro incluye cuota de API? | No. «Los beneficios del plan para uso de desarrollador se aplican solo dentro de la interfaz web de Google AI Studio»; la API (claves, apps externas) se factura y gestiona aparte | aistudio.google.com/docs/google-ai-plans (antes ai.google.dev/gemini-api/docs/google-ai-plans) |
| ¿Créditos mensuales? | La página dice que los suscriptores con proyecto de Cloud y facturación activa pueden recibir créditos de Cloud mensuales del Google Developer Program, aplicables a servicios de Cloud, incluida la API Gemini; **la página no da el importe**. Un resumen de búsqueda habla de 10 USD/mes y un depósito previo de 5 USD, sin verificar en fuente oficial | misma página; ver sección 7 |
| Capa gratuita: ¿datos para entrenar? | Sí en todos los modelos con capa gratuita («Used to improve our products: Yes»); en capa de pago, No | aistudio.google.com/docs/pricing |
| Términos de servicios no pagados | Google usa lo enviado y las respuestas para mejorar productos; revisores humanos pueden leerlos (desvinculados de tu cuenta). Hay que tener 18+ y no se puede usar en productos dirigidos a menores o probables de ser usados por ellos. En EEE, Suiza y Reino Unido solo se pueden ofrecer clientes con servicios de pago | aistudio.google.com/docs/terms |
| Límites de la capa gratuita | La página de límites no lista cifras por modelo («consulta la página de AI Studio de tu proyecto»); el nivel de pago 1 exige facturación vinculada (tope 250 USD), nivel 2 exige 100 USD acumulados + 3 días (tope 2.000 USD). Los límites son por proyecto (RPM, TPM de entrada, RPD) | aistudio.google.com/docs/rate-limits |

Modelos y precios Gemini de interés (aistudio.google.com/docs/pricing, consulta 16/11/2026; USD por millón de tokens, nivel de pago estándar):

| Modelo | Entrada / salida | Nota |
|---|---|---|
| gemini-3.1-flash-lite | 0,25 / 1,50 (audio de entrada 0,50) | capa gratuita existe (con entrenamiento de datos) |
| gemini-3.5-flash-lite | 0,30 / 2,50 | idem |
| gemini-2.5-flash-lite | 0,10 / 0,40 | idem; el 01/12/2026 algunos 2.5 se redirigen a otros modelos |
| gemini-3.5-transcribe | 0,003 USD/min de audio entrada + 0,002 USD/min de texto salida | 0,005 USD/min en total frente a 0,0045 de `gpt-transcribe` (`09`): no es más barato |
| gemini-3.8-flash-lite-tts | 0,50 texto / 6,00 audio salida (hasta 31/12/2026; 1,00 / 12,00 desde 01/01/2027) | sube el precio en enero |

Conclusión: Gemini sirve como juez barato con datos sintéticos o como alternativa de pago; **no usar la capa gratuita con contenido de alumnos reales** (entrenamiento + revisión humana + exclusión de menores y de EEE/Reino Unido).

### 1.3 Otras capas gratuitas y baratas, y cuántos alumnos aguantan

Cálculos con los supuestos de `09-verificacion-apis-y-costes.md` §3.1: alumno activo = 20 días/mes, 1,5 Mesas/día (hablando 3,5 min por Mesa = 210 s), 30 frases de pronunciación de 5 s/día, Mesa = 20 turnos con ≈ 3.800 tokens de entrada y 230 de salida por turno.

| Servicio | Capa gratuita / precio verificado (fuente, consulta 16/11/2026) | ¿Cuántos alumnos aguanta? |
|---|---|---|
| Azure Speech F0 (pronunciación) | 5 h/mes de STT gratis, 1 petición concurrente (no ampliable); S0 = 1,00 USD/h (+0,30 con prosodia), 100 concurrentes ampliables. Fuentes: learn.microsoft.com/azure/ai-services/speech-service/speech-services-quotas-and-limits (ms.date 02/10/2026, actualizado 09/11/2026); `09` (página de precios de Azure + prices.azure.com). Una búsqueda sobre la página regional de Australia también muestra 5 h/mes; la página de EE. UU. no se pudo leer | 5 h = 18.000 s ÷ 5 s = 3.600 frases ÷ 30 frases/día = 120 alumnos-día ≈ **6 alumnos activos/mes**. Más allá se paga a 0,0417 USD por alumno-día |
| Azure cuenta gratuita | 200 USD de crédito durante 30 días y algunos servicios 12 meses (azure.microsoft.com/en-us/pricing/purchase-options/azure-account, vía búsqueda; la fecha de lectura es 16/11/2026) | Sirve para el primer mes de piloto |
| Groq gratis (Whisper) | whisper-large-v3: 20 RPM, 2.000 RPD, 7.200 s de audio/hora, 28.800 s/día; límites por organización (console.groq.com/docs/rate-limits) | 28.800 s ÷ (1,5 × 210 s) ≈ **91 alumnos-día** de STT. Términos de uso comercial/datos de la capa gratuita: **no verificados** |
| Groq gratis (LLM) | gpt-oss-120b: 30 RPM, 1.000 RPD, 8.000 TPM, 200.000 TPD (misma página) | 200.000 TPD ÷ ≈ 76.000 tokens por Mesa ≈ **2,6 Mesas/día en total**: inútil como motor; solo juez puntual |
| Gemini gratis | Sin cifras publicadas por modelo (ver 1.2); datos usados para entrenar | **No apto** para alumnos reales |
| Anthropic API | Sin capa gratuita propia; el crédito de Max son 100 USD/mes | LLM (Haiku turnos + Sonnet evaluación, ver 4.4) ≈ 0,41 USD por suscriptor medio → ≈ **240 suscriptores medios** (100 / 0,41); con alumnos «medios» de 0,51 USD de LLM cada uno ≈ 195; con «intensos» de 0,75 USD ≈ 133. Solo LLM: la voz y la pronunciación no entran en el crédito |
| Anthropic: límites de ritmo | Nivel «Start»: Haiku/Sonnet 5.5 4.000 RPM, 2 M ITPM (solo cuenta lo no cacheado), 400.000 OTPM | Una Mesa genera ≈ 2 peticiones/min: 4.000 RPM ≈ 2.000 Mesas simultáneas; el cuello de botella es otro (voz, servidor) |
| OpenAI (voz y transcripción) | Sin capa gratuita verificada; `gpt-transcribe` 0,0045 USD/min, TTS en `gpt-realtime-2.1-mini` (`09`) | Pago por uso desde el primer minuto |
| Azure TTS neural | 15 USD por millón de caracteres (learn.microsoft.com, página de cuotas) | 0,0405 USD por Mesa de 2.700 caracteres: más barato que el TTS de realtime-mini (0,0756 USD, `09`) |
| ElevenLabs | Capa gratuita solo uso NO comercial (`09`, terms act. 09/10/2026) | No usar al inicio |

---

## 2. Alojamiento, base de datos, dominio, correo, monitorización y copias

Hechos de la aplicación (repositorio): servidor Node 22 sin framework (`server/index.js`), dependencias `pg`, `ws` y `@anthropic-ai/sdk`; voz por WebSocket (`server/voice/realtime.js`); `README.md` exige disco persistente o PostgreSQL; el piloto actual (`PILOTO.md`) usa Render Free + Supabase Free.

### 2.1 Precios verificados

| Servicio | Plan y precio | Límites relevantes | Fuente y fecha |
|---|---|---|---|
| Render Free (web) | 0 USD | 750 h de instancia/mes por espacio de trabajo; se duerme tras 15 min sin tráfico y tarda ≈1 min en despertar; sistema de archivos efímero | render.com/docs/free, 16/11/2026 |
| Render Free (Postgres) | 0 USD | **Caduca a los 30 días** (14 días de gracia y luego se borra), 1 GB, sin copias | render.com/docs/free, 16/11/2026 |
| Render Starter (web, siempre encendido) | ≈ 7 USD/mes, 0,5 CPU, 512 MB (plan `0.5c-512mb`) | Sin dormir | Resultado de búsqueda sobre render.com/pricing y páginas /hosting; la propia página de precios no se dejó leer (ver sección 7) |
| Render espacio de trabajo | Hobby 0 USD (5 GB de ancho de banda incluido, 500 min de compilación); Pro 25 USD/mes (25 GB, 1.000 min); exceso de ancho de banda 0,15 USD/GB | | render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses (08/07/2026); render.com/changelog/updated-plans-for-render-workspaces (23/04/2026) |
| Render Postgres Basic-256mb | ≈ 6-7 USD/mes + 0,30 USD/GB de almacenamiento; Render calcula ≈ 13 USD/mes en total Starter + Basic-256mb (julio 2026) | Fuentes discrepan (6 frente a 7) | artículo de Render 08/07/2026 |
| Supabase Free | 0 USD: BD 500 MB, 50.000 MAU, 5 GB de salida, 1 GB archivos, 2 proyectos activos; **se pausa tras 1 semana de inactividad** | Copias en free: no indicadas en la página | supabase.com/pricing, 16/11/2026 |
| Supabase Pro | 25 USD/mes: crédito de cómputo de 10 USD (1 instancia Micro), 8 GB de disco (luego 0,125 USD/GB), 100.000 MAU, copias diarias 7 días, sin pausa; PITR +100 USD/mes | Tope de gasto activado por defecto | supabase.com/pricing, 16/11/2026 |
| Neon Free | 0 USD: 100 horas-CU/proyecto/mes, 1 GB por proyecto, 5 GB de salida, recuperación 6 h, apaga el cómputo a los 5 min (no se puede desactivar); Launch: 0,106 USD/hora-CU, 0,35 USD/GB-mes, restauración hasta 7 días | Si se agotan las horas, el cómputo se suspende hasta el siguiente periodo | neon.com/pricing (actualizada 04/11/2026) |
| Fly.io | Sin capa gratuita para organizaciones nuevas (1 USD de prueba 7 días); shared-cpu-1x 256 MB 2,19 USD/mes, 512 MB 3,69 USD, 1 GB 6,70 USD (Ashburn); volumen 0,15 USD/GB-mes; salida 0,02 USD/GB (Norteamérica); IPv4 dedicada 2 USD; Postgres gestionado desde 38 USD/mes | Postgres propio = tú lo administras | docs.fly.io/about/pricing, 16/11/2026 |
| Railway | Hobby 5 USD (incluye 5 USD de uso); memoria ≈ 10 USD/GB-mes, CPU ≈ 20 USD/vCPU-mes, volumen 0,15 USD/GB-mes, salida 0,05 USD/GB; plan Free con 1 USD/mes | Un servicio 0,5 GB + 0,5 vCPU encendido ≈ 15 USD/mes: más caro que Render Starter | railway.com/pricing, 16/11/2026 |
| Hetzner Cloud | CX23 (2 vCPU, 4 GB, 40 GB) desde 5,99 EUR/mes sin IVA en ubicaciones de la UE, 20 TB de tráfico; copias desde 1,098 EUR/mes; snapshots 0,0143 EUR/GB-mes; **ubicaciones de EE. UU. (Ashburn, Hillsboro) existen pero el precio por ubicación no se pudo confirmar** (una página muestra CPX11 en 17,99 EUR/mes y 1 TB de tráfico en EE. UU.) | Hay que administrar Linux, Node, Postgres, TLS y copias | hetzner.com/cloud/cost-optimized y /regular-performance, 16/11/2026 |
| Cloudflare Workers | Free 100.000 peticiones/día, 10 ms de CPU por invocación; de pago 5 USD/mes mínimos, 10 M de peticiones | No sirve para un servidor Node con `ws` + `pg` tal cual: habría que reescribir. Cloudflare Pages/Workers pueden servir el front estático | developers.cloudflare.com/workers/platform/pricing, 16/11/2026 |
| Cloudflare Tunnel | Gratis para el túnel (la documentación leída no lo indica; el `README.md` del proyecto dice que pide cuenta y dominio) | Depende de un PC encendido 24/7 | sin confirmar (sección 7) |
| Vercel / Netlify | Vercel Hobby 0 USD (100 GB de transferencia rápida), Pro 20 USD/asiento; Netlify Free 300 créditos, Personal 9 USD/mes | La página no indica si el plan gratuito permite uso comercial: no usar para producción de pago sin comprobar los términos. No hacen falta (el Node ya sirve el cliente) | vercel.com/pricing; netlify.com/pricing, 16/11/2026 |
| Oracle Cloud Always Free | Según la documentación (vía búsqueda): equivalente a 2 OCPU/12 GB de Ampere A1; instancias «inactivas» (percentil 95 de CPU/red/memoria <20 % durante 7 días) pueden ser reclamadas; Oracle puede retirar servicios de la lista gratuita | La página oficial dio 403 | docs.oracle.com (Always Free Resources), 16/11/2026 |
| Google Cloud Always Free | 1 instancia e2-micro en us-west1/us-central1/us-east1, 30 GB de disco estándar, **1 GB/mes de salida** | 1 GB de salida es insuficiente para voz | docs.cloud.google.com/free/docs/free-cloud-features, 16/11/2026 |
| Dominio | Porkbun .com 11,81 USD/año (registro y renovación), .app 14,93 USD (8,75 el primer año en oferta), .co 31,20 USD; WHOIS privado y reenvío de correo gratis. Cloudflare Registrar vende «a coste» sin recargo, sin precio .com legible en la página | | porkbun.com/products/domains; developers.cloudflare.com/registrar, 16/11/2026 |
| Resend | Free: 3.000 correos/mes, 100/día, 3 dominios; Pro 20 USD/mes (50.000) | | resend.com/pricing, 16/11/2026 |
| MailerSend | Free 500 correos/mes, 1 dominio; Hobby 7 USD/mes (5.000) | | mailersend.com/pricing, 16/11/2026 |
| Brevo | Plan gratuito con límite diario, transaccional y logotipo; cifras no legibles | | brevo.com/pricing, 16/11/2026 (sin cifras) |
| Sentry | Developer gratis: 5.000 errores/mes, 1 usuario; Team 26 USD/mes anual (29 mensual) | La página no dice si el plan gratuito excluye uso comercial | sentry.io/pricing, 16/11/2026 |
| UptimeRobot | Gratis: 50 monitores, intervalo de 5 min, **uso comercial permitido**; Solo 12 USD/mes anual | | uptimerobot.com/pricing, 16/11/2026 |

### 2.2 Las tres rutas

Capacidad en «alumnos activos» (≈ 12-20 días/mes): **estimación propia, no medida**. Base del cálculo: audio de una Mesa ≈ 1-3 MB entre voz y micrófono (SUPUESTO) → ≈ 100 MB por alumno/mes de salida; Azure S0 admite 100 peticiones concurrentes (verificado) y el pico simultáneo se supone 5-10 % de los activos.

| | **A) 0 USD absoluto** | **B) Mínima viable (≈ 8-14 USD/mes)** | **C) Recomendada para lanzar en serio (≈ 45-90 USD/mes)** |
|---|---|---|---|
| Servidor | Render Free (se duerme; ≈1 min de arranque en frío) | Render Starter ≈ 7 USD (siempre encendido) | Render Starter o instancia mayor (precio de instancias mayores no verificado) + espacio Hobby |
| Base de datos | Supabase Free (500 MB; se pausa con 1 semana sin uso) | Supabase Free o Render Postgres Basic-256mb ≈ 6-7 USD | **Supabase Pro 25 USD** (copias diarias 7 días, sin pausa) |
| Dominio / HTTPS | Subdominio `onrender.com` con HTTPS | .com 11,81 USD/año ≈ 0,98 USD/mes | igual |
| Correo | Resend Free (3.000/mes, 100/día) | igual | Resend Free; Pro 20 USD si >3.000/mes |
| Monitorización | Sentry Free + UptimeRobot Free | igual | + Sentry Team 26 USD (opcional) |
| Copias | Ninguna garantizada en Supabase Free: usar `npm run respaldar` (existe) a diario y guardar el volcado cifrado fuera | Ídem | Copias diarias de Supabase Pro + volcado propio |
| Legal/otros | Términos y privacidad con generador gratuito (ver 5) | ídem | Termly Starter 10 USD/mes (opcional) |
| **Coste fijo/mes** | **0 USD** | **≈ 8 USD** (Starter + dominio, con Supabase Free) a **≈ 14 USD** (con Render Postgres de pago) | **≈ 43 USD** (7 + 25 + 1 + 10) hasta **≈ 90 USD** con extras; para cálculos se usa **60 USD** |
| Capacidad (est.) | ≈ **5-20 alumnos activos**: la pronunciación con Azure F0 solo cubre ≈ 6; el ancho de banda de Render Hobby (5 GB) cubre ≈ 50 | ≈ **150-300** (ancho de banda Hobby 5 GB ≈ 50 alumnos; después 0,15 USD/GB ≈ 0,015 USD por alumno) | ≈ **500-1.500** (límite práctico: 100 concurrentes de Azure S0 ampliables y la CPU de la instancia; probar con carga) |
| Riesgos | Arranque en frío ≈1 min que daña la retención; pausa de Supabase; sin copias | Sin copias gestionadas si se usa Supabase Free | Coste fijo aunque no haya ingresos |
| Cuándo pasar a la siguiente | Primer cobro o más de ≈ 5 alumnos | >150 alumnos activos o primer cliente-restaurante | — |

Trucos permitidos para A: un monitor UptimeRobot cada 5 minutos mantiene despierto el servidor Render Free (744 h/mes < 750 h incluidas); hay que comprobar que Render no lo prohíba en sus términos (no verificado). El coste real de A no es cero a partir de ≈ 6 alumnos (Azure F0) y de ≈ 50 (ancho de banda), pero entonces ya hay ingresos para pagarlo.

Alternativa técnica barata no recomendada al inicio: VPS Hetzner en la UE (≈ 6 EUR + 1,10 EUR de copias): más barato que Render + Supabase Pro, pero latencia UE-Miami y trabajo de administración.

---

## 3. Cobro de suscripciones

### 3.1 Comparación de pasarelas (precios para suscripciones)

| Opción | Comisión verificada | Impuestos de venta | Cuenta de persona natural | Comisión efectiva a 9,99 USD / 59,99 USD (cálculo) | Fuente (consulta 16/11/2026) |
|---|---|---|---|---|---|
| **Stripe (Checkout + Billing + Customer Portal)** | 2,9 % + 0,30 USD tarjeta nacional EE. UU.; +1,5 % tarjetas internacionales; +1 % conversión; Billing 0,7 % pago por uso (plan mensual desde 620 USD solo para volúmenes altos); disputas 15 USD; sin cuotas mensuales | **Tú eres el vendedor**: Stripe Tax Basic 0,5 % (sin código) o 0,50 USD por transacción (API) donde estés registrado; Tax Complete desde 90 USD/mes | Sí: «Individual/Sole proprietor» con SSN o ITIN; si no hay ninguno Stripe puede pedir nacionalidad; el soporte pide SSN de los individuos asociados incluso con EIN | **6,6 % (0,66 USD) / 4,1 % (2,46 USD)** | stripe.com/pricing; support.stripe.com (sole proprietor) |
| **Stripe Managed Payments** (comerciante de registro) | **+3,5 %** sobre el importe total (incluidos impuestos) además de comisión de pago y Billing; Stripe gestiona IVA/sales tax en 80+ países, fraude y disputas | **Incluidos** | Países soportados: la sede del negocio debe estar en EE. UU., Canadá, la mayor parte de Europa, Australia, Hong Kong, Japón o Singapur; solo integraciones directas Checkout/Payment Links; revisión de elegibilidad; admite SaaS, software y cursos en línea; no admite servicios con intervención humana, Connect ni integraciones fiscales de terceros; clientes en 195 países salvo China, Cuba, Irán, Rusia, etc. | **10,1 % (1,01 USD) / 7,6 % (4,56 USD)** | stripe.com/pricing; docs.stripe.com/payments/managed-payments/eligibility |
| **Paddle** (comerciante de registro) | 5 % + 0,50 USD; sin cuotas mensuales; sin precio de pago de abonos publicado | **Incluidos** | Sí: no exige verificación de empresa a personas físicas; sí revisión del dominio (web viva, HTTPS, términos, reembolsos, privacidad) e identidad (puede pedir DNI y comprobante de domicilio). No encaja en servicios humanos | **10,0 % (1,00 USD) / 5,8 % (3,50 USD)** | paddle.com/pricing; paddle.com/help/start/account-verification |
| **Lemon Squeezy** | 5 % + 0,50 USD | Incluidos | — | — | **Su página indica: «ya no acepta altas y cerrará el 31/03/2027»; remite a Stripe Managed Payments. Descartado** (lemonsqueezy.com/pricing) |
| **PayPal** | 3,49 % + 0,49 USD (PayPal/Venmo); tarjeta 2,99 % + fijo; suscripciones 3,49 % + 0,49 USD; recargo internacional | Lo gestionas tú | Sí | **8,4 % (0,84 USD) / 4,3 % (2,58 USD)** con 3,49 % | paypal.com/us/business (resultados de búsqueda; la página dio 403) |
| **Mercado Pago** | Depende del país (p. ej. Colombia 3,29 % + 800 COP + IVA al instante; Argentina 1,49-6,99 % + IVA según plazo; México 3,50 % en Point; tasa de suscripciones de México no hallada) | Lo gestionas tú | Según país | No calculable | mercadopago.* (resultados de búsqueda) |

Fórmulas: Stripe directo = 2,9 % × P + 0,30 + 0,7 % × P; con Managed Payments = (2,9 % + 0,7 % + 3,5 %) × P + 0,30; Paddle = 5 % × P + 0,50; PayPal = 3,49 % × P + 0,49.

Notas: las comisiones de Stripe y Paddle son por cobro; el anual tiene la ventaja del importe fijo único (0,30 o 0,50 USD).

### 3.2 Tiendas de apps frente a PWA

| Concepto | Dato verificado | Fuente |
|---|---|---|
| Apple Developer Program | 99 USD/año; individuo o organización (la organización exige entidad legal, número D-U-N-S, web pública y correo corporativo; no acepta nombres comerciales ni DBA) | developer.apple.com/support/enrollment |
| Apple comisión | Small Business Program: 15 % sobre apps de pago y compras dentro de la app para desarrolladores con hasta 1 M USD de ingresos netos en el año anterior; tras superarlo se aplica la tarifa estándar. Reducción adicional (10 %) para suscripciones tras el primer año: **redacción ambigua** | developer.apple.com/app-store/small-business-program |
| Apple, cobro web en EE. UU. | Directriz 3.1.1(a): en la tienda de EE. UU. se pueden incluir botones y enlaces externos de compra sin entitlement; **no se confirmó si hay comisión sobre esas compras** | developer.apple.com/app-store/review/guidelines (por búsqueda) |
| Google Play | Registro único 25 USD (confirmado por la página de registro); en EE. UU. las suscripciones pagan 10 % + 5 % de facturación = 15 %; con facturación alternativa o enlaces externos (programa de EE. UU.) no se aplica el 5 %, y las tarifas del programa de enlaces externos empiezan a cobrarse el 01/10/2026 | support.google.com/googleplay/android-developer/answer/112622, /6112435, /10281818 |
| PWA | Sin cuenta de desarrollador, sin revisión y cobro directo web. En iOS no entra en la tienda sin envoltorio | — |

Recomendación: **lanzar solo como PWA con cobro web**. Empaquetar con Capacitor (iOS/Android) o TWA (Android) solo cuando haya demanda medida, porque (a) Apple cobra 99 USD/año + 15 %, (b) el pago dentro de la app de bienes digitales debe pasar por el sistema de la tienda salvo que se use el cauce de enlace externo de EE. UU., cuyas comisiones no están confirmadas.

### 3.3 Impuestos de venta y entidad legal

- Los impuestos de ventas en EE. UU. dependen del estado. Florida: tasa general 6 % más recargo de condado; los vendedores remotos deben cobrar cuando sus ventas gravables superan 100.000 USD en el año natural anterior (floridarevenue.com). Si el SaaS está gravado en Florida: **no verificado**; una Respuesta Técnica del propio Departamento (TAA 16A-014, 2016) concluyó que unas suscripciones de software en la nube no estaban sujetas en ese caso concreto, y otra de 2022 (22A-022) trató el acceso digital como no gravado; ambas valen solo para los hechos de cada consulta.
- Un comerciante de registro (Managed Payments, Paddle) elimina esa carga; cuesta la diferencia de comisión (≈ 3,5 puntos más en Stripe).
- **Stripe como persona natural**: posible con SSN/ITIN (o EIN). **Paddle**: posible sin verificación de empresa. **Apple**: posible como individuo (aparece tu nombre legal como vendedor). **Google Play**: cuenta personal con requisitos de prueba de aplicaciones antes de publicar.
- **LLC (Florida)**: 125 USD de apertura (100 USD de artículos + 25 USD de agente registrado), informe anual 138,75 USD (entre el 1 de enero y el 1 de mayo; 400 USD de recargo tardío); fuente dos.fl.gov/sunbiz (fecha de la página no visible; algunas copias tienen más de 3 años). **Stripe Atlas**: 500 USD, formación en Delaware (C-corp o LLC), agente registrado 100 USD/año desde el segundo año, EIN incluido; se puede solicitar desde cualquier país (stripe.com/atlas).
- La **LLC no es requisito para cobrar**; sirve para limitar la responsabilidad personal y separar finanzas. Si el dueño reside fuera de EE. UU., una LLC de EE. UU. añade trámite de EIN y impuestos propios de su país (no verificado).

### 3.4 Recomendación de cobro

1. **Ahora:** Stripe Checkout (hosted) + Customer Portal + webhook al servidor Node que marca `plan` y `plan_hasta` en PostgreSQL; el servidor comprueba el plan antes de cada llamada que cuesta IA y aplica el límite diario (ya existe en config). Sin guardar datos de tarjeta.
2. **Si el dueño no puede abrir Stripe en su país** (solo Brasil y México de Latinoamérica aparecen en stripe.com/global): Paddle (persona natural sin verificación de empresa) o una LLC con Stripe/Atlas.
3. **Migrar** a Managed Payments o Paddle cuando: (a) se acerque a 100.000 USD/año en un estado con umbral similar al de Florida, (b) se venda a clientes fuera de EE. UU., o (c) se quiera trasladar la carga fiscal. El coste: ≈ 3,5 puntos de comisión.
4. Mercado Pago y PayPal solo como métodos extra si los usuarios lo piden: sus tarifas son mayores en suscripciones pequeñas.

---

## 4. Modelo de precios

### 4.1 Referencias de competidores (precios de lista en USD)

| App | Datos | Fuente y fiabilidad |
|---|---|---|
| Babbel | 17,95 USD/mes (1 mes); 15,25 (3 meses); 13,45 (6 meses); **8,95 USD/mes en el plan de 12 meses = 107,40 USD/año**; vitalicio 299,99 USD | `05-babbel.md` y `09` (babbel.com/prices, consulta 16/11/2026) |
| Busuu | Premium 12 meses 72,99 USD (6,08/mes); Premium Plus 87,90 USD (7,33/mes; incluye conversación con IA y pronunciación) | `06-busuu.md` (busuu.com, consulta 16/11/2026) |
| Speak | Premium 83,99-99,99 USD/año; Premium Plus 164,99-234,99 USD/año; prueba de 7 días con método de pago; **dos páginas oficiales dan cifras distintas** (promoción frente a lista) | `02-speak.md`, `09` y búsqueda en speak.com y help.speak.com |
| ELSA Speak | Una página oficial antigua: 29,99 USD/año; promociones: 43,99 USD/año (antes 72,99), 7,99 USD/mes, vitalicio 89,99 USD; Premium 79,99-99,99 USD/año. **Sin tabla canónica** | `03-elsa-speak.md`, `09` y búsqueda en elsaspeak.com |
| Praktika | ≈ 8 USD/mes en anual (≈ 96 USD/año) y 14-15 USD/mes mensual, según su propio blog; plan de empresa con prueba de un mes para hasta 3 personas | praktika.ai/blog (autopromoción), `04-praktika.md` |
| Memrise | 24,99 USD/mes; 61,99 USD/año (5,17/mes); vitalicio 99 USD en oferta | `07-memrise-quizlet-anki.md` (consulta 16/11/2026) |
| Duolingo | Super: **no verificable** hoy (la página no se leyó); `01-duolingo.md` infiere 12,99 USD/mes, 83,99 USD/año, 119,99 USD familiar a partir de la lista de la App Store. Q3 2026: dejan de vender Max y pasan sus suscriptores a Super familiar | `01-duolingo.md`; investors.duolingo.com |

Cursos para trabajadores de restauración (búsqueda general, precios de proveedores, no comparables por duración):
- Curso en línea de inglés de hostelería: 399 USD pago único; curso de camarero: 19 USD y de personal de restaurante A1: 36,99 USD en plataformas de cursos.
- Formación para equipos: desde 80 EUR por alumno y mes en grupo (6-9 meses); 500 USD por empleado en un programa de una universidad comunitaria de EE. UU.; 850 EUR por 1-3 personas + 250 EUR por alumno adicional + 55 EUR de materiales (curso de 25 h en Malta).
- Tutoría: desde 3-5 USD por lección u hora en plataformas de tutores.

Capacidad de pago: el salario mediano de camareros en EE. UU. es 16,94 USD/hora y 35.230 USD/año (BLS, datos de 2025; bls.gov/ooh/food-preparation-and-serving/waiters-and-waitresses.htm; 2,28 millones de empleos). Una suscripción de 9,99 USD/mes equivale a ≈ 0,6 horas de salario; 59,99 USD/año a ≈ 3,5 horas. No se verificó el ingreso con propinas en Miami Beach ni el porcentaje de hispanohablantes.

### 4.2 Planes propuestos

| Plan | Precio | Qué incluye | Notas |
|---|---|---|---|
| **Gratis** | 0 | Aprender (lecciones estáticas, sin coste de IA), 1 Mesa por semana, 5 frases de pronunciación al día, repaso diario básico | Tope duro por usuario para limitar el coste (sección 4.4) |
| **Prueba** | 7 días de Premium; con tope de 10 Mesas | Sin tarjeta al inicio (menos fricción para camareros sin tarjeta); probar después tarjeta por adelantado | Coste máximo de la prueba ≈ 10 × 0,0802 + 7 × 0,0558 ≈ 1,19 USD |
| **Premium mensual** | **9,99 USD/mes** | Mesas y pronunciación sin tope diario salvo límite de uso razonable (p. ej. 40 Mesas/mes), voz, ranking | Ancla de precio: Memrise 24,99; Babbel 1 mes 17,95 |
| **Premium anual** | **59,99 USD/año** (5,00 USD/mes, -50 % frente a 12 meses de mensual) | Igual | Entre Memrise (61,99) y Busuu (72,99); bajo Babbel (107,40) y Speak (83,99-99,99) |
| **Fundadores** (oferta limitada) | 39,99 USD el primer año, primeros 100 | Igual | Entrada de caja inmediata y reseñas; precio normal después (táctica, no probada) |
| **Restaurante** | **8 USD por asiento y mes** (mín. 5 asientos = 40 USD/mes) o **80 USD/asiento/año** | Premium para cada empleado, panel del dueño/gerente (progreso, ranking del equipo), **menú propio del restaurante** convertido en escenarios (una vez; coste único de IA < 1 USD con Sonnet 5.5: 50 platos × 1.500 tokens = 75.000 tokens × 10 USD/M = 0,75 USD) | Referencia de mercado: 80-250 EUR por alumno/mes en cursos grupales y 500 USD por empleado en formación local; el precio por asiento es muy inferior |

Variantes a probar con A/B: 7,99 USD/mes y 49,99 USD/año; cobro semanal (2,99 USD/semana) pensando en ingresos con propinas (idea, sin evidencia).

### 4.3 Coste de IA por suscriptor (base verificada en `09`)

Configuración propuesta **(b')**: Haiku 5.5 para los turnos del cliente + Sonnet 5.5 para la evaluación + **voz Azure neural** (en lugar de realtime-mini) + `gpt-transcribe` + Azure Pronunciation con prosodia. Es una variante de la configuración (b) de `09` que cambia solo el motor de voz; requiere la prueba A/B de voz recomendada allí. Haiku manteniendo el personaje y el nivel durante 10 turnos tampoco está probado.

Coste de una Mesa de 10 min, con los componentes de `09` §3.3:
- LLM = turnos Haiku 0,0057 + evaluación Sonnet 0,0182 = **0,0239 USD**
- Voz Azure neural = 2.700 caracteres × 15 / 1.000.000 = **0,0405 USD**
- STT = 3,5 min × 0,0045 = **0,0158 USD**
- **Total por Mesa = 0,0802 USD**

Coste fijo por día activo = pronunciación con prosodia 0,0542 + repasos con Haiku 0,0016 = **0,0558 USD** (30 frases de 5 s: 150 s ÷ 3.600 × 1,30 = 0,0542 USD).

Fórmula mensual: **C(m,d) = m × 0,0802 + d × 0,0558**, con m = Mesas al mes y d = días activos.

| Perfil | Mesas/mes (m) | Días (d) | Coste/mes | del cual LLM |
|---|---|---|---|---|
| Ligero (60 % de los suscriptores, SUPUESTO) | 12 | 12 | **1,63** | 0,31 |
| Medio (30 %) | 20 | 20 | **2,72** | 0,51 |
| Intenso (10 %) | 30 | 20 | **3,52** | 0,75 |
| **Mezcla ponderada** | | | **0,6 × 1,63 + 0,3 × 2,72 + 0,1 × 3,52 = 2,15** | **0,41** |

Con realtime-mini como voz (configuración (b) literal) el coste por Mesa sube a 0,115 USD y la mezcla a ≈ 3,0 USD.

**Coste del usuario gratuito**: SUPUESTO 25 % de los registrados gratis activos cada mes; usuario activo: 4 Mesas × 0,063 (config (a): Haiku evaluación 0,0015, sin Sonnet) + 10 días × 5 frases × 5 s ≈ 0,07 → ≈ 0,32 USD; por registrado ≈ **0,10 USD/mes**. Con conversión 5 % hay 19-20 gratuitos por cada suscriptor: **2,00 USD por suscriptor**. Esto es la mayor palanca de coste: sin topes, el plan gratuito puede consumir casi todo el margen.

### 4.4 Márgenes y equilibrio

**Ingreso medio por suscriptor (SUPUESTO 50 % mensual, 50 % anual):** ARPU = 0,5 × 9,99 + 0,5 × (59,99 / 12) = **7,50 USD/mes**.

**Comisión media (Stripe directo):** mensual 0,029 × 9,99 + 0,30 + 0,007 × 9,99 = 0,66; anual (0,029 × 59,99 + 0,30 + 0,007 × 59,99)/12 = 0,205; media = **0,43 USD/mes**. Con Managed Payments: media ≈ **0,70 USD**.

**Margen bruto** = (ARPU - comisión - coste IA) / ARPU = (7,50 - 0,43 - 2,15) / 7,50 = **65,6 %** (62,3 % con Managed Payments).

**Contribución por suscriptor**: m = ARPU - comisión - coste IA - coste gratis = 7,50 - 0,43 - 2,15 - 2,00 = **2,92 USD/mes** (2,65 con Managed Payments). Con todos los suscriptores «intensos»: 7,50 - 0,43 - 3,52 - 2,00 = 1,55 USD.

**Margen por asiento Restaurante (a 8 USD):** comisión de un cobro de 40 USD = 0,029 × 40 + 0,30 + 0,007 × 40 = 1,74 USD → 0,35 USD/asiento; IA SUPUESTA 2,50 USD → 8 - 0,35 - 2,50 = **5,15 USD (64 %)**.

**Punto de equilibrio**: N = F / m, donde F = costes fijos mensuales.

| Ruta | F | N = F / 2,92 | Si todos intensos (m = 1,55) |
|---|---|---|---|
| A | ≈ 1 USD (dominio opcional) | **1** | 1 |
| B | 14 USD (techo del rango 8-14) | 14 / 2,92 = 4,8 → **5** | 9 |
| C | 60 USD | 60 / 2,92 = 20,5 → **21** | 39 |
| C + legal amortizado en 12 meses | 60 + (125 + 138,75 + 350) / 12 = 60 + 51 = 111 | 111 / 2,92 = 38,0 → **38** | 72 |

(La línea legal incluye una LLC de Florida: 125 USD de apertura y 138,75 USD de informe anual, y una clase de marca en USPTO a 350 USD; no incluye honorarios de abogado, desconocidos.)

**Valor del cliente:** LTV = m / c, con c = abandono mensual. Con c = 10 % (SUPUESTO): LTV = 2,92 / 0,10 = 29,2 USD; un coste de adquisición razonable ≤ LTV / 3 ≈ 9,7 USD.

**Escenarios (SUPUESTOS: conversión 5 %, 50/50 de planes, mezcla de uso de 4.3):**

| | Mes 0 | Mes 3 | Mes 12 |
|---|---|---|---|
| Suscriptores de pago / registrados gratis | 0 / ≈ 5-20 (piloto) | 15 / 285 | 150 / 2.850 |
| Ruta | A | B (Starter 7 + dominio 1 = 8) | C (60) |
| Ingresos | 0 | 15 × 7,50 = 112,50 | 150 × 7,50 = 1.125 |
| Comisiones (0,43 × N) | 0 | 6,45 | 64,95 |
| IA de pago (2,15 × N) | ≈ 6 (5 alumnos, solo voz y STT de OpenAI) | 32,25 | 322,50 |
| Usuarios gratis (0,10 × registrados) | ≈ 0 | 28,50 | 285,00 |
| Fijo | 0 (+ 11,81 USD/año de dominio) | 8 | 60 |
| **Coste total** | **≈ 6 (a 18 con dominio)** | **≈ 75,20** | **≈ 732,45** |
| **Resultado** | -6 a -18 | **+37,30** | **+392,55** |

Si el crédito de 100 USD de Max se puede usar: restar el LLM de pago (≈ 0,41 × suscriptores + LLM gratis) hasta 100 USD/mes: en el mes 12 sube el resultado en ≈ 62-80 USD. No se incluye en la tabla porque su uso comercial no está confirmado y deja de llegar si se cancela Max.

### 4.5 Conversión y reducción de abandono

- **Descuento anual** (50 %) y precio ancla mensual: empuja al anual (importe fijo único de comisión menor, retención de 12 meses).
- **Prueba de 7 días** (Speak usa 7 días con método de pago); limitar la prueba a 10 Mesas para acotar el coste a ≈ 1,2 USD.
- **Recordatorios** de racha, repaso diario y aviso antes de la renovación anual (también ayuda a cumplir leyes de renovación automática; consultar con abogado). Notificaciones push de la PWA: no verificadas para iOS.
- **Flujo de cancelación en un clic** (Customer Portal) con encuesta, pausa de 1 mes y oferta de bajar a plan gratuito; la FTC retiró su regla de «cancelar con un clic» pero ROSCA y las leyes estatales siguen vigentes (ftc.gov, notas de 2026; detalle no verificado).
- **Reintentos de cobro** y avisos de tarjeta caducada (Stripe Billing): activar y medir; la función exacta no se verificó.
- **Plan Restaurante** (compra del dueño) reduce abandono individual: la mejor retención suele estar en equipos con ranking interno (hipótesis).
- **Fundadores** para caja inicial y reseñas.
- Medir: conversión a pago, abandono mensual, coste de IA por usuario y por Mesa con `response.usage` (ya recomendado en `09`).

---

## 5. Costes legales mínimos

| Concepto | Dato | Fuente (consulta 16/11/2026) |
|---|---|---|
| Marca en USPTO | Solicitud base 350 USD por clase (estructura vigente desde enero de 2025; recargos de 100 USD por solicitud incompleta y 200 USD por descripción de texto libre; la declaración de uso de una solicitud 1(b) cuesta 150 USD por clase). Clases probables: 41 (educación) y 9/42 (software/SaaS): 350-700 USD | uspto.gov/trademarks/trademark-fee-information (por búsqueda; una URL directa dio 404) |
| Disponibilidad de ENGLISH47 | Dominios: consulta RDAP del registro el 16/11/2026 → `english47.com` y `english47.net` (Verisign) y `english47.app` (registro de Google) **devuelven «no encontrado», es decir, no figuran registrados**; `.co` y `.io` no se pudieron comprobar. Marca: la base de datos de USPTO (TMSearch, con JavaScript) **no se pudo consultar**; una búsqueda web no halló ninguna marca ENGLISH47 pero encontró marcas parecidas (ENGLISH52, ENGLISH APP, APP47) en otras clases. Esto **no sustituye** a una búsqueda formal. «ENGLISH» es descriptivo en servicios de enseñanza del idioma y podría requerir descargo; lo debe valorar un abogado | RDAP; búsquedas web |
| Constitución | LLC Florida 125 USD + 138,75 USD/año (ver 3.3). Atlas 500 USD | dos.fl.gov; stripe.com/atlas |
| Seguro | Medias publicadas por un corredor: responsabilidad civil general 40 USD/mes, E&O tecnológico 121 USD/mes, ciber 186 USD/mes (≈ 347 USD/mes en conjunto, cifra de suma propia); otro corredor ofrece ciber y responsabilidad civil desde 30 USD/mes cada uno. Son medias comerciales, no presupuestos | insureon.com (páginas de costes), hiscox.com |
| Generadores | Termly: plan gratuito con 1 política legal y banner de consentimiento hasta 10.000 visitas/mes; Starter 10 USD/mes por sitio (anual; 14 mensual) con 2 políticas; Pro+ 15 USD/mes. Según su página de productos (por búsqueda) | termly.io/products |

**Documentos mínimos antes de cobrar:** Términos del servicio (con limitación de responsabilidad, renovación automática, no es consejo profesional ni oferta de empleo), Política de privacidad (voz, texto, progreso, proveedores: Anthropic, OpenAI, Azure, Stripe), Política de reembolsos (Paddle exige términos, reembolsos y privacidad visibles para aprobar el dominio), aviso de uso de IA (Anthropic lo exige en productos con IA para menores y es buena práctica en general) y edad mínima. **Edad: fijar 18+**: la API de Gemini en capa gratuita y ElevenLabs excluyen a menores de 18, Anthropic pide medidas adicionales para menores y COPPA aplica a menores de 13.

**Generadores gratuitos aceptables (con revisión):** Termly (gratis solo 1 política) y plantillas de código abierto sirven para empezar; no son asesoría legal. **Debe revisarlos un abogado**: renovación automática y cancelación (leyes estatales como la de California y la de Florida; no verificadas aquí), tratamiento de grabaciones de voz y posible aplicación de leyes biométricas (por ejemplo la de Illinois; no verificada), CCPA/CPRA si se supera algún umbral (no verificado), condiciones del plan Restaurante cuando un empleador paga por empleados y ve su progreso (privacidad laboral), impuestos de venta, y la solicitud de marca (riesgo de descriptividad). El coste de abogado no se pudo estimar: pedir presupuesto cerrado (SUPUESTO: unos cientos de USD por revisar términos y privacidad; sin verificar).

Orden de prioridad por coste: (1) términos, privacidad y reembolso (0-10 USD/mes), (2) dominio, (3) LLC cuando haya ingresos, (4) marca, (5) seguro cuando haya clientes-restaurante o más de ≈ 100 suscriptores.

---

## 6. Plan de ejecución por hitos (resumen)

1. **Esta semana, 0 USD:** vincular organización de la Consola con Max (si ya han pasado 7 días de plan; confirmar el crédito) y crear la clave de API de producción con límite de gasto por espacio de trabajo; mantener Render Free + Supabase Free para el piloto de ≤5 alumnos; cuenta Azure F0.
2. **Cuando haya primeros ingresos o ≥5 alumnos:** dominio .com (11,81 USD/año), Render Starter (7 USD), Stripe Checkout + Portal, términos/privacidad/reembolsos.
3. **≈ 15-20 suscriptores:** Supabase Pro (25 USD) con copias; volcado propio; informes de coste por Mesa con datos reales.
4. **≈ 100+ suscriptores o el primer restaurante:** LLC, marca (clase 41), seguro, Managed Payments/Paddle, plan Restaurante.
5. **Después:** valorar tiendas (Capacitor/TWA) según demanda medida.

---

## 7. Lo que no pude verificar

1. **País de residencia del dueño** y cuenta de Stripe/SSN/EIN: decide Stripe frente a Paddle frente a LLC. Stripe solo lista Brasil y México en Latinoamérica.
2. **Uso comercial del crédito de Max** para servir a clientes de pago: las condiciones de crédito no lo tratan; hay que preguntar a soporte. Tampoco se verificó el precio de la suscripción Max.
3. **Importe real y condiciones de los créditos de Cloud de AI Pro** (10 USD y depósito de 5 USD solo aparecen en un resumen de búsqueda, no en la página oficial leída).
4. **Límites numéricos de la capa gratuita de Gemini** por modelo (la página remite al panel de cada proyecto) y términos de uso comercial/datos de **Groq** gratuito.
5. **Precio de Render Starter** (~7 USD) y de Postgres Basic-256mb (6-7 USD; las fuentes discrepan): la página de precios de Render no se dejó leer; los datos salen de resultados de búsqueda de render.com y de dos artículos de Render. Precios de instancias mayores no verificados. Tampoco si Render permite los pings de UptimeRobot para evitar el sueño.
6. **Copias en Supabase Free** (no se indica en la página), tarifa de ancho de banda real de la voz (el ≈100 MB/alumno es un supuesto) y capacidad real de los servidores (todos los números de alumnos por ruta son estimaciones propias que requieren una prueba de carga).
7. **Hetzner en EE. UU.** (precio por ubicación) y tipo de cambio EUR/USD. **Cloudflare Tunnel** (gratuidad y requisitos) y precio .com de Cloudflare Registrar. **Oracle Always Free** (página oficial con 403; datos vía documentación por búsqueda). **Vercel/Netlify** (si el plan gratuito permite uso comercial).
8. **Precios actuales de Duolingo Super** (página no legible), **ELSA** (sin tabla canónica; 29,99 a 99,99 USD según la página), **Speak** (dos páginas oficiales con cifras distintas) y **Praktika** (solo su propio blog). Busuu y Memrise provienen de las notas 06 y 07 (consulta 16/11/2026).
9. **Cuenta de comisión de Stripe Billing en modo Checkout** (se asumió el 0,7 % de Billing) y compatibilidad del Customer Portal con Managed Payments; función de reintentos de cobro; precio de Stripe Tax en cada caso.
10. **Impuesto de venta del SaaS por estado** (solo se dispone del umbral de 100.000 USD de Florida y de resoluciones antiguas de ese estado, que valen para casos concretos).
11. **Comisión de Apple en compras web desde la app en EE. UU.**, y la reducción del 10 % para suscripciones de segundo año (redacción ambigua).
12. **Disponibilidad de la marca ENGLISH47 en USPTO** (TMSearch inaccesible) y dominios .co/.io; los .com/.net/.app figuran libres a 16/11/2026 pero hay que confirmarlo al comprar.
13. **Coste de abogado**, cifras de seguros (solo medias comerciales), y leyes aplicables (renovación automática estatal, biometría, CCPA, COPPA): no verificadas, solo señaladas para revisión.
14. **Supuestos de negocio** (mezcla 60/30/10 de uso, conversión del 5 %, abandono del 10 %, 25 % de gratuitos activos, 2,50 USD de IA por asiento de Restaurante): propios, sin datos reales. Que Haiku 5.5 y la voz Azure neural den calidad suficiente tampoco está probado (ver pruebas A/B en `09`).

---

## 8. Fuentes consultadas (todas el 16/11/2026 salvo que se indique)

- Anthropic: support.claude.com/en/articles/9876003 y /17154008; platform.claude.com/docs/en/about-claude/api-credits-for-subscribers, /pricing y /api/rate-limits; anthropic.com/legal/consumer-terms (08/10/2025) y /credit-terms; code.claude.com/docs/en/legal-and-compliance.
- Google: aistudio.google.com/docs/pricing, /rate-limits, /terms, /google-ai-plans (antes ai.google.dev); docs.cloud.google.com/free/docs/free-cloud-features.
- Groq: console.groq.com/docs/rate-limits.
- Microsoft: learn.microsoft.com/azure/ai-services/speech-service/speech-services-quotas-and-limits (02/10/2026); azure.microsoft.com (cuenta gratuita, por búsqueda).
- Alojamiento: render.com/docs/free; render.com/articles/how-much-does-cloud-application-hosting-cost-for-small-businesses (08/07/2026); render.com/changelog/updated-plans-for-render-workspaces (23/04/2026); docs.fly.io/about/pricing; railway.com/pricing; hetzner.com/cloud; developers.cloudflare.com/workers/platform/pricing; supabase.com/pricing; neon.com/pricing (04/11/2026); vercel.com/pricing; netlify.com/pricing; docs.oracle.com (Always Free).
- Dominios/correo/monitoreo: porkbun.com/products/domains; developers.cloudflare.com/registrar; resend.com/pricing; mailersend.com/pricing; brevo.com/pricing; sentry.io/pricing; uptimerobot.com/pricing.
- Cobro: stripe.com/pricing, /managed-payments, /atlas, /global; docs.stripe.com/payments/managed-payments (y /eligibility); support.stripe.com (sole proprietor, managed payments pricing); lemonsqueezy.com/pricing; paddle.com/pricing y paddle.com/help/start/account-verification; paypal.com/us/business; mercadopago.* (por búsqueda).
- Tiendas: developer.apple.com/app-store/small-business-program, /support/enrollment, /app-store/review/guidelines; support.google.com/googleplay/android-developer (answer 112622, 6112435, 10281818).
- Legal/administrativo: floridarevenue.com; dos.fl.gov/sunbiz (tarifas LLC); uspto.gov (tarifas de marcas); ftc.gov (regla de opción negativa); termly.io/products; insureon.com y hiscox.com (costes); bls.gov (camareros).
- Competidores: notas `docs/reforma/investigacion/01-duolingo.md` a `07-memrise-quizlet-anki.md` y `09-verificacion-apis-y-costes.md`; speak.com, help.speak.com, elsaspeak.com, praktika.ai (búsquedas en dominios oficiales).
- Dominios: consultas RDAP de Verisign y del registro `.app` (16/11/2026).
