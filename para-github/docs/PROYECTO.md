# ENGLISH47 — Proyecto y prompt maestro para Claude

Versión 2 · Nombre confirmado · 5 de noviembre de 2026

## Cómo utilizar este documento

Adjunta este archivo y la referencia visual proporcionada a un proyecto de Claude. El bloque «Prompt maestro» contiene las instrucciones para diseñar e implementar la aplicación. Nombre confirmado: ENGLISH47. Mascota: capibara original. Grupo inicial: hasta cinco alumnos. Dispositivos: iPhone y Android. El presupuesto y proveedor de voz siguen pendientes de validación. No se ha contratado ningún servicio ni construido o publicado la aplicación.

## Decisiones de producto

- Público inicial: hasta cinco alumnos, los hermanos del creador y un círculo cercano. Adultos hispanohablantes con años de experiencia en restaurantes y conocimientos parciales de inglés.
- Necesidades principales: perder la vergüenza de pronunciar, encontrar palabras al responder y expresarse con mayor profesionalismo.
- Contexto: restaurantes americanos de nivel medio-alto en Miami Beach.
- Dispositivo principal: celular, compatible con iPhone y Android. Sesión habitual de 20–25 minutos, con práctica breve de mantenimiento para días complicados.
- Inspiración: facilidad de uso, mapa de avance, rachas y recompensas de Duolingo. Marca, personajes, textos y contenido propios.
- Resultado esperado: poder completar interacciones reales con claridad y autonomía. La actividad diaria es un medio para lograrlo.
- Recomendación: aprendizaje gamificado con una base visual limpia y amable para adultos; correcciones privadas y sin rankings obligatorios.

## Prompt maestro

Actúa como responsable de producto, diseñador de experiencia móvil, especialista en aprendizaje de inglés para hispanohablantes y desarrollador de una aplicación web. Construye una aplicación privada y funcional siguiendo estas instrucciones. No entregues únicamente una landing page o pantallas con botones sin comportamiento.

### 1. Objetivo y tono

Nombre confirmado: ENGLISH47. Mascota: un capibara original, amable y expresivo, con detalles discretos de mesero profesional. Idioma de la interfaz: español. Inglés objetivo: inglés americano natural para servicio de restaurante, con apoyo en español que disminuye según el progreso.

Los alumnos ya trabajan como meseros. No los trates como principiantes absolutos ni como niños. Necesitan practicar sin sentirse juzgados. El entrenador será paciente, cálido y concreto; reforzará intentos y mejoras observables sin elogios vacíos. No prometas fluidez en un plazo fijo.

Prioriza comprensión, vocabulario disponible al hablar, comunicación profesional y confianza. No exijas borrar el acento español. Acepta respuestas distintas si cumplen la intención de servicio.

### 2. Inicio y navegación

Construye primero para pantallas de 360–430 px de ancho, con adaptación a escritorio. Navegación inferior con cinco destinos: Hoy, Ruta, Hablar, Palabras y Perfil. La gramática vive dentro de Ruta y de los repasos.

Al abrir, mostrar:

1. Saludo breve y racha actual.
2. Objetivo diario y avance real: actividades completadas y minutos activos.
3. Una acción principal: «Empezar mi práctica» o «Continuar mi práctica».
4. Vocabulario de hoy: cinco expresiones útiles.
5. Reto semanal y siguiente recompensa, en segundo plano.

Evita una portada comercial, bloques largos de explicación y exceso de indicadores. En el primer acceso, realizar un diagnóstico amable de unos cinco minutos, que se pueda omitir. Medir por separado comprensión, vocabulario y expresión. No atribuir niveles oficiales certificados al resultado. Cada alumno tiene progreso y preferencias independientes.

### 3. Bucle diario

Sesión sugerida de 22 minutos:

- 4 minutos: recuperar expresiones anteriores, con prioridad a errores y repasos pendientes.
- 5 minutos: aprender cinco palabras o expresiones y practicar frases completas.
- 10 minutos: atender una mesa mediante conversación por voz.
- 3 minutos: revisar dos mejoras prioritarias y repetir una respuesta.

Permitir extender la práctica o pausarla y continuar. No avanzar por temporizador: completar cada actividad según acciones y respuestas reales. Alternar tareas para evitar monotonía sin esconder el objetivo del día.

Ofrecer modo breve de mantenimiento: tres repasos y una respuesta contextual, hablada o escrita, completados de forma activa. Puede conservar la racha, pero mostrar por separado que la sesión de 22 minutos sigue pendiente. Abrir la página, reproducir audio pasivamente o dejar un temporizador corriendo no cuenta como práctica.

### 4. Rachas y recompensas

Implementar reglas explícitas y verificables:

- Una jornada válida suma como máximo un día de racha, aunque existan múltiples sesiones o dispositivos.
- Usar la zona IANA America/New_York por defecto para el contexto de Miami, configurable por alumno. No usar un desplazamiento UTC fijo.
- Al validar la práctica diaria, registrar un evento único de finalización por usuario y fecha local.
- Mostrar racha actual, mejor racha y calendario. Los días cubiertos por protector se distinguen visualmente de los practicados.
- Propuesta inicial: 10 XP por microlección terminada, 20 XP por simulación y 10 XP por repaso diario. Registrar recompensas una sola vez por actividad; las repeticiones conservan su valor educativo sin generar XP ilimitado.
- Ganar 20 monedas por día de práctica válida. Premio adicional de 50 monedas al alcanzar cada bloque de siete días realmente practicados.
- Tienda simple: colores o accesorios de avatar y un protector de racha por 60 monedas; máximo dos protectores almacenados. No usar dinero real.
- Un protector cubre un día perdido para mantener continuidad, sin sumar un día practicado ni conceder XP. No cubre varios días automáticamente con una sola unidad.
- Ante una interrupción, conservar aprendizaje, monedas y logros. Invitar a retomar sin mensajes de culpa.
- No limitar errores con vidas, no bloquear conversación como castigo y no exigir rachas perfectas para desbloquear habilidades esenciales.
- Ranking familiar solo como opción futura y voluntaria. Por defecto, progreso privado.

Mostrar celebraciones cortas, con sonido opcional y respeto por movimiento reducido. Los logros relevantes serán «Primera conversación», «Confirmé una orden», «Resolví una queja» y «Volví a intentar una frase difícil». No confundir XP acumulada con dominio real.

### 5. Ruta de aprendizaje

Mapa vertical con unidades, lecciones pequeñas y un reto final por unidad. Permitir ubicar al alumno según diagnóstico y acceder libremente al repaso.

Unidades iniciales:

1. Recibir y acomodar: reservas, cantidad de personas, tiempo de espera y presentación.
2. Bebidas: agua natural o con gas, hielo, refills y recomendaciones sencillas.
3. Explicar el menú: ingredientes, acompañamientos y métodos de cocción.
4. Tomar la orden: términos de carne, modificaciones, sustituciones y confirmación.
5. Alergias y restricciones: aclarar y consultar cocina, sin inventar garantías.
6. Durante el servicio: revisar la mesa, ofrecer ayuda y anticipar necesidades.
7. Resolver problemas: demora, plato incorrecto, comida fría y escalamiento al responsable.
8. Cerrar la mesa: cuenta, división de pagos, recibo, propinas según la política del local y despedida.

Integrar gramática útil en cada unidad: preguntas con would/could, presente simple, preguntas con do/does, contables e incontables, some/any, pasado para explicar incidentes y expresiones de futuro. Explicaciones en español de menos de un minuto, seguidas de práctica contextual.

Crear contenido inicial concreto: ocho unidades con tres microlecciones cada una, al menos 60 entradas de vocabulario o expresiones y ocho simulaciones completas. No generar pantallas vacías ni depender de IA para que el catálogo básico exista. No prometer contenido ilimitado revisado.

### 6. Palabras del día y repaso

Enseñar palabras y bloques de lenguaje: side dish, dressing on the side, refill, still water, sparkling water, medium rare, split the check, take your time, let me double-check, I'll be right back.

Cada entrada incluye significado contextual en español, frase de servicio en inglés, audio, pronunciación orientativa cuando sea útil, categoría, ejemplo de cliente y respuesta posible. Guardar favoritas y frases personales.

Ejercicios: escuchar y elegir, completar una frase, recordar sin opciones, responder a un cliente y repetir con intención. No basar todo en traducción de palabras aisladas.

Repaso inicial recomendado tras 1, 3, 7, 14 y 30 días, ajustable según desempeño. Si una palabra falla, adelantar su próximo repaso. El calendario de repaso depende de fechas reales y persiste al cerrar sesión. Separar «reconozco esta expresión» de «la usé correctamente al responder». El vocabulario diario queda estable durante esa jornada para cada alumno.

### 7. Conversación por voz

La voz es una función central. El alumno escucha a la IA y la IA recibe su respuesta hablada. Para la primera versión, recomendar conversación por turnos: tocar para grabar y tocar para enviar. Hacer visible cuándo el micrófono está activo. El modo de conversación continua puede añadirse después, si resulta útil y viable.

Controles: escuchar otra vez, más lento, mostrar transcripción, pedir pista, decirlo de otra forma, terminar y repetir situación. Permitir texto cuando no se puede hablar.

Estados reales: inactivo, permiso solicitado, grabando, enviando, procesando, reproduciendo y error. Incluir recuperación si el permiso se rechaza, hay silencio, el audio se entiende mal, falla la red o se agota el límite configurado. Liberar micrófono al terminar o abandonar la pantalla. No reproducir una respuesta mientras se graba otra.

Separar estas capacidades:

- Reconocer voz y transcribirla.
- Producir respuestas contextuales de un cliente mediante IA.
- Convertir la respuesta en audio.
- Evaluar pronunciación a partir del audio, si existe un servicio adecuado.

No presentar una transcripción correcta como prueba de pronunciación perfecta. Si solo se dispone de texto, evaluar vocabulario, intención y gramática, e indicar que no se evaluó pronunciación. Si el audio es ambiguo, pedir repetir o confirmar; no inventar errores fonéticos ni puntuaciones precisas.

Ofrecer dos modos claramente rotulados: demo con contenido y respuestas de ejemplo, y conversación con IA conectada. La demo nunca se presenta como una conversación libre real. Si no hay credenciales, mostrar el estado sin bloquear las lecciones disponibles.

La selección del proveedor y del modelo de voz queda pendiente de presupuesto. Crear una interfaz de integración intercambiable. Antes de elegir servicios, verificar documentación oficial vigente, compatibilidad móvil y costos reales. No asumir que una suscripción de chat cubre llamadas de la aplicación ni inventar tarifas. Claves privadas únicamente en servidor. Incluir límites de uso y control de gasto configurables.

### 8. Método de corrección

Dos modos: «Con ayuda», con pistas a petición, y «Como en el trabajo», donde el cliente continúa y la corrección llega al final. No interrumpir cada frase.

Resumen de cada simulación:

1. Una cosa concreta que el alumno resolvió bien.
2. Hasta dos mejoras prioritarias.
3. Su respuesta, una versión corregida y una alternativa profesional natural.
4. Botón para escuchar y volver a intentarlo.
5. Expresiones que entran en el repaso.

Ejemplo de criterio: «What you want?» comunica una intención, pero requiere una forma más cortés. Proponer «What would you like to order?» y explicar brevemente por qué. Aceptar alternativas como «Are you ready to order?» cuando encajen con el momento.

Preguntar opcionalmente al terminar «¿Qué tan cómodo te sentiste hablando?» con escala de 1 a 5. Mostrarla como percepción del alumno, no como una medición automática de confianza. No usar velocidad de respuesta como único indicador de habilidad.

### 9. Motor de simulaciones

La IA interpreta un cliente y mantiene coherencia sobre mesa, personas, pedidos, modificaciones y hechos ya confirmados. Las reglas del cliente y las del evaluador deben estar separadas.

Cada escenario define: nivel de ayuda, objetivo, menú disponible, hechos que conoce el cliente, dificultad, posibles imprevistos, criterios de logro y condición de cierre. Empezar con un interlocutor y añadir varias personas más adelante.

Menú ficticio compartido: platos, ingredientes, precios de ejemplo claramente señalados y modificaciones permitidas. No inventar disponibilidad, política del restaurante ni información sobre alergias fuera de ese menú. Si no hay información, entrenar al mesero para consultar cocina o a su responsable.

Escenario inicial «Dinner for two»: recibir a dos personas, ofrecer agua, responder una pregunta sobre un plato, tomar dos órdenes, confirmar un acompañamiento aparte y cerrar la interacción. Variar preguntas entre intentos conservando las reglas. En escenarios de alergias, reforzar confirmación y comunicación con cocina; una respuesta fluida que invente una garantía no supera el criterio de servicio.

Escenario posterior «The order isn't right»: cliente recibió un término de carne distinto; el alumno escucha, reconoce el problema, confirma qué ocurrió y propone consultar o corregir según las reglas ficticias del local. No entrenar promesas de compensaciones no autorizadas.

### 10. Transferencia al trabajo real

Al terminar, sugerir un reto opcional: usar una expresión nueva en el siguiente turno o pedir una aclaración en inglés. El alumno puede registrar cómo le fue sin grabar clientes ni compartir datos de ellos. Estos retos no condicionan la racha, porque no todos trabajan diariamente.

Mostrar avance en tareas específicas: pedir aclaraciones, explicar un plato y confirmar modificaciones. No afirmar que el alumno domina una habilidad basándose solo en haber visitado su lección.

### 11. Diseño a partir de la referencia suministrada

Inspiración: fondo blanco, tipografía redondeada, botones reconocibles, bordes definidos, verde de progreso y azul de ayuda. Identidad propia, sin copiar el búho, logotipo, ilustraciones o textos de Duolingo. Mascota confirmada: capibara original de ENGLISH47, con formas redondeadas y un detalle de uniforme de mesero. Usar expresiones de bienvenida, concentración, ánimo y celebración. Los accesorios se pueden desbloquear con monedas. Mantener la silueta consistente y evitar que tape ejercicios o controles de voz.

La referencia corresponde en parte a una página comercial de escritorio: no traslades secciones de 800–900 px a la aplicación móvil. Prioriza una tarea por pantalla, navegación fija accesible y tarjetas compactas.

Tokens de partida:

| Función | Valor |
|---|---|
| Fondo | #ffffff |
| Texto principal | #4b4b4b |
| Texto secundario | #777777, ajustar si no alcanza contraste |
| Verde de progreso | #58cc02 |
| Verde suave | #d7ffb8 |
| Azul de ayuda | #1cb0f6 |
| Tinta oscura | #000437 |
| Borde decorativo | #afafaf |
| Radio base | 12 px |
| Espaciado | múltiplos de 4 px |

Hay contradicciones en la referencia sobre el verde como CTA. Resolver así: conservar verde para progreso y acentos; usar tinta oscura con texto blanco como acción principal por defecto. Un botón verde puede usarse con texto oscuro si el contraste resulta adecuado. No usar blanco pequeño sobre verde brillante por imitación. Verificar contrastes de texto y controles.

Usar Nunito o alternativa disponible y legible, sin depender de fuentes propietarias. Texto móvil de 16–18 px, títulos de 24–32 px, interlineado de aproximadamente 1.4–1.5, controles táctiles de al menos 44 px. Los títulos de 48–64 px de la referencia quedan para espacios amplios, si corresponden.

Sin degradados, efectos de cristal ni sombras grandes. Bordes de 2 px y estados claros de seleccionado, correcto, revisar, cargando y deshabilitado. No transmitir aciertos y errores solo mediante color. Evitar infantilización y efectos que distraigan del audio.

### 12. Cuentas, datos y privacidad

Acceso privado para hasta cinco alumnos inicialmente, con cuentas individuales e invitación administrada. La cuenta de administración puede ser independiente de esas cinco plazas. No asumir que ocultar una URL equivale a restringir acceso. Registro público desactivado inicialmente. El administrador gestiona acceso y contenido; el historial de voz de cada alumno no se comparte por defecto.

Persistir usuarios, preferencias, unidades, lecciones, intentos, sesiones, vocabulario, repasos, días de práctica, eventos de recompensa, saldo, protectores y desbloqueos. La progresión no puede depender únicamente de almacenamiento local si se usan cuentas y varios dispositivos.

Proteger datos por usuario desde el servidor. No guardar grabaciones por defecto; procesarlas según lo necesario para la función y explicar su envío al proveedor. Guardar transcripciones de práctica solo con información clara y opción de borrado. Evitar datos de clientes reales. Pedir permiso de micrófono al comenzar una actividad de voz, no al abrir la página.

### 13. Implementación y alcance

Si hay un proyecto existente, inspeccionarlo antes de elegir tecnologías. Si se empieza desde cero, proponer una arquitectura web sencilla con interfaz móvil, backend para IA, autenticación y base de datos. Justificar la elección brevemente según el entorno disponible; evitar infraestructura innecesaria.

Primera entrega: recorrido completo desde acceso y diagnóstico hasta práctica, vocabulario, simulación y resumen con racha persistente. Incluir catálogo inicial, perfiles separados, lógica de recompensas e integración de voz por turnos. Las funciones que dependan de credenciales deben mostrar su estado real y tener una ruta de configuración documentada.

Fuera de la primera versión: pagos, red social pública, rankings globales, app nativa y conversaciones con múltiples clientes hablando simultáneamente. Dejar estructura ampliable sin construir esas funciones ahora.

Antes de implementar, entregar un plan breve y señalar supuestos. Avanzar con decisiones reversibles; preguntar únicamente por bloqueos reales, como credenciales o costos no autorizados. No contratar servicios ni publicar para una audiencia pública sin instrucciones.

### 14. Criterios de aceptación

- Una persona puede entrar desde su celular, completar práctica y recuperar su progreso al volver.
- Dos cuentas no ven ni modifican el progreso de la otra.
- La práctica del día conserva vocabulario y estado tras recargar.
- Completar dos veces una sesión o enviar peticiones duplicadas no duplica racha, XP o monedas.
- La fecha diaria respeta America/New_York, cambios de horario y sesiones alrededor de medianoche. Usar la fecha de finalización para asignar la práctica diaria y explicarlo de forma consistente.
- Una sesión mínima válida conserva la racha; una visita sin actividad no.
- Los protectores distinguen continuidad de días realmente practicados y no se consumen varias veces por el mismo día perdido.
- El audio puede grabarse, enviarse, escucharse y detenerse; existe recuperación ante permisos rechazados y fallos.
- La IA usa el menú del escenario y recuerda la orden. La corrección se basa en lo recibido y distingue evaluación de texto y audio.
- Sin credenciales, la demo está identificada y no finge integración real.
- El catálogo inicial, navegación, favoritos y repasos funcionan sin depender de respuestas generadas en cada visita.
- No hay claves privadas en el navegador ni grabaciones guardadas por defecto.
- Verificar en móvil real los permisos y la reproducción de audio antes de considerar completada la función de voz. Si no se dispone de ese dispositivo, declarar la comprobación pendiente.

Realizar pruebas útiles de aislamiento de cuentas, recompensas duplicadas, fechas y protectores. Comprobar manualmente el recorrido principal y estados de error de voz. Al entregar, explicar qué funciona, qué se probó, qué depende de configuración y qué sigue pendiente. Nunca presentar una maqueta como producto terminado.

## Presupuesto: recomendación de planificación

El usuario prioriza que la conversación funcione; todavía no ha autorizado un importe. Proponer un piloto privado de siete días con voz real por turnos y medir consumo, latencia, comprensión de acentos y utilidad de la corrección en iPhone y Android. Usar esos resultados y las tarifas oficiales vigentes para estimar el mes completo antes de elegir proveedor o contratar servicios.

Como punto de partida para conversar sobre presupuesto, proponer un techo de 30 USD mensuales para todo el grupo, sujeto a aprobación. Es un límite de gasto propuesto, no una cotización, una estimación de suficiencia ni una promesa de costo. Si no alcanza para el uso esperado, explicar el costo de una alternativa y las diferencias antes de reducir el componente central de voz.

La carga objetivo de cinco alumnos con diez minutos diarios de simulación equivale a unos 1.500 minutos de sesión al mes de 30 días. No equiparar automáticamente minutos de sesión a minutos facturables: el cálculo depende del audio de entrada, audio de salida, texto, silencios y proveedor. Incluir también alojamiento, base de datos y autenticación si generan cargos. Mostrar consumo al administrador y configurar alertas y límite de gasto.

No aprobar cargos, contratar servicios ni asumir un presupuesto confirmado. No depender exclusivamente del reconocimiento de voz del navegador para declarar compatibilidad entre dispositivos: validar la ruta real de audio en ambos sistemas.

## Archivos de referencia e instrucciones de uso

Adjuntar este proyecto y el design.md de Duolingo al proyecto de Claude. Este documento gobierna funcionalidad, aprendizaje, identidad ENGLISH47 y reglas de producto. El design.md funciona como referencia estética. Ante contradicciones, priorizar este proyecto y la accesibilidad móvil. No copiar personajes o marca de Duolingo ni construir su landing page.

No hay menú real disponible por ahora. Avanzar con el menú ficticio definido para los ejercicios y permitir sustituirlo en el futuro sin rehacer las lecciones.

## Decisiones pendientes

1. Estilo final y nombre del capibara, sin bloquear el desarrollo.
2. Presupuesto aprobado y proveedor de conversación real, tras el piloto y verificación de costos.
3. Menú o situaciones del restaurante real si el usuario decide aportarlos más adelante.

Estas decisiones no impiden diseñar la aplicación y construir su contenido inicial. No volver a preguntar por el nombre del proyecto, mascota, número inicial de alumnos o sistemas móviles: ya están confirmados.
