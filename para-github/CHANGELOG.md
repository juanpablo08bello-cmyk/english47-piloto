# Registro de cambios

## 0.5.3-piloto (2026-11-06)

- La grabación ya no pierde el inicio de la voz: "Habla ahora" solo aparece cuando se está grabando, se espera a que el micrófono entregue sonido y se quitan los filtros de eco y ruido, que al arrancar recortan las primeras sílabas.
- Voces masculinas latinas para imitar, alternando México y Venezuela: cada frase nueva cambia de voz y la misma frase conserva la suya: "Escuchar cómo se dice", tocar una palabra, Mejorar y los ejemplos de Hablar. Los clientes conservan sus voces.

## 0.5.2-piloto (2026-11-06)

- Hablar es solo por voz: sin cuadros para escribir, también en el resumen. La app entiende lo que dijiste y los ejemplos se tocan para oírlos. Si no hay micrófono, se elige una respuesta tocándola.
- Botón para escuchar tu propia grabación en Mesas, Mejorar y Hablar. Vive solo en memoria mientras sigues en esa pantalla.
- Mesas retira las ayudas por nivel: 1 con todo, 2 sin pronunciación, 3 solo en español y 4 solo el objetivo. Todo queda a un toque y el modelo se muestra al responder. La revisión sigue comparando con la frase modelo; si no coincide en un intento sin ayuda, se muestra el modelo sin marcarlo como error.
- Apartado en Mesas, Mejorar y Hablar: la pronunciación escrita es solo una ayuda y lo importante es aprender la palabra en inglés.
- Pronunciación revisada palabra por palabra; las escrituras dudosas se eligieron midiendo con Azure una voz en español que las lee.
- Pronunciación escrita en español bajo cada frase que se dice en Mesas y Mejorar, y en las respuestas de ejemplo de Hablar (`content/pronunciacion.js`). Es aproximada; el modelo sigue siendo el audio.

## 0.5.1-piloto (2026-11-06)

- Avisos técnicos en Administración, dentro de Comentarios: audio bloqueado, micrófono, voz o errores de pantalla, con el tipo de teléfono. Un aviso por tipo y día; solo códigos conocidos, sin audio ni texto del alumno.
- Contraseñas: cada alumno puede cambiar la suya en Perfil, Ajustes, y la administración puede crear una temporal. Cierra las sesiones y no cambia el progreso.
- Si el teléfono bloquea el sonido, se resalta el altavoz con un aviso en vez de quedarse en silencio.
- Las palabras por mejorar se tocan para oírlas despacio.
- Nivel y propinas también en Hoy y Perfil.

## 0.5.0-piloto, rediseño (2026-11-06)

- Gemini fuera de la app: las mesas salen del generador propio y toda la voz pasa por Azure Speech. Se retiran su adaptador y su sistema de cuotas.
- Más entretenida: propina por turno y bono por mesa perfecta, racha de turnos con 3 estrellas, sonidos, confeti y «Otra mesa» sin volver al menú.
- Más fluida: la grabación se detiene sola al terminar de hablar, la voz del siguiente turno llega precargada, el resultado y «Seguir» caben en una pantalla, y el micrófono muestra el volumen.
- Corrección: la caché de voz podía reproducir la frase con la voz de otro personaje con el mismo ánimo.
- Pantallas clásicas sin jerga técnica ni opciones que no se pueden usar.
- La práctica diaria son tres secciones: Aprender (solo texto), Mesas (solo voz, con «Generar mesa») y Mejorar (solo voz: pronunciar y escuchar). Cualquiera cuenta para la racha; las tres completan el día. Sin migración de datos: se guarda dentro de la jornada.
- 200 frases para principiantes en 18 temas, explicadas palabra por palabra (`content/frases.js`, `content/frases-mas.js`).
- Generador de mesas al azar (`content/mesas.js`): 24 situaciones (cena, reservación, lista de espera, alergia, queja, plato agotado y más), personaje, acento, ánimo, pedido e imprevistos, guiando siempre qué decir. 
- Niveles de mesas por mesas atendidas en total (nivel 2 a las 4, nivel 3 a las 10, nivel 4 a las 20): cada uno abre situaciones nuevas y alarga los turnos, hasta 10. No repite situación ni persona recientes. Los imprevistos no cortan un intercambio ni ignoran una pregunta del alumno.
- La voz se compara con la frase guía: palabras entendidas y estrellas. No mide acento ni fonética.
- Interfaz nueva: lienzo negro, un color por sección, menos texto, navegación Hoy, Aprender, Mesas, Mejorar y Perfil. Lecciones y mesas clásicas siguen en Perfil, «Más práctica».
- Frases de voz en caché.
- Azure Speech (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`), en modo piloto: voz del cliente, transcripción y evaluación de pronunciación palabra por palabra contra una frase que decide el servidor. 45 personajes con voces reales de 15 orígenes, y la velocidad de la voz cambia según el ánimo. Los límites mensuales se ajustan por defecto al plan gratuito F0.

## 0.4.0-piloto, ajuste (2026-11-06)

- En las mesas que terminan confirmando una orden (Dinner for two, Coffee and cocktails, Table of three), si la confirmación queda mal el cliente ya no responde que está perfecta y el resultado es «Completado», no «Resuelto». La XP no cambia. Los resultados ya guardados no se recalculan.
- Los avisos sobre órdenes se leen bien en español: «del ribeye», «Faltaron los espárragos», mayúscula inicial y «es uno solo» o «es una sola» según el plato.

## 0.3.0-piloto (2026-11-05)

### Evaluación
- Las dudas y negaciones se valoran por afirmación: «not sure about the price» ya no excusa «it is totally safe».
- Órdenes estructuradas (`server/order.js`): plato, cantidad, término, ingredientes, sustituciones y su plato, con el estado final si el cliente cambia de opinión. Se usan en simulaciones, diagnóstico y confirmaciones complejas.
- Erratas: se acepta una letra de más, de menos o dos letras invertidas. Cambiar una letra por otra queda en «Necesita revisión», porque suele ser otra palabra.
- Las construcciones subordinadas válidas («let me know what you want») ya no se marcan como error ni como tono brusco.
- Repetir palabras («water water water») no cuenta como participación, aunque existan en el vocabulario.

### Catálogo
- Auditoría de las alternativas de las 636 entradas. Cada una distingue equivalentes, relacionados, ejemplos y contrastes.
- Las sesiones en curso conservan su respuesta aunque cambie el catálogo.

### Progreso e idempotencia
- Lecciones, repaso libre, diagnóstico y sesión diaria: repetir una petición devuelve lo registrado y no suma evidencia, errores, logros, monedas ni XP.
- Los reintentos son explícitos y deben traer una respuesta distinta.
- Reenviar una ronda del diagnóstico la reemplaza en lugar de acumularse.

### Producto
- Palabras: búsqueda y filtros en todas las vistas, limpiar filtros, totales y ficha con estado, práctica, audio real y contrastes.
- Primer uso: bienvenida, diagnóstico y paso directo a «Empezar mi práctica».
- Hoy: mínimo del día, lo ganado hoy y qué sigue mañana.
- Mesas por texto como vía principal cuando no hay transcripción conectada.
- Comentarios: «Reportar un problema», con bandeja en Administración.
- Aviso de versión nueva cuando el servidor se actualiza con la página abierta.
- Recuperación ante cortes de red: la respuesta se conserva y reenviarla no se cuenta doble.

### Migración v2 → v3
Automática al arrancar, con copia previa `<base>.respaldo-v2-<fecha>`. Añade `lesson_answers.result`, `lesson_answers.answer_hash` y las tablas `feedback` e `idempotency`. No borra ni modifica progreso.

## 0.2.0 (2026-11-05)

Evaluador local por dimensiones, diagnóstico por rondas, estados intentado/completado/resuelto, privacidad de citas, 48 microlecciones, 16 simulaciones y 636 expresiones. Migración v1 → v2.

## 0.1.0 (2026-11-05)

Primera versión: acceso por invitación, sesión diaria, rachas, recompensas, Ruta, Hablar en demo, Palabras y Perfil.
