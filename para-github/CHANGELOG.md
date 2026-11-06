# Registro de cambios

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
