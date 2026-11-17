# Auditoría del sistema actual de aprendizaje: ENGLISH47 v1.3.0

Auditoría de solo lectura. No se modificó código ni contenido, no se leyó `.env` ni `data/`, no se ejecutó el servidor. Para contar contenido se importaron módulos de `content/` desde un script temporal fuera del proyecto. Los números de línea corresponden al estado del repositorio al momento de leerlo. Lo que es inferencia y no se comprobó en código va marcado **(no verificado)**.

## Resumen ejecutivo

1. **El bucle diario actual no tiene repetición espaciada.** `server/srs.js` (1-3-7-14-30) solo se alimenta desde la Ruta de lecciones, desde Palabras/Repasar y desde el motor de simulaciones antiguo. Ninguna de las tres secciones del menú diario (Aprender palabras, Mesas, Pronunciar y escuchar) lo toca. Las frases de Aprender solo se marcan «vistas» (binario) y se eligen al azar entre las no vistas.
2. **El alumno no repite las mismas frases a diario.** Hace lo contrario: cada tanda trae 4 frases nuevas, y las ya vistas solo reaparecen cuando se agotan las 463 y no están entre las 60 más recientes. Los probadores tienen razón en que falta repetición y el CHANGELOG 1.0.0 describe con precisión lo que está implementado.
3. **Hay dos productos en uno.** El menú nuevo (Hoy, Aprender, Mesas, Pronunciar, Ranking, Tienda, Perfil) está encima de un sistema antiguo completo (48 lecciones, 636 expresiones con SRS, 16 escenarios con IA, diagnóstico, sesión diaria) que sigue en el código, en la base de datos y en el arranque de cada petición, pero queda escondido en Perfil → «Más práctica».
4. **La «jornada válida» no exige calidad.** Basta terminar 2 tandas, 2 mesas y 2 intentos de voz. Cuentan intentos con 0 estrellas, y «Me salió bien» (autoevaluación) cuenta cuando no hay evaluación de voz o se agota la cuota.
5. **Para venderlo faltan cimientos.** No hay pagos, ni correo en la tabla de usuarios, ni términos ni privacidad en la interfaz, y los topes de coste de IA son contadores globales mensuales compartidos por todos. El contenido nunca lo revisó una persona nativa.

---

## 1. Mapa de pantallas y secciones

Enrutador: `public/js/app.js:1174` (`ROUTES`). Cliente en JS sin compilación; el servidor decide recompensas. Menú principal: `app.js:25` (Hoy, Aprender palabras, Mesas, Pronunciar y escuchar, Ranking, Tienda, Perfil).

### 1.1 Pantallas del menú actual

| Ruta | Propósito | Endpoints | Contenido | XP / monedas | Archivo |
|---|---|---|---|---|---|
| `#/hoy` | Panel diario: 3 anillos de meta, nivel, racha, reto semanal (4 días) | `GET /api/today` | n/a | n/a | `app.js:435` (`viewToday`), pasos en `app.js:429` |
| `#/aprender` | Portada de Aprender: «Generar frases», Temas, Diccionario VIP, «Mis palabras» | `GET /api/aprender` | 463 frases en 19 temas | n/a | `aprender.js:16` |
| `#/aprender/jugar[/tema]` | Tanda de 4 frases: ver frase y palabras nuevas, luego un repaso tocando (significado u ordenar) | `POST /api/aprender/generar`, `POST /api/aprender/terminar` | Se elige entre 463 frases | Una tanda cuenta 1 para la meta. XP 15 una vez al día al llegar a 2 tandas. Sin monedas propias | `aprender.js:65`; servidor `practice.js:503`, `531` |
| `#/aprender/temas` | Lista de 20 «temas» (tablas VIP) con avance | `GET /api/aprender` | 20 tablas, 704 filas | n/a | `aprender.js:46` |
| `#/aprender/tema/:id` | Juego de ~10 pasos con 8 palabras: parejas, significado, escucha y elige, ordena frase, pasado/letras | `POST /api/aprender/tema`, `POST /api/aprender/tema/terminar`, `POST /api/voice/speak` (al oír) | Mismas 704 filas, 8 por ronda | Cuenta 1 para la meta «tanda» igual que las frases | `juegos.js:15`; servidor `practice.js:441`, `461` |
| `#/aprender/vip` | Diccionario VIP: tablas largas, buscador, tocar para oír, verbos en 5 formas | `GET /api/vip`, `POST /api/voice/speak` | 20 tablas: 120 verbos y 584 palabras | Ninguno | `vip.js:37` |
| `#/mesas` | Portada: dificultad, propinas, «Generar mesa» | `GET /api/mesas`, `POST /api/mesas/generar` | 40 situaciones, 45 personajes, 8 ánimos, 15 acentos | n/a | `mesas.js:52` |
| `#/mesas/atender` | La mesa: turnos con cliente hablado, respuesta por voz, estrellas, propina, resumen | `GET /api/mesas`, `POST /api/voice/speak`, `POST /api/voz/evaluar?tipo=mesa`, `POST /api/mesas/:id/turno`, `POST /api/mesas/:id/terminar` | 3 a 6 turnos por mesa | Propina: $2 por estrella, $5 de bono por mesa perfecta, en monedas y sin tope. XP 25 una vez al día al llegar a 2 mesas | `mesas.js:90`; servidor `practice.js:581`, `605`, `621` |
| `#/mejorar` | Portada: elegir Pronunciar o Escuchar | `GET /api/mejorar`, `GET /api/voice/status` | n/a | n/a | `mejorar.js:11` |
| `#/mejorar/pronunciar` | El cliente o una situación dice algo y el alumno responde con voz propia | `POST /api/mejorar/generar`, `POST /api/voz/evaluar?tipo=mejorar` | 84 situaciones (179 variantes) | Cada intento cuenta 1. XP 15 una vez al día al llegar a 2 | `mejorar.js:39`, `drawReply` en `:122`; servidor `practice.js:709`, `732` |
| `#/mejorar/escuchar` | Oír una frase sin verla y repetirla | Igual que el anterior | Líneas de clientes de mesas, líneas de `clientLine` y de las 463 frases | Igual | `mejorar.js:102` |
| `#/ranking` | Podio y lista por racha o por propinas | `GET /api/ranking` | n/a | n/a | `ranking.js:25`; servidor `practice.js:763` |
| `#/tienda` | 8 animales, 11 chalecos, 9 gorros, 4 lentes, 6 cuellos (todo cosmético) y protector de racha | `GET /api/profile`, `POST /api/shop/buy`, `POST /api/avatar/equip` | 38 cosméticos y 1 protector (`progress.js:21-60`) | Gasta monedas | `tienda.js:22` |
| `#/perfil` | Nivel, racha, calendario, logros, ajustes, contraseña, privacidad, enlace a «Más práctica» | `GET /api/profile`, `POST /api/settings`, `/api/privacy/*`, `/api/auth/password` | 4 logros | n/a | `app.js:983` |
| `#/bienvenida` | Primer día: 3 pasos y «Empezar» (salta el diagnóstico) | `POST /api/diagnostic/skip` | n/a | n/a | `app.js:178` |
| `#/admin` | Invitaciones, plazas, uso, comentarios, contraseñas temporales | `/api/admin/*` | n/a | n/a | `app.js:1083` |
| `#/entrar`, `#/invite/:código` | Acceso | `/api/auth/*` | n/a | n/a | `app.js` (`viewLogin`, `viewInvite`) |

### 1.2 Pantallas antiguas aún enrutadas

Se alcanzan solo desde Perfil → «Más práctica» (`app.js:1022-1024` enlaza `#/palabras`, `#/ruta`, `#/voz`) o por enlaces internos entre ellas. `#/hablar` no tiene entrada directa desde ningún menú: se llega desde las tarjetas de desafío de la Ruta (`#/preparar/:id`, `app.js:560`).

| Ruta | Qué es | Endpoints | Contenido | XP | Archivo |
|---|---|---|---|---|---|
| `#/ruta`, `#/leccion/:id` | Ruta de 8 unidades y 48 microlecciones con 312 ejercicios (144 escritos a mano) | `GET /api/route`, `/api/lesson/:id`, `/answer`, `/complete` | 48 lecciones | XP por lección (`RULES.XP_LESSON`, 15) | `app.js:545`, `578` |
| `#/palabras[/vista]`, `#/palabra/:id`, `#/repaso`, `#/practicar/:id` | Catálogo de 636 expresiones con filtros, favoritas, «por consolidar» y repaso SRS | `GET /api/vocab`, `/api/vocab/:id`, `GET/POST /api/practice*` | 636 expresiones, 22 categorías | Sin XP | `app.js:776`, `889`, `924` |
| `#/hablar`, `#/preparar/:id`, `#/sim/:id` | «Mesas clásicas»: 16 escenarios (8 variantes) con IA o con guion | `/api/scenarios`, `/api/sim*` | 16 escenarios, 52 momentos | 20 XP si se recorre, 5 si se abandona (README) | `app.js:616`, `643`, `689`; `sim.js`; `server/sim/engine.js` |
| `#/voz` | Laboratorio de voz: oír, grabar, escucharse, transcribir | `/api/voice/*` | n/a | Sin XP | `app.js:637`, `voice-lab.js:11` |
| `#/diagnostico` | Diagnóstico de 15 preguntas y ubicación por unidad | `/api/diagnostic*`, `/api/placement` | 15 preguntas | n/a | `app.js:310` |
| `#/sesion`, `#/breve`, `#/paso/*` | Redirigen a `#/hoy` | n/a | n/a | n/a | `app.js:1190` |

Catálogos desconectados (ids y estructuras distintas):

| Catálogo | Entradas | Lo usa |
|---|---|---|
| `content/frases*.js` (FRASES) | 463 en 19 temas | Aprender, Escuchar |
| `content/diccionario.js` (VIP) | 704 filas en 20 tablas | Temas, Diccionario, corrector (`construccion.js:4`) |
| `content/mesas.js` | 40 situaciones, 45 personajes | Mesas, Escuchar |
| `content/pronunciar.js` | 84 situaciones, 179 variantes | Pronunciar |
| `content/vocab.js` (VOCAB) | 636 expresiones | Palabras, Ruta, SRS |
| `content/units.js` + `lessons-extra.js` | 8 unidades, 48 lecciones | Ruta |
| `content/scenarios*.js` | 16 escenarios | Hablar |
| `content/diagnostic.js` | 15 preguntas | Diagnóstico (inalcanzable, ver 7) |

---

## 2. El bucle diario real

### 2.1 Jornada válida, paso a paso

Reglas en `server/practice.js:20` (`GOALS = { learn: 2, tables: 2, improve: 2 }`), `planOf` (`practice.js:~296`) y `settle` (`practice.js:~320`). La racha suma solo cuando las tres metas están completas (`validatePracticeDay(..., 'full')`, `progress.js`).

1. **Aprender (2 tandas).** Entrar, tocar «Generar frases». Se ven 4 frases con sus palabras nuevas y se hace un repaso tocando por frase (significado u ordenar). Al terminar, `POST /api/aprender/terminar` marca las 4 frases como vistas y suma 1 al contador. Una ronda de un Tema (juego de 8 palabras) suma lo mismo. Con la segunda tanda o juego: +15 XP.
2. **Mesas (2 mesas).** Generar mesa, atender 3 a 6 turnos hablando, terminar. Hay que haber intentado al menos la mitad de los turnos (`practice.js:628`). Con la segunda mesa: +25 XP. Cada mesa paga propina en monedas, tope ninguno.
3. **Pronunciar y escuchar (2 intentos).** Cada audio o situación con un intento de voz cuenta 1 (`practice.js:741`). Con el segundo: +15 XP.
4. Al completar las tres: «día completo», 55 XP en total, +20 monedas, +50 monedas por cada bloque de 7 días practicados. Protector de racha: 60 monedas, máximo 2.

Tiempo estimado: unos 10 a 15 minutos **(no verificado, sin telemetría de tiempo)**.

Lo que **no** exige: acertar, calidad mínima, ni usar nada de lo aprendido el día anterior. Un intento con 0 estrellas cuenta como intento (`practice.js:741`). Terminar una mesa con turnos en autoevaluación también cuenta (`practice.js:553`, `voz.js:94`).

### 2.2 Cómo elige las frases cada día

- **Aprender (`generateLearn`, `practice.js:503`).**
  1. Se parte de las 463 frases, o de un tema si se eligió.
  2. Se excluyen las 60 más recientes (`RECENT_PHRASES`, `:18`).
  3. Se prefieren las nunca vistas, barajadas. Entre ellas se priorizan las que usan palabras ya jugadas en los Temas, y `diversePack` evita que dos frases de la tanda compartan palabras clave y favorece las que enseñan palabras nuevas.
  4. Cuando no quedan frases sin ver, se toman al azar las que no están entre las 60 recientes.
  5. No existe peso por errores, por antigüedad ni por intervalo. «Vista» es la presencia de una clave `s1:frase:<id>` en `reward_events` (`practice.js:~224`, `seenPhrases`).
- **Memoria entre días:** `withMemory` (`practice.js:274`) conserva `recent` de ayer, de modo que la lista de recientes cruza la medianoche. Ese es el «más azar» del CHANGELOG 1.0.0.
- **Mesas:** la situación se elige al azar entre las del nivel, evitando las últimas 6 y los últimos 10 personajes (`content/mesas.js` `chooseScene`, `buildMesa`).
- **Escuchar/Pronunciar** (`pickLine`, `practice.js:694`): 20% de las veces rescata una frase de `tables.weak` (turnos con menos de 4 estrellas, máximo 12, solo esta temporada). Si no, 60% línea de cliente de una mesa, 20% frase de cliente tipo `clientLine`, 20% una de las 463 frases. Evita las 150 más recientes.

### 2.3 ¿Repite las mismas frases a diario? Análisis de `srs.js`

**Qué hace `srs.js`** (69 líneas): intervalos `[1, 3, 7, 14, 30]` (`srs.js:4`). Alta nueva: etapa 0, vence mañana. Acierto: sube una etapa **solo** si hoy no es el día de alta, ni del último repaso ni de un fallo, y ya venció (`srs.js:34-35`). Fallo: baja una etapa y vence mañana. `dueVocab` ordena por fallos y fecha. `scheduleSoon` adelanta a mañana lo que salió en una corrección. Está bien hecho, pero opera sobre ids de **VOCAB** (636 expresiones), no sobre FRASES, filas VIP ni líneas de Mesas.

**Quién lo llama** (comprobado por `grep`):

| Llamada | Alcanzable desde el menú nuevo |
|---|---|
| `daily.js:240` (`answerExercise`), `/api/daily/*` en `app.js:210-220` | No. Ningún archivo de `public/js` llama `/api/daily` |
| `app.js:309` respuestas de lecciones | Solo por la Ruta (Perfil → Lecciones) |
| `app.js:478` `/api/practice/answer` | Solo por Palabras / Repasar (Perfil → Expresiones) |
| `sim/engine.js:403` `scheduleSoon` | Solo por Hablar (desde la Ruta) |

**Conclusión:** en el bucle diario real el alumno **no** repite las mismas frases cada día. Con el mínimo (2 tandas = 8 frases al día) agota las 463 frases sin repetir en unos 58 días. A partir de ahí repite al azar con una ventana de 60. Lo único que tiene forma de repaso, y no es repetición espaciada, es: (a) cada frase se ve dos veces dentro de la misma tanda (aprender y luego un repaso tocando), y (b) el 20% de rescate de `tables.weak` en Escuchar/Pronunciar, que además no tiene fecha de vencimiento.

**Por qué los probadores lo sienten así:** piden repetición diaria de un grupo fijo y la app tiene un mecanismo (`srs.js`, documentado en el README como regla de «Repaso») que no está conectado al camino que recorren. «Mis palabras» (`aprender.js:38`) es una lista pasiva sin prueba. `GET /api/today` calcula `dueTomorrow` desde `vocab_progress` (`app.js:~131`), que para quien solo usa el menú nuevo siempre es 0.

**Lo que sí podría reutilizarse:** la lógica de etapas (50 líneas) con otra clave. Hace falta migrar las claves de frase (`frase:<id>`) a una tabla con etapa y fecha de vencimiento por frase y alumno.

---

## 3. Solapamientos, secciones débiles y huecos

### 3.1 Solapamientos

| Par | Qué hacen casi igual |
|---|---|
| Aprender → tanda de frases vs Temas (juegos VIP) | Ambos son «tanda» para la meta, ambos reconocimiento por toque (significado, ordenar, escuchar). Dos catálogos distintos (463 frases, 704 filas VIP) con dos tipos de ids |
| Temas vs Diccionario VIP | Mismo catálogo, uno en juego y otro en tablas con buscador. El diccionario, además, es el único lugar con verbos conjugados |
| Escuchar vs «Escuchar cómo se dice» en Mesas vs Voice Lab vs Temas («escucha y elige») | Cuatro formas de oír una línea; solo Escuchar pide repetirla y la evalúa |
| Pronunciar vs Mesas | Pronunciar es una mesa de un solo turno con el mismo corrector y una guía distinta. Comparte `freeAnswer`, `replyResult` y `buildMesa` (`guestLine`, `practice.js:~688`) |
| Palabras/Repaso (636 expresiones) vs Aprender (463 frases) | Dos catálogos de frases de servicio sin mapa entre ellos |
| Hablar (16 escenarios, IA o guion) vs Mesas | Dos motores de simulación distintos (`server/sim/engine.js` y `practice.js` + `content/mesas.js`), con evaluadores diferentes (`evaluate.js` por reglas y la combinación Azure + `construccion.js` + jurado) |
| Ruta (48 lecciones) vs Aprender | La Ruta tiene ejercicios con gramática explícita (`lessons-extra.js`) que Aprender no tiene |
| Diagnóstico/ubicación vs nada | El resultado de ubicación (`placement_unit`) solo lo leen `daily.js` y los flujos antiguos |

### 3.2 Secciones débiles o candidatas

- **Aprender frases (tanda):** solo reconocimiento. No hay audio, no hay producción, y `significado` y `armar` no envían su resultado al servidor (`aprender.js:112-156`): `finishLearn` marca vistas las 4 frases aunque haya fallado todo (`practice.js:531-540`). Es el punto más débil porque es el primer paso de la meta diaria.
- **Temas (juegos):** igual, el éxito se mide en el cliente (`misses`, `juegos.js:224`) y `finishGame` marca todas las palabras como practicadas (`practice.js:461-470`).
- **Ranking por propinas:** premia la cantidad de mesas, no la calidad, y se alimenta de un mecanismo sin tope.
- **Tienda:** 38 cosméticos con precios fijos y una sola moneda. En un producto de pago es potencial, pero hoy no refuerza el aprendizaje.
- **Hablar (clásico), Ruta, Palabras, Voice Lab, Diagnóstico:** funcionando y probados (hay tests) pero fuera del flujo. Candidatos a fusionar o retirar.
- **Fusionar candidatos:** Temas + Diccionario VIP en una sola sección de vocabulario; Pronunciar + Escuchar como «Escuchar y repetir / Responder» dentro de un mismo selector (ya comparten motor).

### 3.3 Huecos para aprender de verdad

1. **Repetición espaciada sobre lo visible**: no existe en el flujo diario (sección 2.3).
2. **Evaluación de la producción en Aprender**: se aprende por lectura y toque; hablar solo ocurre en las otras dos secciones y sin relación con lo recién aprendido.
3. **Ninguna conexión entre secciones**: las frases de Aprender no reaparecen como turnos de Mesas; los errores de Mesas llegan a Escuchar solo al 20% y con tope de 12.
4. **Progresión por nivel real**: no hay nivel de inglés ni de frases (FRASES no tiene dificultad); el diagnóstico se salta; la dificultad de Mesas sube por cantidad de mesas (`content/mesas.js:634` `levelFor`), no por desempeño.
5. **Gramática explícita y retroalimentación acumulada**: el corrector detecta ~25 errores típicos (`construccion.js`) pero no hay panel de «mis errores más frecuentes» ni práctica dirigida.
6. **Comprensión**: no hay escucha con preguntas de comprensión ni dictado. Escuchar es «oír y repetir».
7. **Contexto de menú real**: Mesas usa un menú fijo de 5 platos fuertes, 5 bebidas, 3 entradas, 3 guarniciones, 2 postres (`content/mesas.js:11-34`). El alumno real tiene el menú de su restaurante.
8. **Medición**: no hay registro por alumno de aciertos por frase ni historial de estrellas por turno (solo agregados: propinas y mesas).

---

## 4. Mesas, de punta a punta

Hay dos «mesas»; esta sección describe la del menú (la actual). Las clásicas están en 1.2.

### 4.1 Flujo

1. **Generar.** `POST /api/mesas/generar` → `generateMesa` (`practice.js:581`) → `buildMesa` (`content/mesas.js:690`). Entradas: mesas atendidas en la temporada (`done`), situaciones recientes (6) y nombres recientes (10). Se guarda en el estado de la jornada, `practice.tables.current`. Una mesa sin terminar se pierde al generar otra (no hay comprobación en `practice.js:581-595`).
2. **Dificultad** (`content/mesas.js:630`): niveles 1 a 4 al llegar a 0, 4, 10 y 20 mesas atendidas; con cada nivel se abren situaciones y turnos (3 a 4, 3 a 5, 3 a 5, 3 a 6). Con 0 mesas hay 15 situaciones; con 20 o más, 40.
3. **Escena y turnos.** Cada situación (`SCENES`, `content/mesas.js:408`) es un guion con turnos de cliente y la respuesta esperada del mesero (`SAY`, `:110`, con 109 variantes `R(...)` en el archivo). Hasta 30% de las mesas incluyen un imprevisto («ANYWHERE», `:375`). Personaje con voz Azure, acento, ánimo y nombre (`CAST`, `:40`).
4. **Ayuda por turno** (`assignHelp`, `practice.js:561`): las 2 primeras mesas de la temporada muestran la frase en inglés siempre; después cada turno la muestra con probabilidad 75/60/45/30% según el nivel, y los demás son «con tus palabras» con escalera de ayuda (pista → frase → pronunciación escrita, `mesas.js:19-22`).
5. **Voz.** Antes de cada turno el cliente habla (TTS, `POST /api/voice/speak`) con precarga del siguiente (`mesas.js:124`). Alumno: toca el micrófono, habla, la grabación se convierte a WAV 16 kHz en el navegador y se envía a `POST /api/voz/evaluar`.
6. **Evaluación** (`/api/voz/evaluar`, `app.js:648`): Azure Speech mide pronunciación (precisión, fluidez, prosodia, completitud). Si el turno es libre, el jurado (Groq y Gemini, o Azure OpenAI) recibe **solo texto** y valora la frase. `server/construccion.js` aplica reglas propias. Nota por turno: frase guiada 0,75·voz + 0,25·frase; frase libre 0,5·voz + 0,5·frase (`practice.js:~150-186`). Estrellas por umbrales de 92/80/66/48/20 y techos por parte débil; sin revisión de voz, máximo 4.
7. **Resultado por turno** (`voz.js:178`): estrellas, dos barras (Frase y Voz), error principal, «Mejor así», palabras tocables para oírlas, consejo; botones Seguir y Otra vez, y «Mi voz» para escucharse.
8. **Cierre.** `POST /api/mesas/:id/terminar` (`practice.js:621`): estrellas medias (redondeadas), turnos flojos (<4 estrellas) se guardan en `tables.weak`, propina = $2 por estrella (mejor intento de cada turno) + $5 si todo es 5 estrellas. Se paga como monedas (`award` con clave `mesa_done:fecha:id:propina`). Pantalla final con confeti, nivel, propina y «Otra mesa». Logros: primera conversación y confirmar una orden.

### 4.2 Puntos fuertes

- **Coste de IA casi cero por mesa:** el diálogo es guion, no LLM. El gasto es voz (Azure) y un juicio corto de texto.
- **Calificación en dos dimensiones** (Frase y Voz) con explicación de errores propios de hispanohablantes.
- **Variedad percibida alta**: 40 situaciones, 45 personajes, 8 ánimos, 15 acentos, imprevistos. Frases de ayuda con escalera.
- **Reintentos sin castigo** y reglas explícitas contra recompensar resultados sin sentido en turnos libres (`openTurnResult`, `practice.js:199`, máximo 1 estrella si no responde al tema).
- **Privacidad por diseño:** audio nunca se guarda, no se almacena texto salvo permiso (README Privacidad).

### 4.3 Puntos flojos

- **Cliente no escucha:** los turnos del cliente están fijos de antemano (`step(kind, guest, say, …)`, `content/mesas.js:~100`); lo que dice el alumno no cambia lo que responde el cliente. Es una lección con forma de diálogo.
- **Léxico limitado:** menú único (5 platos fuertes, 3 entradas, 2 postres, `content/mesas.js:11-34`) y una sola lista de nombres de clientes (8 apellidos).
- **Propinas sin tope:** `finishMesa` no limita mesas por día; el XP sí. Se pueden encadenar «Otra mesa» y acumular monedas y propinas. Ranking de propinas manipulable.
- **Mejor intento por turno:** `bestAttempt` (`practice.js:~595`) toma el máximo; reintentar hasta acertar siempre sube la propina.
- **Autoevaluación paga:** «Me salió bien» da 1 estrella ($2) y cuenta en la meta (`practice.js:553`, `voz.js:94`).
- **Dificultad por cantidad, no por desempeño.**
- **Resumen pobre:** no se vuelve a mostrar toda la conversación ni los errores de la mesa; se pierde el historial salvo `tables.weak`.
- **Avance que no sale de la jornada:** el estado vive en la fila diaria (`daily_sessions.state`, JSON), no en tablas propias; no hay historial consultable de mesas (solo `reward_events` con la clave de propina).

### 4.4 Qué faltaría para escalarlas

1. **Más escenarios:** el guion se escribe en JS (`SAY`/`SCENES`, 726 líneas). Habría que moverlo a datos (JSON/CSV) con revisión nativa y metadatos (nivel, categoría, vocabulario objetivo).
2. **Variantes de menú y de restaurante:** menú configurable por alumno o por tipo de local (la app ya tiene `content/menu.js` y la nota del README «sustituye `content/menu.js`»).
3. **Ramificación:** nodos con 2 a 3 salidas según lo dicho (la señal existe: `openTurnResult` ya detecta si respondió al tema).
4. **Dificultad real:** modular velocidad del cliente, acento, ruido, número de comensales y retirar ayudas por desempeño, no por conteo.
5. **Resumen de mesa:** transcripción con correcciones, 1 a 3 frases «para repasar» enviadas a la repetición espaciada, y comparación con la mesa anterior.
6. **Tope y fuente de monedas:** propina con límite diario o curva decreciente.
7. **Opción LLM:** el motor de IA ya existe para las clásicas (`sim/engine.js`) y podría reutilizarse con presupuesto por alumno.

---

## 5. Voz y micrófono

### 5.1 Flujo exacto (Mesas, Pronunciar, Escuchar)

Componente: `mountMic` (`public/js/voz.js:71`). Grabación: `TurnRecorder` (`public/js/audio.js:179`). Estados del botón: `idle` → `starting` → `recording` → `sending` → `idle` (con resultado).

1. `idle`: botón con micrófono y la etiqueta («Toca y habla en inglés»).
2. Toque → `toggle()` (`voz.js:119`): detiene cualquier audio (`stopPlayback`), crea `TurnRecorder({ maxMs: 20000, stopOnSilenceMs: 1700 })` y pasa a `starting` («Preparando micrófono…», spinner, botón desactivado).
3. `start()` (`audio.js:189`): `getUserMedia({ echoCancellation: false, noiseSuppression: false, autoGainControl: true })` en **cada** turno; `warmUp` espera hasta 1,2 s a que lleguen muestras reales; crea `MediaRecorder` con el primer formato soportado de `audio/mp4`, `audio/webm;codecs=opus`, `audio/webm`, `audio/ogg;codecs=opus`; espera el evento `onstart` (máx. 250 ms).
4. `recording`: botón rojo con icono de detener, etiqueta «Habla ahora», vibración de 30 ms si hay soporte, variable CSS `--level` con el volumen para animar el botón. Se detiene sola tras 1,7 s de silencio posterior a la voz, o a los 20 s, o al tocar de nuevo.
5. `stop()`: arma el `Blob`, calcula `silent` (sin datos, <400 ms, o pico < 6 con ≥5 muestras de nivel). Si es silencio: «No te escuchó» con reintento.
6. `sending`: «Revisando…». Se convierte a WAV mono 16 kHz con `OfflineAudioContext.decodeAudioData` (`pilot-wav.js:4`) y se envía a `/api/voz/evaluar` con tiempo límite de 40 s (`audio.js:330`).
7. Resultado en el servidor y pantalla (`resultHtml`, `voz.js:178`). Si la evaluación no existe o se agotó la cuota, el flujo cae a **autoevaluación**: «Escucharme» + «Me salió bien» (`voz.js:94`).

Reproducción del cliente: `speakCustomer` (`audio.js:124`) usa voz del servidor con caché de 40 frases y precarga del siguiente turno; si falla, cae a `speechSynthesis` del dispositivo con aviso «sin acento».

Retroalimentación visual existente: anillo de nivel de volumen, etiquetas de estado, avisos `notice-amber`, botón de altavoz con `attention` si el sistema bloquea el audio, `is-speaking` en el avatar del cliente.

### 5.2 Problemas de UX y fiabilidad

| # | Hallazgo | Dónde | Prioridad |
|---|---|---|---|
| V1 | Si `pilotWav` lanza error (formato no decodificable, >32 s), el mensaje dice «Puedes responder por texto» pero en Mesas, Pronunciar y Escuchar **no hay modo texto**. Además se lanza fuera del `try` de `assessSpeech` (`audio.js:331`), así que `mountMic.send` lo captura como error genérico y ofrece «Reintentar» con el mismo clip, que fallará igual | `pilot-wav.js:7-11`, `audio.js:330-346`, `voz.js:111-116` | Alta |
| V2 | Permiso del micrófono pedido en cada turno (`getUserMedia` + cierre del `stream` en `release`, `audio.js:309`). En iOS Safari y en la PWA instalada eso puede repetir el aviso de permiso y añade hasta ~1,5 s de latencia por turno **(no verificado en dispositivo)** | `audio.js:197`, `:238-257` | Alta |
| V3 | Sin manejo de segundo plano en el micrófono principal: `visibilitychange` solo existe en `sim.js:351` y `voice-lab.js:107`. Si entra una llamada o se cambia de app mientras se graba, la grabación sigue hasta 20 s o queda en un estado ambiguo. Solo hay `pagehide` global (`app.js:1233`) | `voz.js`, `audio.js` | Media |
| V4 | Autodetención por silencio con umbral absoluto fijo (`SPEECH_LEVEL = 12`, `audio.js:175`). En un restaurante ruidoso, o con eco del altavoz, `lastLoud` se renueva y nunca llega la parada: el alumno depende del tope de 20 s **(no verificado en campo)** | `audio.js:274-279` | Media |
| V5 | Se desactivan eco y supresión de ruido (`audio.js:197`) para no perder las primeras sílabas; riesgo de captar al cliente si el audio suena por altavoz mientras se graba. El código llama a `stopPlayback` al tocar el micrófono, pero la voz del cliente puede reanudarse con `speakGuest` desde otro toque | `audio.js:197`, `mesas.js:188` | Media |
| V6 | Si el `AudioContext` no queda en `running` (iOS lo suspende hasta un gesto), `warmUp` solo espera 400 ms y el medidor no funciona: ni nivel visual ni autodetención ni detección de silencio (`audio.js:243-244`, `:262`) | `audio.js` | Media |
| V7 | Desbloqueo del audio con un reproductor único activado en el primer `pointerdown` (`audio.js:14-20`). Funciona para iOS en teoría; si el primer toque llega con `currentAudio` activo, no se desbloquea y el aviso depende del `NotAllowedError` **(no verificado en iOS)** | `audio.js:15-20` | Media |
| V8 | Fallbacks silenciosos: cualquier fallo del TTS del servidor cae a la voz del dispositivo con el aviso pequeño `#voicenote`; la calidad de `speechSynthesis` varía mucho por teléfono | `audio.js:146-152` | Baja |
| V9 | Mensajes de permiso útiles (`MIC_HELP`, `voz.js:7`) pero sin guía para iOS (Ajustes → Safari → Micrófono) ni para la PWA instalada | `voz.js:7-13` | Media |
| V10 | `maxMs` de 20 s de turno vs. mensaje de 30 s; conversión local y 40 s de espera: el flujo completo en 4G lento no se midió **(no verificado)** | `voz.js:136`, `audio.js:333` | Baja |
| V11 | Estado `starting` bloquea el botón sin tiempo límite: si `getUserMedia` no responde (diálogo de permiso ignorado), el alumno queda sin salida salvo salir de la pantalla | `voz.js:142-153` | Media |
| V12 | `VOZ.md` está obsoleto: describe «0.3.2» y la arquitectura de OpenAI/Anthropic, mientras la voz actual es Azure Speech más el jurado. Su lista de «próxima prueba real» (iPhone, Android, 3 frases) sigue sin evidencia en el repositorio | `VOZ.md:1-70` | Baja |

---

## 6. Riesgos para pasar a producto público

| Riesgo | Evidencia | Estado |
|---|---|---|
| **Cuentas solo por invitación y tope de 7** | `MAX_STUDENTS = 7` (`server/auth.js:5`); invitación de 7 días; no hay registro público (README) | Comprobado |
| **Sin pagos ni suscripciones** | No hay referencias a proveedor de pagos en `server/` ni `public/` (búsqueda por Stripe, PayPal, billing, checkout) | Comprobado |
| **Sin correo ni recuperación de contraseña** | La tabla `users` no tiene campo de correo (`server/db.js:7`); solo la administración crea una contraseña temporal (`/api/admin/student/:id/password`) | Comprobado |
| **Sin términos, política de privacidad ni consentimiento de edad en la interfaz** | La búsqueda en `public/js` y `server/` no encontró pantallas ni textos de términos o consentimiento, salvo la nota de `mesas.js:68` | Comprobado en código; documentos legales externos **no verificados** |
| **Datos a terceros** | La voz va a Azure; el texto de respuestas libres a Groq y a Google Gemini (`mesas.js:68`). `.env.example` advierte que en el plan gratuito de Gemini Google puede usar los textos para mejorar sus productos | Comprobado |
| **Topes de coste de IA globales, no por alumno** | `checkLimit` (`server/voice/index.js:65-77`) suma el mes de **todos** los usuarios; solo `stt` tiene tope diario por usuario (900 s). TTS y jurado no tienen tope por usuario. Un alumno puede agotar el mes de todos. Los topes por defecto asumen el plan gratuito F0 de Azure (`config.js:7`) | Comprobado |
| **Coste del TTS no acotado por caché de servidor** | `/api/voice/speak` (`app.js:692`) llama al proveedor en cada petición; solo hay caché de 40 elementos en el navegador (`audio.js:106`). Las mismas frases de guion se vuelven a sintetizar para cada alumno **(no verificado si el proveedor cachea)** | Comprobado en código |
| **Uso sin tarifas** | `rates` se dejan vacías a propósito (`config.js:51-58`): el panel no estima costo en dinero | Comprobado |
| **Ranking global con nombres visibles** | `leaderboard` (`practice.js:763`) expone nombre visible, racha y propinas de todas las cuentas activas a todos los alumnos; `RANKING_HIDDEN` oculta una cuenta a mano | Comprobado |
| **Contenido sin revisión nativa** | README: «Ninguna persona nativa ni un mesero ha revisado el contenido» (66 de 636 expresiones leídas por completo, el resto solo por validaciones automáticas). Las 463 frases y las 704 filas VIP tienen validaciones de test, no revisión de persona | Comprobado en docs |
| **Pronunciación escrita aproximada** | `content/pronunciacion.js`; el propio texto de la app dice que es una ayuda | Comprobado |
| **Evaluación basada en reglas con lexicón limitado** | `construccion.js` y `evaluate.js` detectan ~25 patrones; el resto depende del jurado (que puede fallar y cae a reglas). Calidad con acentos diversos y en español **no verificada** | Parcial |
| **Escalabilidad de datos** | `daily_sessions.state` es un JSON por día con todo el estado de práctica; `statsFor` recorre todas las filas de `reward_events` de la temporada en cada petición; el ranking hace consultas por usuario (N+1). Hay modo Postgres (`config.js:31`, `POSTGRES.md`) pero el piloto usa SQLite | Comprobado; efecto a escala **no verificado** |
| **Infraestructura** | «Todavía no hay una dirección permanente» (README); sin https no hay micrófono. No hay service worker (`public/` solo tiene `manifest.webmanifest`), así que no hay modo sin conexión | Comprobado |
| **Cabeceras de seguridad y limitación de ritmo** | Se encontró limitación de intentos de acceso (`app.js:144`) pero no cabeceras de seguridad (CSP, etc.) en `server/app.js` | Comprobado el hallazgo de búsqueda; revisión de seguridad completa **no realizada** |
| **Modelo de motivación** | Monedas sin tope por mesas, ranking por propinas, tienda cosmética, protector con costo: en un producto abierto invita a explotar el bucle | Inferencia |
| **Marca y derechos** | `docs/DESIGN.md` es una referencia de estilo de otra empresa (Duolingo) y `PARA_EL_PRIMO.md`/`REVISION.md` son documentos de piloto. La app usa ya su propio lenguaje visual (lienzo negro), pero conviene revisar derechos de logros, mascota y textos antes de publicar | Inferencia |

---

## 7. Bugs y deudas concretas

Orden aproximado por importancia.

| # | Hallazgo | Archivo:línea |
|---|---|---|
| D1 | SRS desconectado del bucle diario (ver 2.3); README sigue prometiendo «Repaso a 1, 3, 7, 14 y 30 días» | `server/srs.js:4`, `server/practice.js` (sin import de `srs.js`), `README.md` («Reglas de progreso») |
| D2 | `viewWelcome` llama `POST /api/diagnostic/skip` y manda a Hoy: el diagnóstico (15 preguntas, ubicación) es inalcanzable para un alumno nuevo. `placement_unit` solo lo usan `daily.js` y flujos antiguos; la selección de frases y mesas lo ignora. `viewDiagnostic` termina enlazando `#/sesion`, que ahora redirige | `public/js/app.js:178-194`, `:310`, `:421`, `server/daily.js:23`, `:70` |
| D3 | Sesión diaria antigua aún se crea cada día (`createState`: `pickToday`, ejercicios, `nextScenario`) y se guarda en `daily_sessions.state` junto al estado nuevo `practice`. `load()` de `practice.js` depende de `getSession`. Las rutas `/api/daily*` no las llama nadie del cliente. `GET /api/today` calcula y devuelve `session` que `viewToday` no usa | `server/daily.js:79-100`, `:102`, `server/practice.js:286`, `server/app.js:196`, `:210-220` |
| D4 | La meta «Aprender» no verifica nada: `finishLearn` solo comprueba que haya una tanda abierta; `generar` + `terminar` seguidos pagan la tanda y marcan vistas 4 frases sin interacción. Los aciertos/fallos de «significado» y «armar» nunca se envían | `server/practice.js:531-540`, `public/js/aprender.js:102-156`, `:175` |
| D5 | Temas: las estrellas finales se calculan en el cliente (`misses`) y `finishGame` marca todas las palabras como practicadas, haya fallado o no | `public/js/juegos.js:224`, `server/practice.js:461-470` |
| D6 | Intentos de voz cuentan siempre (0 estrellas, autoevaluación, o tras quedar sin cuota), contradiciendo la intención de que lo que no se evalúa «no premia» | `server/practice.js:741`, `:553`, `public/js/voz.js:94`, `:113` |
| D7 | Propinas y monedas sin tope diario; `bestAttempt` toma el máximo por turno; mesas y «Otra mesa» ilimitadas; ranking por propinas se alimenta de eso | `server/practice.js:553`, `:621-660`, `:763` |
| D8 | `generateMesa` sobrescribe la mesa en curso sin avisar ni comprobar | `server/practice.js:581-595` |
| D9 | Dificultad por cantidad: se sube de nivel aunque todas las mesas salgan con 1 estrella | `content/mesas.js:630-640` |
| D10 | `pilotWav` lanza `Error` fuera del `try` de `assessSpeech` y su mensaje sugiere un modo texto que no existe en estas secciones (ver V1) | `public/js/pilot-wav.js:7-11`, `public/js/audio.js:331` |
| D11 | Opción `section:` que pasan las vistas a `shell(...)` se ignora (`shell` solo lee `tab` y `focus`) | `public/js/mesas.js:93`, `aprender.js:66`, `mejorar.js:40`, `juegos.js:15` frente a `app.js:68` |
| D12 | Fórmula de propina duplicada y con número fijo en el cliente (`* 2`), frente a `TIP_PER_STAR` del servidor; el cliente calcula una propina «estimada» | `public/js/mesas.js:102`, `server/practice.js:23` |
| D13 | Rama muerta: `starsFromRatio` repite 4 para ≥0,95 y ≥0,8 | `server/practice.js:26` |
| D14 | La temporada está fija en código (`SEASON = { id: 1, start: '2026-11-07T...' }`) y hay un **regalo de 5000 monedas con nombre de usuario escrito en el código** (`SEASON_GIFTS`), que se evalúa en cada llamada a `statsFor` | `server/season.js:5`, `:11-13`, `server/app.js:133` |
| D15 | `statsFor` recorre todas las filas de `reward_events` de la temporada en cada petición y se llama varias veces por pantalla; el ranking hace consultas por usuario | `server/app.js:~121-134`, `server/practice.js:763-780` |
| D16 | `/api/practice/answer`: comprobación de idempotencia fuera de la transacción (condición de carrera); `/api/practice` sin progreso devuelve siempre las 5 primeras expresiones | `server/app.js:~457-481` |
| D17 | Documentación desfasada: README dice «Versión 0.4.0», «hasta cinco», XP 10/20 y «jornada válida: tres repasos y una respuesta contextual», todo anterior al modelo actual (2/2/2, 15/25/15, 7 alumnos). `VOZ.md` y sus enlaces describen 0.3.2. Existe además una carpeta `para-github/` que duplica README, CHANGELOG, contenido y docs (riesgo de divergencia) | `README.md:3`, `README.md` (sección «Reglas de progreso»), `VOZ.md:1`, `para-github/` |
| D18 | Estado guardado como JSON en una fila diaria: sin consulta de historial de mesas, intentos ni errores; solo `reward_events` y `usage_log` | `server/db.js:96-103`, `server/practice.js:274-292` |
| D19 | Tests: `test/` tiene 17 archivos (16 `.test.js` o de integración más `helpers.js`); no vi pruebas del cliente de interfaz fuera de `audio-lifecycle` y `design`. La cobertura del flujo diario sí existe (`practice.test.js`) **(no ejecutados en esta auditoría)** | `test/` |
| D20 | Modelo por defecto de la IA conversacional `claude-opus-5-5` (el más caro) solo para las mesas clásicas; sin control de coste por alumno | `server/config.js:34` |

---

## 8. Inventario de componentes de UI que existen de facto

Fuente: `public/styles.css` (1081 líneas, variables en `:root` desde la línea 9) y los `*.js` de `public/js/`. Tema único oscuro (`color-scheme: dark`) con un color por sección: aprender `--learn`, mesas `--table`, mejorar `--improve`, acción principal `--action` (amarillo). Tipografía Nunito. Radios: `--radius` 30, `--radius-btn` 20, `--radius-sm` 14.

Hay variables heredadas duplicadas (`--green`, `--green-soft`, `--blue`…, `styles.css:34-42`) y la clase `.fold` y `.chip` tienen varias variantes por sección.

| Familia | Clases / funciones existentes | Dónde se usa |
|---|---|---|
| **Botones** | `.btn` (+ `-primary`, `-block`, `-sm`, `-xl`, `-xxl`, `-ink`, `-help`, `-improve`, `-green`), `.iconbtn` (`-fill`, `-dark`), `.text-btn` (`-light`), `.skip-link`, `.linkbtn`, `.mic` (`-idle`, `-recording`, `-sending`) | En todas las pantallas |
| **Tarjetas** | `.card` (`-quiet`, `-hl`), `.tile` (`-streak`, `-coins`, `-tips`, `-level`, `-xp`, `-word`), `.phrase-card`, `.reply-card`, `.reply-sample`, `.celebrate-card`, `.news-card`, `.shield-card`, `.shop-card`, `.level-card`, `.vip-card`, `.today-step`, `.week-card`, `.topic` (1 a 4), `.mode`, `.step`, `.node`, `.guest`, `.yourturn`, `.result` | Hoy, Aprender, Mesas, Tienda, Perfil |
| **Encabezados de pantalla** | `.hero` (`-today`, `-learn`, `-table`, `-improve`, `-vip`, `-temas`, `-shop`, `-rank`, `-profile`), `.display`, `.eyebrow`, `.hero-count`, `.ex-top` (barra superior de ejercicio) | Todas |
| **Listas y desplegables** | `.fold` (`fold-list`, `fold-title`, `fold-meta`, `fold-chevron`, `fold-body`, `foldHtml()` en `guia.js:34`), `.link-list`, `.my-words`, `.rank-row`, `.tab-list` | Perfil, Aprender, VIP |
| **Navegación** | `.tabbar` + `.tab` (móvil abajo, escritorio como barra lateral), `.topbar`, `.brand`, `.stats-menu`, `.tabs` y `.chip` como pestañas, `.shop-tabs`, `.rank-tabs` | `shell()` en `app.js:68` |
| **Barras de progreso** | `.bar` (`-learn`, `-table`, `-improve`), `.xp-bar` (`-lg`), `.ring` (anillo con `--p`), `.topic-progress`, `.learn-progress`, `.parts`/`.part` (Frase y Voz), `.level-xp` | Pasos, mesas, nivel, resultados |
| **Chips y etiquetas** | `.chip` (`-xp`, `-coin`, `-combo`, `-table`, `-green`, `-blue`, `-amber`, `-ink`, `-xp-on`, `-learn-on`), `.step-tag`, `.shop-tag`, `.count-pill`, `.tip-pill`, `.tag-next`, `.status-mode` (`-demo`, `-ai`) | Varias |
| **Modales y capas** | `#overlay`, `.modal` + `.modal-card` (hoja inferior), `.celebrate`, `.news`, `.shop-sheet`, `.update-bar`, `.toast`, `.confetti` | `app.js:121`, `:196`, `:482`; `tienda.js:70`; `core.js:87-146` |
| **Opciones y juegos** | `.option` (`.is-right`, `.is-wrong`), `.token`/`.pool`/`.built`, `.pair`, `.letter-slot`, `.wordcard`, `.wordgrid`, `.stack` | Aprender, Temas, ejercicios |
| **Voz** | `.mic-wrap`, `.mic`, `.mic-label`, `.ear`, `.avatar` (`-xl`, colores), `.bubble`, `.stars`/`.star`, `.said` (`.w-ok`, `.w-no`), `.say-*`, `.fix`, `.better`, `.tip`, `.heard`, `.coach`, `.pron-note` | `voz.js`, `mesas.js`, `mejorar.js` |
| **Avisos** | `.notice` (`-green`, `-amber`), `.guide` y `guide-steps` («¿Cómo funciona?», `guia.js:14`), `.fb` (`-ok`, `-no`) | Varias |
| **Formularios** | `.input`, `.field`, `.switch` | Perfil, administración, acceso |
| **Mascota** | `capybara()` con animales y 5 ranuras de ropa (`capybara.js:142`, 160 líneas de SVG) | Hoy, Tienda, Ranking, Mesas |
| **Utilidades** | `.stack`, `.stack-lg`, `.stack-tight`, `.row`, `.row-center`, `.row-wrap`, `.spread`, `.grow`, `.center`, `.muted`, `.small`, `.sr`, `.spinner` (`-lg`), `.stage`, `.page` (`-wide`, `-mid`) | Todas |
| **Iconos** | Objeto `icons` y `statIcons` (`core.js:56`, `:80`) en SVG de línea; íconos específicos repetidos en línea en `aprender.js:43`, `mejorar.js:9`, `vip.js:6` | Todas |
| **Sonidos** | `playSfx` (`core.js:109`) por tipos (`tap`, `good`, `great`, `miss`, `level`) | Respuestas y recompensas |

Observaciones para el sistema de diseño:

- No hay una fuente única de componentes: casi todo se arma con plantillas de texto en cada vista (`innerHTML` con `esc()`); las mismas piezas (opción de respuesta, barra de progreso, tarjeta de resultado) se reescriben en `aprender.js`, `juegos.js`, `exercise.js` y `mesas.js`.
- Hay tres lenguajes de pantalla convivientes: las nuevas (hero + `ex-top` + `stage`, color por sección), las de Perfil y administración (tarjetas y `fold`) y las antiguas (`step`, `node`, `.card` de la Ruta y Hablar), con nombres heredados.
- Estados repetidos que convendría unificar: carga (`spinner-lg` dentro de `stage center`), error (`notice-amber`, `errorView`), vacío (`rank-empty`, `words-empty`) y resultado (`fb`, `result`, `celebrate`).
- Los colores de sección están atados a las tres secciones actuales; reformar el menú obligará a rehacer ese mapeo.
- La accesibilidad base existe (`:focus-visible`, `aria-label`, `role="progressbar"`, `aria-live`), aunque `.mic-label` con `role="status"` y los botones deshabilitados por `aria-disabled` en enlaces (`mejorar.js:24`) merecen revisión **(no verificado con lector de pantalla)**.
