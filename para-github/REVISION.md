La entrega actual es **0.4.0**. Consulta [PILOTO.md](PILOTO.md) para el estado de pruebas y la configuración gratuita. El historial siguiente corresponde a la fase anterior.

# Revisión 0.3.2 — Migración de voz a Realtime

Esta entrega cambia la generación de voz a gpt-realtime-2.1-mini mediante WebSocket desde el servidor. Conserva la grabación, reproducción y revisión de transcripciones de 0.3.1. No activa ni contrata proveedores reales. Mantiene el contenido y los datos del piloto 0.3.0; no requiere una nueva migración de la base.

## Ejecutar

Node 22.13 o superior. Dependencias incluidas. Ejecuta `npm test`, `npm run cuenta-prueba` y `npm start`. Las instrucciones de cuentas e invitaciones siguen en README.md.

## Recorrido nuevo

1. Entra con tu cuenta y abre **Hablar → Probar mi micrófono y las voces**.
2. Escucha una frase, prueba Más lento y Detener audio.
3. Graba, detén, escúchate y descarta la grabación.
4. Rechaza el permiso y comprueba que puedes volver a Hablar y practicar por texto.
5. Si hay proveedor de transcripción configurado, graba un pedido con «no onions» y pulsa Enviar audio para transcribir. Comprueba el texto. No se crea ningún turno de conversación desde esta pantalla.
6. Con conversación IA y transcripción configuradas, abre una mesa, graba y detén. TODA transcripción debe esperar a que la revises y pulses Sí, enviar. Corrige el texto antes de enviarlo.
7. Interrumpe una reproducción mientras se descarga; no debe empezar a hablar más tarde.
8. Sal mientras espera el permiso del micrófono; al concederlo tarde no debe quedar activo.
9. Con un fallo de red durante la transcripción, intenta reenviar la grabación desde la misma pantalla. Al salir se descarta de memoria.

## Resultado de pruebas automáticas de esta entrega

143 pruebas aprobadas. Incluyen 11 pruebas nuevas de Realtime y la ruta HTTP de voz adaptada. Los tests del TTS retirado se reemplazaron. Se usó un proveedor WebSocket simulado local; no una cuenta real. Ver VOZ.md para límites y configuración.

El recorrido visual completo, la voz real y los teléfonos físicos siguen pendientes. El navegador remoto disponible en esta conversación no comparte el localhost del entorno Node; las revisiones anteriores devolvieron ERR_CONNECTION_REFUSED.

Los contadores de uso de audio son estimaciones para el piloto, no un techo monetario garantizado: la duración de entrada se recibe del cliente. La facturación y retención del proveedor deben revisarse al conectarlo.

El resto de escenarios y casos del piloto se conservan en las pruebas y README.md. No se corrigieron en esta etapa los casos pendientes del comprobador de órdenes: negar el nombre de un plato o decir «no dressing on the side» requiere una revisión aparte de server/order.js.
