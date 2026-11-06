# ENGLISH47 · piloto 0.5.0

Cada alumno entra con su propia invitación. Las claves se guardan solo en el panel de cada proveedor.

## Servicios

| Servicio | Para qué | Plan |
|---|---|---|
| Render | Mantiene la app en línea | Free: se duerme sin visitas y tarda cerca de un minuto en despertar |
| Supabase | Cuentas y progreso | Free |
| Azure Speech | Voces, transcripción y evaluación de pronunciación | F0: 0,5 M de caracteres y 5 h al mes, con límite por minuto |

## Puesta en marcha

1. **Base.** Crear un proyecto Supabase Free y preparar su esquema según POSTGRES.md.
2. **Servidor.** Web Service Free en Render, Node 24, inicio `npm start`. Variables: `PILOT_FREE=true`, `COOKIE_SECURE=true`, `DATABASE_URL`, `PG_CA_PEM`, `PUBLIC_ORIGIN` y, solo para el primer arranque, `ADMIN_INVITE_CODE`.
3. **Voz.** Añadir `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`. Sin ellas la app sigue funcionando con la voz del dispositivo, sin acento, y el alumno se escucha y decide.
4. **Probar en el teléfono.** Generar una mesa, hablar y comprobar que suene el cliente, que lleguen las estrellas y que al cerrar y abrir se conserve la racha.

## Qué hace el servidor

Las mesas salen del generador propio, sin IA: las frases del alumno y del cliente están escritas y revisadas en `content/`. La frase contra la que se evalúa la decide el servidor. El audio se envía a Azure para revisarlo y la app no lo guarda. Los topes mensuales se ajustan por defecto al plan F0 (`LIMIT_STT_SECONDS_MONTH`, `LIMIT_TTS_CHARS_MONTH`) y cada alumno tiene 15 minutos de voz al día (`LIMIT_STT_SECONDS_USER_DAY`). Al llegar a un tope, la voz pasa a la del dispositivo y el alumno se autoevalúa. Con varios alumnos a la vez, el límite por minuto de F0 puede hacer lo mismo durante unos instantes.

## Sin comprobar todavía

Voz humana real, iPhone y Android (el desbloqueo de audio y el corte automático por silencio solo se probaron con audio sintético en navegador de escritorio), y revisión de las frases por un hablante nativo.

Documentación oficial: [Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/), [Render Free](https://render.com/docs/free), [Supabase PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres).
