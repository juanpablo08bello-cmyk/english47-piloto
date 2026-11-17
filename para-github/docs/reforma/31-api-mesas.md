# API de Mesas 2.0 (servidor)

Contrato para el cliente nuevo (`web/`). Todo va por `fetch` con la cookie de sesión; el cuerpo es JSON y las respuestas también. Los errores tienen siempre la forma `{ "error": "codigo", "message": "texto para mostrar" }` (a veces con campos extra, que se indican). El servidor decide estrellas, propinas, XP y racha: el cliente solo muestra.

Última actualización: 16/11/2026. Implementa los puntos 1 a 5 de la petición de «terminar Mesas en el servidor». Lo compatible con el cliente anterior sigue igual: `POST /api/mesas/generar` sin cuerpo es lo de siempre (un Turno en Harbor 47).

## Resumen de rutas

| Método y ruta | Para qué |
|---|---|
| `GET /api/mesas` | Pantalla de Mesas: mesa en curso, Turno, locales con estado, menú propio y datos del Servicio libre |
| `POST /api/mesas/generar` | Genera una mesa (Turno o Servicio libre) |
| `POST /api/mesas/:id/turno` | Responde un turno de la mesa (texto o autoevaluación) |
| `POST /api/voz/evaluar?tipo=mesa&id=&index=` | Igual, con audio WAV evaluado por Azure |
| `POST /api/mesas/:id/terminar` | Cierra la mesa (y el Turno, si era la última) |
| `GET /api/mesas/menu` | Mi menú propio |
| `POST /api/mesas/menu` | Guardar mi menú (lista de platos o CSV pegado) |
| `DELETE /api/mesas/menu/:id` | Borrar un plato |
| `DELETE /api/mesas/menu` | Borrar todo mi menú |

Códigos de error que pueden aparecer: `400 bad_request` / `invalid_menu` / `too_short`, `401 not_authenticated`, `403 locked`, `404 not_found`, `409 conflict` / `menu_incompleto` / `too_many`, `503 unavailable`.

## Modos

- **Turno** (`modo: "turno"`, el predeterminado): una «noche» de **3 a 5 mesas** según el nivel (niveles 1 y 2: 3; nivel 3: 4; nivel 4: 5). Tiene estado propio (`turno`), cierra con una **reseña** y es lo único que cuenta para la **meta diaria de Mesas (2 mesas)**, el **nivel de dificultad** (mesas atendidas) y, por tanto, la **racha**. Las mesas de un Turno siguen pagando propina como antes: 2 dólares por estrella (mejor intento de cada turno) y 5 de bono por mesa perfecta, en monedas.
- **Servicio libre** (`modo: "libre"`): mesas sin límite, una tras otra. Se puede elegir local, dificultad y tipo de cliente. **No** suma meta diaria, nivel ni racha, ni paga XP. Sí **registra el aprendizaje igual** (las frases flojas van a `tables.weak` y de ahí al repaso de Escuchar/Pronunciar). Su propina tiene **curva decreciente y tope diario** (abajo).

Solo hay una mesa en curso por cuenta: generar otra (de cualquier modo) descarta la anterior sin terminar. Una mesa descartada no cuenta para el Turno.

### Propina del Servicio libre

- Base: 2 dólares por estrella del **primer intento** de cada turno (reintentar sirve para aprender, no sube la propina) y **sin** bono de mesa perfecta.
- Curva: la base se multiplica por `1, 0.8, 0.6, 0.4, 0.25, 0.1` según cuántas mesas libres llevas hoy (a partir de la sexta, `0.1`).
- Tope: **60 monedas por día** de Servicio libre (por fecha local del alumno). Al llegar, la propina es 0 (el aprendizaje no tiene tope).
- Las propinas libres suman a las monedas y al contador de propinas del ranking, igual que las del Turno (la clave del libro mayor es `mesa_libre:<fecha>:<id>:<propina>`).

### Locales y desbloqueo

| id | nombre | local (ficticio) | sala | se abre con |
|---|---|---|---|---|
| `cafe` | Café | Sunrise Café | `sala_cafe` | desde el inicio |
| `brunch` | Brunch | Palm Brunch House | `sala_brunch` | 4 mesas de Turno (nivel 2) |
| `steakhouse` | Steakhouse | Harbor 47 | `sala_steakhouse` | desde el inicio (el menú de siempre; es el predeterminado) |
| `rooftop` | Rooftop | Skyline Rooftop | `sala_rooftop` | 10 mesas de Turno (nivel 3) |
| `hotel` | Hotel de Ocean Drive | The Ocean Hotel | `sala_hotel` | 20 mesas de Turno (nivel 4) |

El nivel sale de las mesas de Turno atendidas (nivel 2 = 4 mesas, nivel 3 = 10, nivel 4 = 20), así que «por mesas o por nivel» es la misma condición dicha de dos maneras. Cada local tiene su carta, su vocabulario y situaciones que no encajan (un café no vende vino, el rooftop no sirve desayunos). La imagen del salón es `/art/<sala>.webp`.

Además existe el local especial **`propio`**: tu propia carta (ver Menú propio). No cuenta en `restaurantes`; su estado va en `propio`.

---

## `GET /api/mesas`

Sin cuerpo. Respuesta 200:

```jsonc
{
  "mesa": { /* Mesa */ } | null,            // la mesa en curso (null si no hay o ya terminó)
  "comanda": { /* Comanda */ } | null,      // su orden, para dibujar el ticket
  "count": 0, "goal": 2,                    // mesas de Turno de hoy / meta diaria
  "progress": { "level": 1, "done": 0, "toNext": 4, "min": 3, "max": 4, "tips": 0 },
  "turno": { /* Turno */ } | null,          // el Turno de hoy (abierto, o el último cerrado)
  "restaurantes": [
    {
      "id": "brunch", "nombre": "Brunch", "local": "Palm Brunch House", "blurb": "Mesas largas, huevos y mimosas",
      "sala": "sala_brunch", "imagen": "/art/sala_brunch.webp",
      "estado": "bloqueado",                // "abierto" | "bloqueado"
      "condicion": { "mesas": 4, "nivel": 2, "texto": "Atiende 4 mesas de Turno (nivel 2)" },
      "progreso": { "atendidas": 1, "necesarias": 4, "restantes": 3 }
    }
    // ... los 5, en el orden cafe, brunch, steakhouse, rooftop, hotel
  ],
  "propio": { "disponible": true, "platos": 6, "maximo": 60, "listo": true, "faltan": [] },
  "libre": {
    "mesasHoy": 0, "propinasHoy": 0, "tope": 60, "restante": 60, "siguienteFactor": 1,
    "dificultadMax": 1,                     // máxima dificultad que se puede elegir (= nivel desbloqueado)
    "clientes": [ { "id": "turista", "nombre": "Turista", "descripcion": "..." } /* turista, ejecutivo, vip, familia, influencer */ ]
  }
}
```

`propio.disponible` es `false` si el servidor usa PostgreSQL y la migración 002 todavía no se aplicó (ver Migraciones). `propio.faltan` lista en español lo que falta para poder jugar (p. ej. «Necesitas al menos 2 platos principales (tienes 1).»).

## `POST /api/mesas/generar`

Cuerpo (todo opcional; sin cuerpo = Turno en Harbor 47):

| Campo | Valores | Notas |
|---|---|---|
| `modo` | `"turno"` (predeterminado) \| `"libre"` | Otro valor: `400 bad_request` |
| `restauranteId` | `cafe`, `brunch`, `steakhouse`, `rooftop`, `hotel`, `propio` | Turno: el del Turno en curso, o `steakhouse` si no hay. Libre: al azar entre los abiertos. Local bloqueado: `403 locked`. Inexistente: `400 bad_request`. En un Turno en curso, pedir otro local: `409 conflict` |
| `dificultad` | entero `1..nivel desbloqueado` | Solo libre. Fuera de 1–4 o no entero: `400`. Mayor que la desbloqueada: `403 locked`. Con `modo: "turno"`: `400` |
| `cliente` | `turista` \| `ejecutivo` \| `vip` \| `familia` \| `influencer` | Solo libre. Con `modo: "turno"`: `400` |
| (`propio`) | sin menú listo | `409 menu_incompleto`; si el servidor aún no tiene la migración: `503 unavailable` |

Respuesta 200:

```jsonc
{
  "modo": "turno",
  "mesa": {
    "id": 7, "title": "Mesa de Linda", "scene": "orden", "sceneEs": "Tomar la orden", "level": 1,
    "persona": { "name": "Linda", "voice": "Kore", "azure": "en-US-AvaNeural", "accent": "us", "accentEs": "Estados Unidos", "mood": "hurry", "moodEs": "Con prisa",
                 "cliente": "ejecutivo", "clienteEs": "Ejecutivo", "pace": "fast" },   // las 3 últimas solo si se eligió cliente
    "party": 4,
    "steps": [ { "kind": "order", "guest": { "en": "...", "es": "..." }, "say": { "en": "...", "es": "...", "goal": "...", "pron": "..." | null }, "show": "en" | "free" } ],
    "closing": { "en": "...", "es": "..." },
    "menuFacts": { "drink": "...", "main": "...", "side": "..." | null, "temp": "..." | null, "restaurant": "Harbor 47 (restaurante ficticio)" },
    "modo": "turno", "turnoId": 1, "restauranteId": "steakhouse",
    "restaurante": { "id": "steakhouse", "nombre": "Steakhouse", "local": "Harbor 47", "sala": "sala_steakhouse" },
    "attempts": {}, "finished": false
  },
  "comanda": { /* Comanda, con todo pendiente */ },
  "turno": { /* Turno */ } | null,          // null en Servicio libre sin Turno abierto
  "libre": { /* solo en modo libre: mesasHoy, propinasHoy, tope, restante, siguienteFactor */ }
}
```

`persona.pace` (`slow` | `normal` | `fast`) debe viajar tal cual en `persona` al llamar a `POST /api/voice/speak`: el servidor lo traduce al ritmo de la voz (`slow` -18 %, `fast` +4 %, `normal` deja el del ánimo).

### Turno (objeto)

```jsonc
{
  "id": 1, "total": 3, "hechas": 1, "restantes": 2,
  "estrellas": [4],                // estrellas de cada mesa hecha (null si fue solo autoevaluación)
  "propinas": 32, "restauranteId": "steakhouse",
  "estado": "abierto",             // "abierto" | "cerrado"
  "nivel": 1,
  "mesas": [ { "id": 7, "scene": "orden", "cliente": "Linda", "stars": 4, "tip": 32, "perfect": false, "weak": ["..."] } ],
  "cierre": null                   // al cerrarse, ver abajo
}
```

El Turno vive en la jornada: si pasa la medianoche (hora local del alumno) sin cerrarlo, se pierde y se empieza otro al generar. Cuando un Turno se cierra, la siguiente `generar` en modo `turno` abre uno nuevo (`id` +1) aunque sea el mismo día.

## `POST /api/mesas/:id/turno`

Cuerpo: `{ "index": 0, "heard": "texto dicho" }` o `{ "index": 0, "selfCheck": true }`. Respuesta 200:

```jsonc
{
  "result": { /* igual que antes: words, stars, understood, tip, ... */ },
  "comanda": { /* Comanda actualizada */ }
}
```

`404 not_found` si la mesa ya terminó o no es tuya, o el turno no existe. El texto oído **no se guarda** (solo estrellas y el resultado de la comprobación de la orden).

### Comanda (objeto)

```jsonc
{
  "items": [
    { "tipo": "plato", "etiqueta": "Plato", "turno": 0, "estado": "confirmado", "valor": { "en": "ribeye", "es": "el ribeye" } },
    { "tipo": "coccion", "etiqueta": "Cocción", "turno": 1, "estado": "pendiente", "valor": null }   // pendiente: sin valor
  ],
  "total": 3, "confirmados": 1, "pendientes": 2,
  "tieneConfirmacion": true,        // la mesa tiene un turno de «confirmar la orden»
  "verificacion": { "ok": false, "problemas": ["Faltó el término del ribeye: medium rare."] } | null,
  "ordenConfirmada": false          // true/false; null si la mesa no tiene confirmación
}
```

- `tipo`: `plato`, `entrada`, `guarnicion`, `coccion`, `bebida`, `postre`, `alergia`. `turno` es el índice del turno donde el cliente lo dice.
- Un dato pasa a `confirmado` cuando el alumno responde ese turno con **3 estrellas o más** (la autoevaluación también lo anota). Una respuesta floja lo deja `pendiente`.
- Al responder el turno de **confirmar la orden** (`kind: "confirm"`), con texto, el servidor compara lo dicho con el pedido usando `server/order.js` (plato, cocción, guarnición) y devuelve `verificacion` con avisos en español. **No cambia las estrellas ni la propina.** `ordenConfirmada` es `true` si respondió bien y la verificación no encontró problemas.
- Las mesas sin pedidos (por ejemplo, «Pasar por la mesa») traen `items: []`: no hay ticket que dibujar.

## `POST /api/voz/evaluar?tipo=mesa&id=<mesa>&index=<turno>`

Igual que hasta ahora (cuerpo `audio/wav`). La respuesta suma `comanda` (la misma de arriba): `{ status, heard, result, attempts, daily, comanda }`.

## `POST /api/mesas/:id/terminar`

Sin cuerpo. Exige haber respondido al menos la mitad de los turnos (`400 too_short`). Repetirla devuelve lo mismo sin pagar otra vez (`duplicate: true`). Respuesta 200:

```jsonc
{
  "modo": "turno",
  "summary": {
    "stars": 4, "answered": 4, "total": 4, "weak": [ /* hasta 3 frases flojas */ ], "selfCheck": false, "tip": 32, "perfect": false,
    "modo": "turno", "restauranteId": "steakhouse",
    "libre": { "base": 32, "factor": 0.8, "topeAlcanzado": false, "mesasHoy": 2, "propinasHoy": 58, "tope": 60, "restante": 2, "siguienteFactor": 0.6 }   // solo en libre
  },
  "rewards": { "xp": 25, "coins": 0, "bonus": 0, "newDay": false, "achievements": [] },   // en libre siempre en cero
  "plan": { /* plan del día, como siempre */ },
  "progress": { "level": 1, "done": 1, "toNext": 3, "min": 3, "max": 4, "tips": 32 },
  "levelUp": false,                  // en libre siempre false
  "turno": { /* Turno actualizado; en la última mesa, estado "cerrado" y "cierre" */ },
  "comanda": { /* orden final */ },
  "stats": { /* monedas, XP, racha */ }
}
```

### Cierre del Turno (`turno.cierre`)

Aparece al terminar la última mesa del Turno (`turno.estado === "cerrado"`):

```jsonc
{
  "estrellasMedias": 4.3,            // media de las mesas calificadas (null si todo fue autoevaluación)
  "estrellas": 4,                    // estrellas de la reseña, 1 a 5
  "propinas": 96,                    // suma de las propinas de las mesas
  "perfectas": 1,
  "resena": { "estrellas": 4, "en": "Very good service. ... 1 table was perfect.", "es": "Muy buen servicio. ... 1 mesa fue perfecta.", "autor": "Linda", "local": "Harbor 47" },
  "debiles": [ "frases para repasar mañana, hasta 4" ]
}
```

La reseña usa plantillas por resultado (sin IA); la misma noche da siempre la misma reseña. **XP y monedas siguen las reglas de siempre:** el Turno no inventa premios; la meta diaria paga 25 XP una vez al llegar a 2 mesas, y los 20 de «día completo» llegan cuando están las tres secciones. La propina del Turno es la suma de las de sus mesas (ya cobradas, una por mesa).

---

## Menú propio

El gerente (o el alumno) carga su carta y las mesas de `restauranteId: "propio"` usan **sus** platos: nombres reales, pregunta de cocción para la carne, guarniciones, alérgenos y sustituciones. Una cuenta tiene **un** menú, de **máximo 60 platos**.

**Privacidad.** Cada consulta filtra por `user_id`: solo el dueño ve, cambia o borra su menú. No hay ninguna ruta de administración que lo lea, y borrar la cuenta lo borra (clave foránea con `ON DELETE CASCADE`). **Pendiente:** compartirlo con los meseros del mismo restaurante. Hoy la base no tiene la relación restaurante–alumno (solo cuentas con rol `student` o `admin`), así que no se comparte nada. Cuando exista esa relación, la columna `restaurant_id` de `menu_items` ya está reservada para identificar el local compartido.

**Campos de un plato.**

| Campo | Reglas |
|---|---|
| `plato` (o `nombre`) | Obligatorio, 1–60 caracteres, con al menos una letra. Es el nombre en inglés, tal como lo dirá el alumno |
| `categoria` | `entrada`, `principal`, `guarnicion`, `postre`, `bebida`, `alcohol`, `vino`. Se aceptan sinónimos en español e inglés (`starter`, `main`, `entree`, `side`, `dessert`, `drink`, `wine`, `beer`, `cocktail`...) |
| `descripcion` | Opcional, hasta 160 caracteres. En inglés: es lo que el alumno dirá al «explicar el plato» |
| `alergenos` | Opcional. Lista o texto separado por coma / punto y coma / «y». Valores: `nuts`, `peanuts`, `shellfish`, `fish`, `gluten`, `dairy`, `egg`, `soy`, `sesame` (con sinónimos en español). Uno desconocido es error |
| `precio` | Opcional. Número `0`–`9999.99` (`12`, `12.50`, `"$12,50"`) |

Texto plano estricto: no se admiten `<`, `>`, entidades (`&amp;`), caracteres de control ni símbolos fuera de letras, números y la puntuación normal de una carta (`& ( ) / + - , . ; : ' " ! ? % # * $ € @`). Un nombre repetido (sin distinguir mayúsculas ni acentos) es error.

**Del menú a las mesas.** Hacen falta **al menos 2 platos principales**. La carne y las hamburguesas llevan pregunta de punto de cocción; si hay guarniciones, los platos de carne, pollo y pescado «vienen con una guarnición»; las alergias de la mesa «Alergia seria» salen de los alérgenos declarados; el plato sin carne de «Sin carne» se busca en principales y entradas. Categorías que faltan (entradas, guarniciones, bebidas, postres) se completan con las de Harbor 47; si no hay alcohol o vinos, se omiten las situaciones de bar y de vino. Los **nombres en español** no se inventan: el servidor usa el mismo nombre en las dos columnas (pendiente: campos opcionales `plato_es` y `descripcion_es`, o traducción revisada). Las palabras nuevas de la carta no tienen pronunciación escrita (`say.pron` llega `null`) y todavía no pasan solas al mazo de repaso.

### `GET /api/mesas/menu`

```jsonc
{
  "platos": [ { "id": 12, "plato": "Grilled Salmon", "categoria": "principal", "descripcion": "...", "alergenos": ["fish"], "precio": 28.5 } ],
  "total": 6, "maximo": 60,
  "requisitos": { "listo": true, "principales": 2, "faltan": [] },
  "categorias": ["entrada", "principal", "guarnicion", "postre", "bebida", "alcohol", "vino"],
  "alergenos": ["nuts", "peanuts", "shellfish", "fish", "gluten", "dairy", "egg", "soy", "sesame"]
}
```

### `POST /api/mesas/menu`

Cuerpo, **uno** de los dos:

- Formulario: `{ "platos": [ { "plato": "...", "categoria": "...", "descripcion": "...", "alergenos": "fish, dairy", "precio": 28.5 } ] }`
- CSV pegado: `{ "csv": "plato;categoria;descripcion;alergenos;precio\n..." }`. Columnas en ese orden; admite coma, punto y coma o tabulador, comillas dobles para campos con separadores, con o sin fila de encabezado (con encabezado, las columnas se reconocen por nombre, en español o inglés). Máximo 20 000 caracteres.

Opciones: `"modo": "reemplazar"` (predeterminado: sustituye todo el menú) o `"agregar"` (suma; un plato con el mismo nombre reemplaza al anterior); `"soloValidar": true` valida y devuelve lo que se guardaría sin escribir nada (también comprueba el máximo de 60).

Respuesta 200: lo mismo que `GET /api/mesas/menu` (o, con `soloValidar`, `{ validado: true, platos: [...], total }`). Es **todo o nada**: si un plato falla, no se guarda ninguno.

Errores:

- `400 invalid_menu` con `problemas`: `[ { "fila": 2, "campo": "plato", "mensaje": "Plato: solo texto plano, sin HTML." } ]` (hasta 20; `fila` empieza en 1 y para el CSV cuenta sin el encabezado).
- `400 too_many` si se envían más de 60 platos; `409 too_many` si, al agregar, el menú pasaría de 60.
- `400 bad_request` si faltan `platos`/`csv` o vienen los dos, o el modo es otro. `413 too_large` si el cuerpo pasa de 64 KB.
- `503 unavailable` si el servidor usa PostgreSQL y falta la migración 002.

### `DELETE /api/mesas/menu/:id`

Borra un plato mío. Respuesta: el menú actualizado. `404 not_found` si no existe **o es de otra cuenta** (no se distingue).

### `DELETE /api/mesas/menu`

Borra todo mi menú. Respuesta: `{ "borrados": 6, ... }` más el menú vacío.

---

## Reglas que cambiaron (y por qué)

Los 227 tests anteriores pasan sin tocarlos. Lo nuevo:

1. **Las mesas se agrupan en Turnos por defecto.** Generar sin cuerpo ahora abre un Turno de 3 mesas (más a mayor nivel). La meta diaria **sigue siendo 2 mesas** (los tests y el README lo fijan); el Turno completo es la dosis recomendada, no un requisito de la racha. Decisión pendiente del dueño: pasar la meta a «completar el Turno».
2. **Las propinas del Servicio libre tienen curva y tope** (resuelve la deuda D7 de la auditoría para ese modo). El Turno conserva el mejor intento y no tiene tope diario propio: queda abierta la deuda de encadenar Turnos sin límite en un mismo día (cada Turno son 3–5 mesas, sin recompensa de XP extra).
3. **El Servicio libre no sube de nivel ni cuenta para la racha.** Así no se puede «farmear» el desbloqueo de locales ni de dificultades.
4. **La dificultad forzada** (`dificultad`) solo existe en libre; en Turno el nivel sigue saliendo de las mesas atendidas.
5. El texto de la situación «Sin carne» y de la lista de postres ahora nombra los platos del local (en Harbor 47 queda igual que antes).

## Migraciones (NO aplicadas a ninguna base)

**Antes de aplicar cualquier migración a producción: `pg_dump` de la base** (el flujo de respaldo diario de `POSTGRES.md` sirve; saca una copia a mano desde Actions → Respaldo diario → Run workflow y descárgala antes de continuar).

| Motor | Archivo | Qué hace |
|---|---|---|
| SQLite (desarrollo) | `server/db.js` → `SCHEMA` y `SCHEMA_VERSION = 4` | Crea la tabla `menu_items` al abrir la base. Sube `user_version` de 3 a 4 y deja la copia previa de siempre (`*.respaldo-v3-...`) si había cuentas |
| PostgreSQL | `server/storage/002-menus.sql` (versión 2) | Crea `english47.menu_items` y su índice, y da permisos al rol `english47_app` si existe. Solo **agrega**: no toca ninguna fila ni columna |
| PostgreSQL, base nueva | `scripts/supabase-setup.sql` | Ya incluye la tabla y registra las versiones 1 y 2 |

Tabla `menu_items` (idéntica en los dos motores): `id`, `user_id` (→ `users`, `ON DELETE CASCADE`), `restaurant_id` (`'propio'`), `sort_order`, `name`, `name_key` (nombre normalizado, único por cuenta), `category` (acotada a las 7 categorías), `description`, `allergens` (códigos separados por coma), `price_cents` (opcional) y `created_at`.

**Cómo aplicar la migración 2 a una base PostgreSQL existente** (cuando decidas hacerlo; yo no lo hice):

1. `pg_dump` y comprobar que la copia restaura.
2. Con la conexión de propietario: `npm run db:init`. El instalador detecta la versión 1 y solo ejecuta `002-menus.sql`, anotando la versión 2, dentro de una transacción. Es repetible.
3. Alternativa sin consola: en el editor SQL de Supabase, dentro de una transacción, pegar el contenido de `002-menus.sql` y después `INSERT INTO english47.schema_versions VALUES (2);`.

**Compatibilidad con el servidor desplegado:** el servidor acepta bases en versión 1 **o** 2 (`verifySchema`). Si se despliega este código antes de migrar, todo lo demás funciona y las rutas de menú responden `503 unavailable` (y `GET /api/mesas` informa `propio.disponible: false`) hasta aplicar la migración. No hace falta coordinar el orden.

`npm run db:import` (SQLite → PostgreSQL) exige que las tablas del origen y del destino coincidan: importar a una base PostgreSQL que aún esté en versión 1 fallará por la tabla `menu_items`; hay que migrarla primero.

## Qué no se pudo verificar

- **PostgreSQL real:** nada de esto se probó contra Postgres. La migración 002, el instalador y `verifySchema` se probaron con una base simulada (orden de ejecución, versiones anotadas, idempotencia) y el SQL es compatible por construcción (tipos y restricciones estándar, identidad `GENERATED BY DEFAULT AS IDENTITY` como el resto del esquema), pero conviene correr `node test/postgres.integration.js` contra una base desechable y vacía.
- Ninguna prueba toca `DATABASE_URL` ni el `.env`.
- La calidad del inglés de las cartas nuevas (café, brunch, rooftop, hotel) no la revisó una persona nativa, igual que el resto del contenido.
