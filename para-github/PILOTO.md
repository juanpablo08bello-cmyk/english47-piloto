# ENGLISH47 · piloto familiar 0.4.0

La preparación del piloto empieza con un proyecto de Supabase Free. El enlace para alumnos lo dará Render después del despliegue. Cada alumno entra mediante su propia invitación. Reservar las claves para las pantallas de secretos de los proveedores.

1. **Guardar progreso.** Crear un proyecto Supabase Free dedicado. Preparar su esquema privado y la conexión siguiendo POSTGRES.md. Si hay progreso anterior, importar antes de arrancar el servidor.
2. **Abrir la práctica guiada.** Subir las fuentes a un repositorio privado, excluyendo node_modules, .env, respaldos y datos. En Render elegir Web Service Free, Node 24, compilación npm ci e inicio npm start. Usar PILOT_FREE=true, COOKIE_SECURE=true, DATABASE_URL y el secreto inicial indicados en POSTGRES.md. Revisar que el plan y la facturación del alojamiento correspondan al piloto gratuito. Canjear la invitación del administrador y generar una para el primo.
3. **Activar la voz por turnos.** En Google AI Studio usar un proyecto dedicado Free, sin facturación activada. Comprobar que los modelos gemini-3.5-flash (audio a texto, cliente y corrección) y gemini-3.1-flash-tts-preview (lectura) estén disponibles en la cuota gratuita de esa cuenta. Si un modelo carece de cuota, dejar su capacidad apagada. Guardar GEMINI_API_KEY en Render. Marcar GEMINI_FREE_VERIFIED=true solo después de verificar lo anterior.
4. **Repartir la cuota.** Configurar FREE_STT_CALLS_DAY, FREE_TTS_CALLS_DAY y FREE_LLM_CALLS_DAY según los límites visibles. Cero apaga esa capacidad. Si las cuotas lo permiten, para un solo alumno se puede empezar con 6 transcripciones, 6 lecturas y 8 llamadas de conversación por día (apertura, seis respuestas y evaluación). Si se usan transcripción y conversación con el mismo modelo, sumar ambas al comparar con el cupo de Google. Repeticiones y pruebas del micrófono consumen llamadas. Registrar aparte las restricciones por minuto del proveedor.
5. **Probar en el teléfono.** Abrir Hablar y el panel de micrófono. Probar saludo, cantidades y «no onions». En Dinner for two grabar, revisar el texto y enviarlo. Comprobar que las negaciones se oyen bien y que al cerrar y abrir la página se conserva la racha. Si el servicio limita los turnos, elegir una mesa guiada. El botón de voz intenta usar la lectura del dispositivo si la generación falla.

## Qué hace el servidor

Permite una apertura de mesa IA por alumno y día UTC y hasta seis intervenciones de alumno por mesa. Los topes adicionales por persona son ocho transcripciones, diez lecturas y diez llamadas de conversación o evaluación por día. La cuota del grupo puede ser menor. La racha sigue el calendario propio del alumno.

Una reserva se confirma en PostgreSQL antes del envío. Si Google responde con error, la reserva se consume para evitar repeticiones sin límite. Se hace una sola petición al proveedor por intento. El modo gratuito selecciona únicamente Gemini. Un cambio de plan en Google requiere revisar la configuración manualmente. Google puede usar el contenido enviado al nivel gratuito para mejorar sus productos. Practicar con situaciones ficticias.

La entrada de voz se convierte en WAV mono en el dispositivo antes de enviarse. El servidor valida formato y duración de hasta 30 segundos. La grabación para escucharse en la demo queda en el dispositivo. La transcripción editable se envía a la mesa solo al confirmarla. El evaluador analiza el texto y la intención. La pronunciación requiere una comprobación separada.

## Evidencia de esta entrega

149 pruebas automáticas aprobadas. El recorrido adicional por HTTP y PostgreSQL local (PGlite vía TCP) verificó la importación de una cuenta desde SQLite, el rechazo de una segunda importación, el inicio de sesión, una jornada breve, respuestas repetidas, favoritos, progreso de palabras, una mesa demo y conservación de perfil y sesión al reiniciar el servidor y la conexión. Se comprobó que la cuota sobrevivió al reinicio y que una reserva rechazada no duplicó el consumo.

Las pruebas de Gemini utilizaron respuestas simuladas. Quedan pendientes las credenciales reales de Google, Render y Supabase, la comprobación de políticas y límites en las cuentas y el ensayo con iPhone y Android. La integración TTS en vista previa necesita una escucha real para comprobar naturalidad y fidelidad al pedido. Los errores previos del corrector de órdenes descritos en REVISION.md requieren una revisión independiente.

Documentación oficial: [cuotas de Gemini](https://ai.google.dev/gemini-api/docs/rate-limits), [tarifas y uso de contenido](https://ai.google.dev/gemini-api/docs/pricing), [Render Free](https://render.com/docs/free), [Supabase PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres).
