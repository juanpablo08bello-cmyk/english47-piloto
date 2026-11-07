# ENGLISH47

Versión 0.4.0. Para preparar el piloto gratuito desde el celular empieza con [PILOTO.md](PILOTO.md).

Práctica privada de inglés de servicio para hasta cinco meseros hispanohablantes en Miami Beach. Web móvil instalable (iPhone y Android), con cuentas por invitación y progreso en el servidor.

## Arranque

Requiere Node.js 22.13 o superior.

```bash
npm install
npm start
npm test
```

Al primer arranque, la consola muestra un enlace de un solo uso para crear la cuenta de administración (también queda en `data/primer-administrador.txt`). Desde **Administración** se crean las invitaciones de alumnos. No existe registro público.

## Invitar al primer alumno

1. Entra con la cuenta de administración → **Perfil** → **Administración**.
2. En **Invitar**, escribe para quién es y toca **Crear invitación**.
3. Copia el enlace y envíalo por un canal privado. Sirve una vez, vence en 7 días y solo se muestra entonces.

Hay un máximo de siete alumnos. Pásale también [PARA_EL_PRIMO.md](PARA_EL_PRIMO.md). Sus comentarios llegan a **Administración → Comentarios**.

Los enlaces usan la dirección desde la que abriste Administración: créalos desde la dirección pública, no desde `localhost`.

## Publicar para el piloto

**Todavía no hay una dirección permanente.** Abrirla necesita un equipo o servidor siempre encendido, y eso es una decisión tuya. Requisitos:

- Node.js 22.13 o superior.
- Disco persistente para `data/`. Un alojamiento que borre el disco al reiniciar perdería todo el progreso.
- **https**: sin ella, el micrófono no funciona en celulares. Define `COOKIE_SECURE=true` en `.env`.

Una vía sin servidor de pago es dejar un equipo propio encendido, ejecutar `npm start` y exponerlo con un túnel con nombre (por ejemplo Cloudflare Tunnel, que pide cuenta y dominio). Un túnel rápido cambia de dirección al reiniciarse: solo sirve para una prueba puntual. Verifica condiciones y precios vigentes antes de elegir.

Para actualizar: detén el servidor, respalda, reemplaza el código sin tocar `data/`, y arranca. La página abierta ofrecerá recargar.

## Respaldo y restauración

```bash
npm run respaldar
```

Crea una copia en `respaldos/`. Para restaurar: detén el servidor, borra `data/english47.db`, `data/english47.db-wal` y `data/english47.db-shm`, copia el respaldo como `data/english47.db` y arranca. Si el respaldo es de una versión anterior, se migra solo.

Las migraciones también dejan una copia automática en `data/`. **Todas las copias conservan los datos tal como estaban, citas incluidas**: guárdalas en privado, bórralas cuando ya no hagan falta y nunca las incluyas en un entregable.

## Arquitectura

| Parte | Elección | Motivo |
|---|---|---|
| Servidor | Node sin framework (`server/`) | Pocas piezas que mantener |
| Datos | SQLite incluido en Node (`node:sqlite`) | Sin servicio externo; basta para 7 alumnos en un servidor |
| Interfaz | JavaScript sin compilación (`public/`) | Un solo despliegue |
| Contenido | Archivos en `content/` | El catálogo no depende de IA y se sirve por páginas. Para un menú real, sustituye `content/menu.js` |

## Prueba de voz (versión 0.3.2)

En **Hablar → Probar mi micrófono y las voces** puedes escuchar frases de restaurante, grabarte y escucharte localmente. El botón de transcripción solo se habilita cuando el servidor tiene ese servicio configurado. Enviar audio es una acción explícita y no afecta rachas ni XP. En las mesas se revisa y puede editarse toda transcripción antes de enviarla.

Detalles, límites y pruebas pendientes: [VOZ.md](VOZ.md).

## Conectar la voz real

La app separa cuatro capacidades, cada una con su estado visible en **Administración**:

| Capacidad | Adaptador incluido | Variable | Sin credencial |
|---|---|---|---|
| Cliente y evaluador IA (separados) | Anthropic | `ANTHROPIC_API_KEY` | Demo con guion, rotulada |
| Transcripción de voz | API de audio de OpenAI | `OPENAI_API_KEY` | Respuesta por texto u opciones |
| Voz del cliente | OpenAI Realtime (servidor) | `OPENAI_API_KEY` | Voz del dispositivo |
| Evaluación de pronunciación | Ninguno | | Se indica «no evaluada» |

Pasos:

1. Aprueba un presupuesto y elige proveedores. **No se contrató nada.** Las tarifas se verifican en la página oficial de cada proveedor; el proyecto no incluye precios supuestos.
2. Crea cuentas de API. Una suscripción de chat no cubre estas llamadas.
3. Copia `.env.example` como `.env` y añade las claves. Ajusta límites y tarifas.
4. Sirve la app por **https**: los celulares no permiten el micrófono sin una conexión segura.
5. Haz el piloto de siete días en iPhone y Android: consumo, latencia, comprensión de acentos y utilidad de la corrección.

Para otro proveedor, escribe un adaptador con la misma forma en `server/voice/providers.js` y regístralo en `server/voice/index.js`. Modelos configurables en `.env`.

Los modelos `gpt-4o-mini-tts`, `tts-1` y `tts-1-hd` tienen apagado anunciado para el 6 de enero de 2027 según la documentación oficial consultada en noviembre de 2026. Esta versión ya usa `gpt-realtime-2.1-mini` mediante WebSocket en el servidor; los nombres antiguos de TTS_MODEL se migran automáticamente al cargar configuración. Ver VOZ.md.

## Reglas de progreso

- **Fecha:** la jornada usa la fecha local de finalización, por zona IANA (`America/New_York` por defecto, configurable).
- **Jornada válida:** tres repasos y una respuesta contextual. Abrir la app o escuchar audio no cuenta.
- **XP:** 10 por lección (una vez por lección), 10 por repaso diario y por el bloque «Aprender» (una vez al día). Por simulación: 20 si se recorre la escena con respuestas relacionadas y 5 si se intenta y se deja antes, una vez por escenario y día. Respuestas sin sentido: 0.
- **Estados de una simulación:** intentado, completado, resuelto (criterio crítico y al menos 70 % de los criterios) y para reforzar. Equivocarse da esfuerzo, no dominio. Solo cuenta para la racha la práctica activa y relacionada.
- **Monedas:** 20 por día válido, más 50 por cada bloque de 7 días realmente practicados.
- **Protector:** 60 monedas, máximo 2. Se aplica solo, uno por día perdido. Si no alcanzan para todo el hueco, no se gasta ninguno. No suma días practicados.
- **Repaso:** a 1, 3, 7, 14 y 30 días. Un fallo lo adelanta a mañana.

## Privacidad

- Las grabaciones nunca se guardan. No hay almacenamiento de audio en la base de datos.
- Sin permiso, el texto de la conversación se borra al terminar y los resúmenes guardados no llevan citas del alumno. Las citas se muestran solo en la pantalla de resumen de ese momento. Una simulación abandonada se cierra y borra sus turnos a las 24 horas.
- Desde Perfil se pueden quitar las citas guardadas, conservando resultados, o borrar todo el historial de conversaciones.
- La administración ve plazas, invitaciones y consumo; no ve conversaciones.
- Las claves solo existen en el servidor.

## Evaluación de respuestas

`server/evaluate.js` no usa IA y funciona sin claves. Las preguntas cerradas usan reglas deterministas. Las respuestas libres separan significado, gramática, cortesía y objetivo de servicio, por palabras completas y revisando cada afirmación por separado. `server/order.js` comprueba las órdenes con una estructura: cada dato con su plato y el estado final. Si las reglas no alcanzan, el resultado es «Necesita revisión»: no afirma que esté bien ni mal, y no cuenta como fallo en el repaso.

En el catálogo, `alts` solo contiene variantes intercambiables. `related`, `examples` y `contrasts` guardan lo demás (`content/vocab/audit.js`). Repetir una petición devuelve el resultado registrado; un reintento debe ser explícito y traer una respuesta distinta.

En una simulación con IA conectada, el resumen usa el evaluador de IA y lo indica en pantalla. Nada evalúa pronunciación.

## Migración de datos

Detalle por versión en [CHANGELOG.md](CHANGELOG.md). La base usa `PRAGMA user_version`. Al arrancar con una base anterior:

1. Guarda una copia junto a ella: `english47.db.respaldo-v<versión>-<fecha>`.
2. Añade columnas (expresiones al día, origen del punto de partida, resultado de simulación, marca de citas, último puntaje de lección). No borra nada.
3. Clasifica las simulaciones antiguas según sus criterios guardados. Las que no tienen resumen quedan como *intentado*. La XP y las monedas ya pagadas no se tocan.
4. Las citas de resúmenes antiguos se ocultan si el alumno no dio permiso, pero siguen guardadas hasta que elija «Quitar las citas guardadas» en Perfil.

**La copia de seguridad conserva los datos tal como estaban, citas incluidas.** Cuando confirmes que la migración fue bien, bórrala de `data/`. No la publiques ni la incluyas en un entregable.

## Revisión del contenido

`npm test` valida identificadores únicos, campos completos, referencias, duplicados exactos, que cada expresión aparezca en su frase, que ninguna respuesta del catálogo prometa seguridad o compensaciones, y que las respuestas modelo pasen el evaluador.

Alcance de la revisión: Claude auditó una por una las alternativas de las 636 entradas, y leyó una muestra de 66 entradas completas, 3 por categoría (`node scripts/muestra-linguistica.js 3`). El resto solo pasó las validaciones automáticas. Ninguna persona nativa ni un mesero ha revisado el contenido: conviene hacerlo durante el piloto. Las palabras se identifican por `id`, así que corregir un texto conserva favoritas y progreso.
