La entrega actual es **0.4.0**. Consulta [PILOTO.md](PILOTO.md) para el estado de pruebas y la configuración gratuita. El historial siguiente corresponde a la fase anterior.

# ENGLISH47 — Sistema de voz 0.3.2

## Recomendación para el primer piloto

Empezar con conversación por turnos: escuchar al cliente, tocar para grabar, terminar, revisar la transcripción y enviar. Usar inglés americano claro, una velocidad cómoda y el botón Más lento. Dar tiempo para pensar y corregir al terminar la interacción. Medir primero comprensión y confianza, sin exigir borrar el acento.

La primera comparación de voces debería usar las mismas tres frases del panel (saludo, orden y alergias) y el mismo teléfono. Escuchar claridad, naturalidad y números/negaciones. Marin, la voz configurada actualmente, puede ser una candidata; no se ha escuchado ni comparado en esta revisión. No se afirma que sea mejor que otra.

Para esta etapa se mantiene la arquitectura existente: transcripción OpenAI, cliente/evaluador Anthropic y voz del dispositivo o adaptador OpenAI. Son capacidades independientes; la nueva pantalla permite probar audio y transcripción aunque el cliente IA todavía no esté conectado.

## Cambios implementados

- Nueva pantalla autenticada `#/voz`, accesible desde Hablar. Escuchar muestras, grabarse, escucharse, descartar y transcribir son acciones separadas. Sin premios ni cambios de racha.
- Cancelación de descargas TTS y de reproducciones. Una respuesta tardía no vuelve a hablar después de Detener ni pisa la frase nueva.
- Fin de reproducción y liberación de URLs de audio al terminar. Un timeout de la voz del dispositivo ya no se informa como audio escuchado correctamente.
- Cancelar mientras se espera permiso de micrófono libera también cualquier permiso concedido más tarde. Fallos al crear el grabador liberan el micrófono. Dos toques al detener comparten el resultado.
- Un AudioContext suspendido no se usa para afirmar que el alumno permaneció en silencio. La detección de silencio sigue siendo orientativa.
- Todas las transcripciones de las mesas esperan revisión y admiten edición antes del envío. El número de palabras no se presenta como confianza de reconocimiento.
- El audio de una transcripción fallida se mantiene solo en memoria de esa pantalla para reintentar. Salir o pasar a segundo plano cancela la operación y descarta el audio.
- Peticiones de transcripción con límite de tiempo y errores recuperables ante JSON inválido, desconexión o cancelación.
- Validación del formato de audio y duración declarada de 400 ms a 60 s antes de usar el proveedor. Las muestras muy pequeñas no se envían al proveedor.
- Adaptadores rechazan respuestas sin texto, JSON roto y salidas sin audio. La voz nueva llega como PCM mono de 24 kHz y se entrega al navegador en WAV.
- Contexto de transcripción pide conservar errores y negaciones; es una instrucción orientativa, no una garantía de que el reconocedor no normalice lo hablado.

## Configuración y límites

No se añadieron credenciales ni se hicieron llamadas a proveedores reales. No se contrató ni desplegó nada. No introduzcas claves en el navegador, el ZIP ni un mensaje de chat: se configuran como secretos en el servidor.

El panel solo habilita las capacidades que el servidor declara configuradas; eso no certifica que las credenciales funcionen. Sus botones permiten comprobarlas una vez conectadas.

Las grabaciones no se guardan en archivos ni en SQLite por esta aplicación. En la pantalla de prueba solo se suben al pulsar el botón de transcribir. En una mesa conectada, detener la grabación inicia su transcripción y luego espera aprobación del texto. El tratamiento y retención del proveedor externo deben verificarse al habilitarlo.

Abortar una solicitud desde el navegador detiene el trabajo local, pero no garantiza que un proveedor ya contactado detenga su procesamiento o facturación. Los límites actuales son contadores de uso, no un presupuesto monetario estricto. No se verificó la duración real del audio en el servidor: se valida el dato declarado por el cliente.

## Modelos y documentación oficial consultada el 5 de noviembre de 2026

- Transcripción de archivo: https://developers.openai.com/api/docs/guides/speech-to-text
- Generación de voz: https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create
- Cambios de modelos: https://developers.openai.com/api/docs/deprecations

La integración activa se migró a `gpt-realtime-2.1-mini` por WebSocket autenticado desde el servidor. Se eliminó el adaptador `/audio/speech`. `TTS_MODEL` vacío o con los modelos retirados se resuelve al nuevo modelo, incluso si existe un .env antiguo. La clave permanece en el servidor. Se conserva la voz `marin`.

Cada petición crea una sesión breve, espera confirmación de configuración, solicita una lectura aislada y cierra al terminar. No abre un micrófono continuo ni cambia el cliente/evaluador Anthropic. Conserva el botón Escuchar y la velocidad de reproducción local. La generación se limita a 18 segundos de espera, 2048 tokens de salida y 90 segundos de audio recibido; se cancela si el navegador desconecta. Esto reduce trabajo pendiente, pero no garantiza anular consumo ya generado.

Antes de reproducir se exige finalización completa, audio válido y una transcripción de salida coincidente con el texto solicitado (normaliza mayúsculas y puntuación). Una negación omitida provoca el fallback visible a la voz del dispositivo. Es una comprobación conservadora: diferencias de números escritos como palabras o contracciones también pueden activar fallback. El transcript del modelo no certifica exactitud acústica; debe escucharse y validarse en pruebas reales. Se espera el audio completo antes de reproducir: no se ofrece streaming ni conversación simultánea.

Los contadores por caracteres se conservan como límite funcional, NO como facturación. Se deshabilitó `RATE_TTS_PER_CHAR`: Realtime cobra tokens, por lo que usar la tarifa anterior mostraría un coste falso. Falta cotejar consumo real en el panel del proveedor (incluidos fallos/cancelaciones), decidir presupuesto y, si se necesita estimación dentro de la app, incorporar contabilidad por tokens. No se promete un techo monetario.

Referencias de implementación:
- https://developers.openai.com/api/docs/guides/voice-websockets
- https://developers.openai.com/api/docs/guides/realtime-conversations

## Qué se verificó

143 pruebas aprobadas: conserva las pruebas funcionales previas, reemplaza las comprobaciones del viejo TTS y añade 11 pruebas de Realtime. Se probó el transporte WebSocket real local contra un servidor simulado, la ruta HTTP autenticada, WAV, orden de eventos, negación perdida, audio vacío, JSON/base64 inválidos, interrupción, timeout, cancelación y migración de configuración.

Se ejecutó JavaScript real, pero MediaRecorder, SpeechSynthesis, Audio y DOM se comprueban mediante dobles. No se hicieron llamadas a OpenAI/Anthropic reales, no se escuchó la voz ni se probaron teléfonos físicos. Estas pruebas no demuestran disponibilidad de la cuenta, calidad acústica, latencia real ni coste.

## Próxima prueba real

1. Publicar esta versión en https manteniendo cuentas privadas y base persistente.
2. Configurar secretos de los proveedores y un presupuesto explícito. Empezar con la prueba de audio, sin activar conversaciones largas.
3. Abrir el panel desde iPhone y Android, conceder/rechazar permiso, grabar, escuchar, enviar y repetir al menos tres frases.
4. Comprobar «no onions», «medium rare», cantidades y cambios de orden; medir latencia y verificar el consumo en el proveedor.
5. Comparar las voces disponibles sobre las mismas frases y elegir con los alumnos.
6. Probar una mesa completa. Separar calidad de transcripción, calidad de voz y calidad de corrección. Pronunciación continúa sin evaluarse.

Para el objetivo central de confianza, una segunda etapa podrá incorporar evaluación de pronunciación basada en audio con un servicio adecuado. Una transcripción bien escrita no basta para puntuar pronunciación.
