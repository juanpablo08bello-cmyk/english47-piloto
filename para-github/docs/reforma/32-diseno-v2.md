# 32 - Diseño v2: «Ocean Drive de noche», con sello

Fecha: 2026-11-16. Propuesta concreta y accionable para la «reforma brutal». Parte de: diagnóstico `31-diagnostico-ui.md`, investigación `investigacion/17-rea-elsa-praktika-profundo.md` (+ 02, 03, 04, 11, 12, 13, 16), guía `30-guia-construccion-pantallas.md` y arte de Flow (`art/flow`, `web/public/art`). **No se implementa aquí**: es la especificación para quien construya. Todo valor está pensado para pegarse en CSS.

## 0. Resumen en una pantalla

**Una sola marca, dos composiciones.** El sistema visual es uno (mismos tokens, mismo arte, mismos sonidos). Lo que cambia es el **plano**:

| | **Móvil «Bolsillo»** (< 700 px, base 390) | **Escritorio «Estudio»** (≥ 1100 px, base 1440) |
|---|---|---|
| Idea | una cosa a la vez, pantalla completa, el pulgar manda | varias cosas a la vez, rejilla, el teclado y el cursor mandan |
| Estructura | barra superior fina + navegación inferior de cristal con «Mesas» elevada + hojas inferiores | riel lateral con marca 272 px + rejilla de 12 columnas (máx 1240) + **panel derecho 344 px** |
| Lectura | 17 px cuerpo, frase a decir 28 px | 18-19 px cuerpo, frase a decir 40 px |
| Acción principal | siempre en el tercio inferior, ≥ 56 px, ancho completo | atajo de teclado visible (`Espacio`, `Enter`), cursor `pointer`, tooltips |
| Mesa en juego | escena a sangre arriba, comanda en hoja, micrófono en dock | escena + panel lateral de comanda/resultado, micrófono **siempre sobre el pliegue** |
| Movimiento | gestos (arrastrar hoja, deslizar tarjeta) | hover, inclinación 3D, parallax, tooltips |

**Las 5 ideas de mayor impacto** (por impacto / coste):
1. **Superficies con luz** (aurora de fondo + grano + panel con doble trazo, labio de color y tinte de esquina). Cambia toda la app de una vez, ~1 día.
2. **Shell de escritorio en 3 zonas** y la **mesa en juego sin scroll** (micrófono sobre el pliegue, panel lateral de comanda y de resultado).
3. **Iconografía propia**: 3D de Flow para racha/monedas/trofeos/cofres + duotono dibujado para utilidades + navegación de marca.
4. **Resultado de voz de primer nivel**: marcador por palabra (verde/ámbar/coral), «Es mejor decir…», anillo de puntuación con chips y consejo, micrófono con corona de barras radiales.
5. **Tipografía con carácter** (Bricolage Grotesque 800 con eje de ancho para titulares y cifras, Caveat solo en la comanda) y **objetos 3D que rompen el marco** de las tarjetas.

## 1. Qué tomamos de las referencias (con medida) y cómo se adapta

| Patrón (fuente) | Medida | Adaptación en ENGLISH47 |
|---|---|---|
| Tarjeta de tono con luz de esquina (ELSA) | `135deg` tono 12 % → 0 al 55 %; borde 1 px tono al 35 %; radio 20 | Panel `--tone` (ver 2.3); radio 22 |
| Resplandor que sube desde abajo en tarjetas oscuras (ELSA) | `transparent → tono .30` | `::before` inferior en hero y tarjetas de tienda |
| Texto con degradado en 1-2 palabras (ELSA) | `#38ecec → #6441cc` | `--grad-neon-text` ámbar en cifras y palabra clave |
| Secciones con esquinas inferiores 24-28 (ELSA/Praktika) | `0 0 24-28px 24-28px` | Escena de mesa y héroes en móvil: `0 0 28px 28px` |
| Hero en panel de radio 32-48 con la ilustración rompiendo el marco (Praktika) | 32 y 48 px | `--r-hero:36px`, Capi/objetos con `margin-top:-28px` |
| Tarjetas de cristal inclinadas con píldoras roja/verde (Praktika) | ≈ −6° / +4° | «Sticker cards» de corrección (`rotate(-2deg)` en reposo, 0° al fijarse) |
| Hoja inferior con asa, «✔ Es mejor decir / ? Explicación» (Praktika) | radio superior ~28 | `Sheet` v2 (4.11) con color de veredicto |
| Micrófono blanco 100 px con 4 anillos 1 px (Praktika) | escala 1→4, 4 s, retraso .8 s | 3 anillos en reposo, ver §6 |
| Orbe de 90 px con degradado y sombra de color, recortado por el borde (ELSA) | `0 10px 20px` al 30 % | Orbe 96 px ámbar con sombra teñida y **dock** que lo «corta» |
| Resultado: anillo + chips de cristal + radar + cifra por valor (ELSA) | borde 3 px violeta, radio 20 | Anillo con chips «Nivel»/«Propina»; radar de 4-5 ejes con cifras de color |
| Palabra con letras falladas coloreadas + tabla Correct/Almost/Incorrect + consejo (ELSA) | verde/naranja/rojo | Marcador por palabra + fila de consejo solo en fallos |
| Marcador (resaltador) por palabra, baraja de tarjetas (Speak) | `#29c195` ~25 %, radio 6 | `.mk` (2.7) y baraja en Repasar (5.3) |
| Curva expo-out 500 ms como firma (Speak) | `cubic-bezier(.16,1,.3,1)` | `--ease-expo` para layout y sheets |
| Acordeón por `grid-template-rows` (ELSA) | `.3s ease-out` | Biblioteca y FAQ, sin JS de altura |
| Titular con tracking apretado (Speak −0.04 em, Praktika −0.02 em) | 56-60 px | `--ls-display:-.035em` |
| Pestaña «POPULAR» pegada a la columna central (Praktika b2b, ELSA) | — | Plan/restaurante recomendado en Mesas y tienda |
| Labio de color por botón, 4 px, baja 4 px (Duolingo 16) | 100 ms linear | ya en `Button`; se añade labio **de color** también a las tarjetas |

## 2. Lenguaje visual v2

Principios: (1) **luz desde arriba-izquierda**: todo brillo, sombra y degradado obedece a una sola fuente; (2) **el color dice el módulo** (ámbar = acción y recompensa, turquesa = voz/escucha/progreso, coral = error y alerta, lima = acierto, violeta = VIP/rareza); (3) **doble trazo + labio**: ningún marco es una línea gris de 1 px; (4) **profundidad por capas**, no por sombras negras; (5) **el cristal es selectivo** (ELSA lo evita; lo usamos solo en lo que flota); (6) **mundo redondeado**: radios grandes, nunca ángulos vivos.

### 2.1 Tokens (archivo nuevo `web/src/styles/tokens-v2.css`, importado después de `tokens.css`; no renombra nada existente)

```css
:root {
  /* — Noche (fondo y superficies, con un poco de azul para que las luces de color «vibren») — */
  --night-0: #06070a;   /* fondo profundo */
  --night-1: #0b0d11;   /* fondo de página (sustituye visualmente a --bg #0a0b0d) */
  --night-2: #12151b;   /* panel base (≈ --surface #14161a, algo más oscuro) */
  --night-3: #1a1e26;   /* panel elevado, entradas */
  --night-4: #242933;   /* hover, pistas de barra */
  --line-1: rgb(255 255 255 / .07);   /* trazo exterior */
  --line-2: rgb(255 255 255 / .13);   /* realce superior (luz) */
  --line-3: rgb(255 255 255 / .04);   /* segundo trazo, interior */

  /* — Rampas por marca: 300 brillo · 500 base (los actuales) · 700 labio (los --*-edge actuales) · 900 sombra teñida — */
  --amber-200:#ffe3a3; --amber-300:#ffd070; --amber-400:#ffc03e; --amber-500:#ffb020; --amber-600:#e69500; --amber-700:#c77f00; --amber-900:#4a2f00;
  --teal-200:#a8f5ee;  --teal-300:#6deadf;  --teal-400:#3adfd2;  --teal-500:#1fd6c8;  --teal-600:#14aaa0;  --teal-700:#0d9a90;  --teal-900:#03302d;
  --coral-200:#ffc2cd; --coral-300:#ff9aae; --coral-400:#ff7690; --coral-500:#ff5d7a; --coral-600:#e03d5e; --coral-700:#c43653; --coral-900:#42101b;
  --lime-300:#b4f08c;  --lime-500:#7be04a;  --lime-700:#4aa31f;  --lime-900:#17330a;
  --violet-300:#b9acff; --violet-500:#8d7bff; --violet-700:#5a49cc; --violet-900:#1d1745;
  --sun-500:#ff8a3d;    /* puente ámbar → coral del atardecer */
  /* mismos colores en triplete para alfa: rgb(var(--amber-rgb) / .3) */
  --amber-rgb:255 176 32; --teal-rgb:31 214 200; --coral-rgb:255 93 122; --lime-rgb:123 224 74; --violet-rgb:141 123 255;

  /* — Degradados Miami — */
  --grad-sunset: linear-gradient(135deg, #ffc03e 0%, #ff8a3d 48%, #ff5d7a 100%);      /* héroes, CTA especial, racha */
  --grad-bay:    linear-gradient(135deg, #3adfd2 0%, #5fa8ff 55%, #8d7bff 100%);      /* voz, progreso, ranking */
  --grad-neon-text: linear-gradient(180deg, #fff1c7 0%, #ffc03e 45%, #ff8a3d 100%);   /* cifras y palabra clave (background-clip:text) */
  --grad-score: conic-gradient(from -90deg, #ff5d7a 0%, #ffb020 38%, #7be04a 72%, #1fd6c8 100%); /* anillo de puntuación */
  --aurora:
    radial-gradient(900px 520px at 8% -8%,  rgb(255 93 122 / .20), transparent 60%),   /* coral arriba-izq */
    radial-gradient(760px 520px at 100% 0%, rgb(141 123 255 / .16), transparent 62%),  /* violeta arriba-der */
    radial-gradient(900px 560px at 50% 112%, rgb(31 214 200 / .16), transparent 64%), /* turquesa abajo */
    linear-gradient(180deg, var(--night-1) 0%, var(--night-0) 100%);
  --rays: repeating-conic-gradient(from 0deg at 50% 100%, rgb(255 176 32 / .11) 0 3.5deg, transparent 3.5deg 11deg); /* sunburst Art Deco tras Capi */
  --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");

  /* — Forma — */
  --r-xs:8px; --r-s:12px; --r-m:16px; --r-l:22px; --r-xl:30px; --r-hero:36px; --r-pill:999px;
  --lip: 4px; --lip-s: 2px;                      /* labio (Duolingo: 4 px y 2 px) */

  /* — Elevación (luz arriba-izquierda; el color de la sombra es el del tono) — */
  --sh-flat:  inset 0 0 0 1px var(--line-1);
  --sh-panel: inset 0 0 0 1px var(--line-1), inset 0 1px 0 var(--line-2), 0 var(--lip) 0 var(--lip-color, #06070a), 0 22px 36px -18px rgb(var(--tone, 0 0 0) / .35);
  --sh-float: inset 0 1px 0 rgb(255 255 255 / .14), 0 0 0 1px var(--line-1), 0 28px 60px -20px rgb(0 0 0 / .8);
  --glow-coral: 0 0 28px rgb(255 93 122 / .35); --glow-violet: 0 0 28px rgb(141 123 255 / .35); --glow-lime: 0 0 28px rgb(123 224 74 / .35);

  /* — Cristal (solo para lo que flota) — */
  --glass-bg: rgb(18 21 27 / .62); --glass-blur: blur(18px) saturate(1.5); --glass-line: rgb(255 255 255 / .10);

  /* — Tipografía — */
  --font-display: "Bricolage Grotesque Variable", "Outfit Variable", system-ui, sans-serif;  /* titulares, cifras, frase a decir */
  --font-ui:      "Inter Variable", ui-sans-serif, system-ui, sans-serif;                    /* cuerpo, etiquetas */
  --font-hand:    "Caveat Variable", "Bradley Hand", cursive;                                /* SOLO comanda y notas de Capi */
  --fs-display: clamp(2.5rem, 1.6rem + 3.6vw, 4.25rem);   /* 40 → 68 */
  --fs-h1:      clamp(2rem, 1.5rem + 1.8vw, 2.75rem);     /* 32 → 44 */
  --fs-h2:      clamp(1.5rem, 1.3rem + .8vw, 2rem);       /* 24 → 32 */
  --fs-h3: 1.25rem;     /* 20 */
  --fs-h4: 1.0625rem;   /* 17 */
  --fs-body: 1.0625rem; /* 17 (≥ 1100 px: 1.125rem = 18) */
  --fs-small: .9375rem; /* 15 — mínimo para texto corrido */
  --fs-label: .75rem;   /* 12, solo MAYÚSCULAS con --ls-label */
  --fs-phrase: clamp(1.75rem, 1.2rem + 2vw, 2.5rem);      /* 28 → 40: la frase que el mesero debe decir */
  --ls-display: -.035em; --ls-h: -.02em; --ls-label: .09em;

  /* — Movimiento — */
  --ease-out:    cubic-bezier(.22, .9, .3, 1);
  --ease-expo:   cubic-bezier(.16, 1, .3, 1);        /* layout, hojas, navegación (firma de Speak, 500 ms) */
  --ease-spring: cubic-bezier(.175, .885, .32, 1.275); /* pop, hojas con rebote (Duolingo) */
  --ease-inout:  cubic-bezier(.45, 0, .2, 1);
  --d-tap: 90ms; --d-fast: 160ms; --d-base: 260ms; --d-slow: 420ms; --d-hero: 700ms;

  /* — Capas — */
  --z-nav: 40; --z-top: 30; --z-popover: 150; --z-sheet: 300; --z-modal: 310; --z-toast: 400;
}
html { background: var(--night-0); }
body { background: var(--aurora) fixed; font-size: var(--fs-body); }
body::after { content:""; position: fixed; inset: 0; z-index: 0; pointer-events: none; background: var(--grain); opacity: .05; mix-blend-mode: overlay; }
@media (min-width: 1100px) { :root { --fs-body: 1.125rem; --fs-small: 1rem; } }
@media (prefers-reduced-transparency: reduce), (update: slow) { body::after { display:none } :root { --glass-blur: none; --glass-bg: var(--night-3); } }
```

Fuentes (nuevas dependencias, a pedir, ya verificadas en npm 5.3.0): `@fontsource-variable/bricolage-grotesque` (usar el archivo `wdth.css`: ejes wght 200-800 y wdth 75-100) y `@fontsource-variable/caveat`. Peso estimado en WOFF2 (latin): Bricolage ~55 KB, Caveat ~25 KB; Outfit pasa a respaldo y se retira cuando todas las pantallas migren (−30 KB). Con `font-display: swap` y `<link rel="preload">` solo de Bricolage 800.

### 2.2 Escala tipográfica con carácter

| Rol | Familia / ajustes | Tamaño / interlineado | Uso |
|---|---|---|---|
| Display | Bricolage 800, `font-variation-settings:'wdth' 88`, `--ls-display` | 40/40 → 68/64 | Saludo de Hoy, nombre de sala, «¡Turno completado!» |
| H1 | Bricolage 800, wdth 92, −.03em | 32/36 → 44/46 | Título de pantalla |
| H2 | Bricolage 700, wdth 96 | 24/28 → 32/36 | Título de bloque |
| H3 / H4 | Bricolage 700 | 20/26 · 17/24 | Título de tarjeta |
| Frase a decir | Bricolage 700, wdth 100, −.01em | 28/34 → 40/46 | Lo que el mesero dice (ELSA usa 28 px en móvil) |
| Cuerpo | Inter 400, `font-feature-settings:'cv11','ss03'` | 17/26 (18/28 en ≥ 1100) | Texto corrido |
| Cuerpo en inglés (cliente) | Inter 500 | 19/28 | Lo que dice el cliente |
| Etiqueta | Inter 700 MAYÚSCULAS, +.09em | 12/16 | «TÚ DICES», «COMANDA» |
| Cifra | Bricolage 800, wdth 82, `tabular-nums`, **relleno `--grad-neon-text`** | 28 → 96 | XP, racha, propina, puntuación |
| Mano | Caveat 600 | 20-24 | Líneas de la comanda y consejos «de Capi» |

Reglas: máximo 2 pesos por pantalla; el degradado de texto en **una** cifra o palabra por pantalla (ELSA lo hace en 1-2 palabras por titular); nunca texto de cuerpo menor de 15 px (en escritorio 16).

### 2.3 Superficies (las 5 «familias»)

**a) Héroe (con imagen y luz).** Escenas, banner de Hoy, cabeceras de Tienda/Yo. Radio `--r-hero` (arriba) y en móvil `0 0 28px 28px`; fondo = arte (sala, `--aurora`) + escrim `linear-gradient(0deg, rgb(6 7 10 / .85), transparent 55%)`; el personaje u objeto 3D **sobresale 24-28 px** del borde (`margin-top:-28px`, sin `overflow:hidden` en el contenedor exterior; el recorte se hace con un hijo).

**b) Panel (la tarjeta normal) con doble trazo, labio y tinte.**
```css
.panel {
  --tone: var(--amber-rgb); --lip-color: #06070a;
  position: relative; border-radius: var(--r-l);
  background:
    linear-gradient(180deg, rgb(255 255 255 / .045), transparent 38%),            /* brillo superior */
    linear-gradient(160deg, rgb(var(--tone) / .12), transparent 55%),            /* tinte de esquina (ELSA: 12 % → 0 al 55 %) */
    var(--night-2);
  box-shadow: var(--sh-panel);                                                    /* trazo 1 + realce + labio + luz teñida */
}
.panel::after { content:""; position:absolute; inset:5px; border-radius: calc(var(--r-l) - 5px);
  box-shadow: inset 0 0 0 1px var(--line-3); pointer-events:none; }                /* trazo 2 (el «doble trazo») */
.panel[data-tone="teal"]  { --tone: var(--teal-rgb);  --lip-color: var(--teal-900); }
.panel[data-tone="coral"] { --tone: var(--coral-rgb); --lip-color: var(--coral-900); }
.panel[data-tone="amber"] { --lip-color: var(--amber-900); }
.panel[data-tone="violet"]{ --tone: var(--violet-rgb); --lip-color: var(--violet-900); }
/* interactivo: el labio se hunde como el botón */
.panel.tap:active { transform: translateY(var(--lip)); box-shadow: var(--sh-flat), 0 0 0 var(--lip-color); transition-duration: var(--d-tap); }
@media (hover:hover) { .panel.tap:hover { transform: translateY(-3px); } }
```
Variante «neón» (para lo destacado: El Turno, plan recomendado, racha):
```css
.panel--neon { border: 1.5px solid transparent;
  background: linear-gradient(var(--night-2), var(--night-2)) padding-box, var(--grad-sunset) border-box;
  box-shadow: var(--sh-float), 0 0 32px rgb(255 138 61 / .18); }
```

**c) Ticket (la comanda).** Papel oscuro con muescas laterales y línea de perforación; texto en Caveat.
```css
.ticket { --n: 11px; --notch: 74px; position: relative; padding: 20px 20px 16px; border-radius: 14px;
  background: linear-gradient(180deg, #1d1912, #16130d); color: #f1e6c8;
  background-image: repeating-linear-gradient(0deg, transparent 0 27px, rgb(255 210 120 / .08) 27px 28px); /* renglones */
  -webkit-mask: radial-gradient(var(--n) at 0 var(--notch), #0000 97%, #000) left / 51% 100% no-repeat,
                radial-gradient(var(--n) at 100% var(--notch), #0000 97%, #000) right / 51% 100% no-repeat;
          mask: radial-gradient(var(--n) at 0 var(--notch), #0000 97%, #000) left / 51% 100% no-repeat,
                radial-gradient(var(--n) at 100% var(--notch), #0000 97%, #000) right / 51% 100% no-repeat; }
.ticket::after { content:""; position:absolute; left: 14px; right: 14px; top: var(--notch); border-top: 2px dashed rgb(255 210 120 / .25); }
.ticket .line { font: 600 22px/28px var(--font-hand); }
```
La línea nueva «se escribe»: 380 ms, `clip-path: inset(0 100% 0 0)` → `inset(0)`, con un sonido de lápiz (`tap` bajo).

**d) Cristal selectivo.** `background: var(--glass-bg); backdrop-filter: var(--glass-blur); border:1px solid var(--glass-line); box-shadow: inset 0 1px 0 rgb(255 255 255 / .12)`. **Solo**: barra superior al hacer scroll, navegación inferior móvil, hojas inferiores, dock del micrófono, chips sobre la escena (ánimo del cliente, comanda plegada), tooltips y popovers. **Nunca** en tarjetas de lectura (legibilidad en luz de sala; 03 lo advierte) ni en listas largas (coste de GPU en teléfonos de gama baja: máx. 3 superficies de cristal visibles a la vez).

**e) Plano.** Listas, filas, tablas: sin sombra, solo `--sh-flat` y separadores `--line-1`. Garantiza que lo importante destaque por contraste de tratamiento.

### 2.4 Botones v2 (ampliación de `Button`)
- Alto 52 (móvil) / 48 (escritorio, 56 el principal del turno); radio `--r-m`; labio 4 px **del tono 700**; Bricolage 700 17 px, `letter-spacing:.01em`, **MAYÚSCULAS solo en `size="lg"`** (.04em, como Duolingo). `size="lg"` añade `--grad-sunset` en el CTA singular de la pantalla (uno por pantalla).
- Estados: reposo (labio 4) · `:hover` (solo `(hover:hover)`) sube 2 px, `brightness(1.08)` 200 ms, brillo diagonal (`skewX(-35deg)` de −120 % a 420 %, 700 ms `cubic-bezier(.54,.2,.6,.71)`) · `:active` baja 4 px, labio 0, 90 ms linear · `:focus-visible` anillo 3 px turquesa a 3 px de distancia + 120 ms · `disabled` gris desaturado, labio hundido (como pulsado; Duolingo) · `loading` el texto se reemplaza por 3 puntos que suben en cascada 120 ms, ancho fijo · `success` (tras confirmar) lima con check que dibuja 260 ms.
- Variantes: `primary` (ámbar), `voice` (turquesa), `success` (lima), `danger` (**contorno coral**, como Duolingo, para no pulsar «Salir» por error), `secondary` (night-3 + borde 2 px + labio), `ghost`, `glass` (sobre escena), `icon` (48/56 círculo con labio).
- Píldora de chip: 32 px de alto, radio píldora, icono duotono 16 px.

### 2.5 Marca, bordes y texturas
- **Wordmark propio**: `ENGLISH` Bricolage 800 wdth 82, `47` en `--grad-sunset` con contorno neón (`filter:drop-shadow(0 0 6px rgb(255 138 61 / .55))`), SVG en `/art/logo-e47.svg` (28 px en barra, 96 px en login). Sustituye al texto actual.
- **Bordes con personalidad**: (1) doble trazo del panel; (2) «labio de color» por tono; (3) trazo de degradado `--grad-sunset` en lo destacado; (4) **ticket con muescas**; (5) borde de **sello**: círculo con anillo punteado `border:2px dotted rgb(255 176 32 / .5)` para insignias y niveles; (6) **esquinas Art Deco**: en héroes, un recorte `clip-path` de 14 px en la esquina inferior derecha con línea ámbar 2 px (`.deco-corner`).
- **Texturas**: grano global (5 %), rayos `--rays` con máscara radial tras Capi y en pantallas de logro, **cenefa chevron** de 8 px (`repeating-linear-gradient(135deg, var(--amber-500) 0 2px, transparent 2px 9px)` al 60 %) como separador de sección en Hoy y como borde superior de la comanda, y neón de palmeras/luces como fondo del login (ya existe la foto).
- **3D y profundidad en tarjetas**: objetos 3D de Flow sobre el borde (`transform: translateZ(40px)` + `filter: drop-shadow(0 14px 14px rgb(0 0 0 / .5))`); inclinación al pasar el cursor (solo `(hover:hover) and (pointer:fine)`): contenedor `perspective: 900px`, tarjeta `rotateX(calc(var(--py) * -6deg)) rotateY(calc(var(--px) * 6deg))`, seguimiento 120 ms, retorno 420 ms `--ease-expo`, brillo `radial-gradient(circle at calc(50% + var(--px) * 40%) calc(50% + var(--py) * 40%), rgb(255 255 255 / .12), transparent 55%)`; máximo 6° y apagado con movimiento reducido.

### 2.6 Cristal, brillos y luz por pantalla
- Hoy: aurora completa + rayos tras Capi.
- Mesas hub: cada sala con su paleta (`sala_rooftop` violeta-turquesa, `sala_steakhouse` ámbar-coral…), el fondo de la pantalla toma el tinte de la sala bajo el cursor (transición 600 ms).
- Mesa en juego: sala a sangre + viñeta; luz de lámparas con parpadeo muy leve (opacidad .92 ↔ 1, 6 s) solo en escritorio.
- Resultado: tinte del veredicto (lima / ámbar / coral) como resplandor desde la hoja hacia arriba (opacidad .18).

### 2.7 Marcador y píldoras para el resultado de voz
```css
/* subrayador por palabra (Speak: mint ~25 %, radio 6) */
.mk { --c: var(--lime-rgb); padding: 0 .14em; border-radius: 6px; box-decoration-break: clone;
  background: linear-gradient(transparent 14%, rgb(var(--c) / .30) 14% 92%, transparent 92%) no-repeat 0 0 / 0% 100%;
  animation: sweep 320ms var(--ease-out) forwards; animation-delay: calc(var(--i) * 70ms); }
.mk[data-s="almost"] { --c: var(--amber-rgb); } .mk[data-s="bad"] { --c: var(--coral-rgb); }
@keyframes sweep { to { background-size: 100% 100%; } }
/* píldora de corrección (Praktika): palabra mala / buena */
.pill-bad  { background: var(--coral-500); color: #2a0610; }
.pill-good { background: var(--lime-500);  color: #0f2503; }
.pill-bad, .pill-good { padding: .02em .42em; border-radius: .5em; font-weight: 800; }
```
Además: el semáforo **siempre lleva icono o texto** (✔ / ~ / ✖) y la banda de puntuación publicada (verde ≥ 80, ámbar 55-79, coral < 55: ajustar a la escala real de `server/`), porque ELSA no las publica y es su error (03).

### 2.8 Accesibilidad del lenguaje
Contraste medido en cabeza (a validar con axe): `#ffb020` sobre `#12151b` ≈ 9:1; `#1fd6c8` sobre `#12151b` ≈ 8:1; `#ff5d7a` sobre `#12151b` ≈ 5.6:1; texto `#f4f5f7`/`#b7bdc7` sobre night ≥ 7:1. El texto sobre botón ámbar es `--on-accent #1a1100` (≥ 9:1). Grano, rayos y aurora son decorativos (`aria-hidden`, opacidades ≤ .2). `prefers-reduced-motion`: sin inclinación, flotación, rayos animados, brillos ni partículas; fundidos de 150 ms. `prefers-contrast: more`: `--line-1` a .25 y sin degradados de texto (color sólido ámbar).

## 3. Sistema de iconos propio («Jardín de iconos»)

Hoy: `Icon.svelte` tiene ~28 iconos de trazo de 2 px, genéricos (misma familia que Lucide/Feather). Son correctos y **idénticos a los de cualquier plantilla**: por eso la barra de navegación, las cabeceras de tarjeta y los chips parecen «de librería». ELSA usa un SVG de 2 tonos con tarjeta-icono (caja de 48 px con relleno translúcido, ver §1 del informe) y Duolingo usa ilustración de color para todo lo importante. Nosotros ya tenemos lo que ellos no: arte 3D propio (Capi, llama, moneda, trofeo). La regla es: **lo que se desea o se celebra es 3D; lo que se usa es duotono.**

### 3.1 Tres niveles

| Nivel | Qué es | Dónde | Formato | Tamaño de uso |
|---|---|---|---|---|
| **A · Joya 3D** | Objeto 3D estilo Flow (render suave, luz cálida), fondo transparente | Racha, monedas, XP, trofeos, cofres, tienda, estados vacíos, resultados, navegación activa en escritorio | WebP 256 px y 512 px (`/art/ico3d/<nombre>.webp`), ≤ 18 KB cada uno | 40–160 px |
| **B · Duotono** | Trazo 2 px + relleno translúcido + 1 detalle de acento. Dibujado a mano, rejilla 24 | Utilidades: botones, chips, listas, filtros, navegación inactiva | SVG en `Icon.svelte` (dos capas por icono) | 16–28 px |
| **C · Sello de marca** | Capi, cloche, comanda, campana como mini-ilustración 3D recortada | Cabeceras de pantalla, onboarding | WebP ya existentes (`capi_*`, `obj_*`) | 64–220 px |

### 3.2 Especificación del nivel B (duotono)
- Rejilla 24×24, margen seguro 2 px, **trazo 2 px** (1.75 px a 16 px), `stroke-linecap: round`, `stroke-linejoin: round`, esquinas internas con radio 2–3 px. Nada de ángulos vivos: el mundo es redondeado (Capi, botones de 16 px).
- **Dos capas por icono**: `l1` = contorno (`currentColor`); `l2` = relleno de forma principal con `fill: var(--ic-tint)` al 22 % y **un único detalle de acento** (`stroke: var(--ic-accent)`; por ejemplo el punto del micrófono, la chispa del libro, el pestañeo del reloj). Valores por defecto: `--ic-tint: currentColor`, `--ic-accent: var(--amber)`.
- Estados: reposo = contorno `--muted` + tinte 12 %; activo = contorno del color del módulo + tinte 28 % + `filter: drop-shadow(0 0 6px color/.5)`; deshabilitado = 40 % de opacidad.
- Se pinta con un solo componente: `<Icon name="mic" tone="amber" />` (prop `tone`: `amber|teal|coral|lime|violet|mute`). Los iconos que cambian de significado con la animación (micrófono → onda, altavoz → ondas) tienen **un `d` por fotograma** y se interpolan con `<animate>` solo si el usuario no pide movimiento reducido.
- Alineación óptica: los iconos con peso a un lado (play, flecha) se desplazan 0.5 px a su centro visual.
- **Navegación**: 5 iconos propios, no genéricos: **Hoy** = sol de Ocean Drive saliendo tras una palmera (círculo + 3 rayos + tronco curvo); **Repasar** = baraja de 3 tarjetas abanicadas; **Mesas** = cloche con asa; **Biblioteca** = libreta de comanda con lomo y marcapáginas; **Yo** = cara de Capi (hocico cuadrado + orejas redondas). En escritorio, el icono activo se sustituye por su versión 3D (nivel A) a 36 px con rebote 320 ms.

### 3.3 Catálogo completo (qué iconos existen y en qué nivel)

**Navegación y estructura**
`hoy`, `repasar`, `mesas`, `biblioteca`, `yo` (B + versión A activa en escritorio) · `atras`, `adelante`, `cerrar`, `mas`, `menu`, `buscar`, `filtro`, `ajustes`, `compartir`, `enlace`, `salir`, `ayuda` (B)

**Progreso y recompensas** (todos con versión A; B solo para chips pequeños)
`llama` (activa naranja; apagada gris-ceniza; congelada azul hielo con cristales), `moneda` (con estrella), `xp` (rayo dorado), `estrella` (dorada y vacía), `trofeo`, `copa-liga` (bronce/plata/oro/diamante), `corona`, `medalla`, `cofre` (cerrado, abierto, brillando), `escudo` (protector de racha), `diana` (meta), `nivel` (insignia con número), `regalo`, `calendario` (con marca), `fuego-doble` (racha 7), `gema` (rareza VIP)

**Voz y audio** (B, más versión A para el micrófono grande de estados vacíos)
`mic`, `mic-apagado`, `mic-bloqueado`, `altavoz`, `altavoz-silencio`, `oido` (escuchar), `onda` (forma de onda), `lento` (tortuga: reproducir lento), `repetir`, `play`, `pausa`, `stop`, `teclado` (responder escribiendo), `auricular`

**Mesas y servicio** (A + C)
`comanda` (libreta con lápiz), `bandeja`, `cloche`, `campana-recepcion`, `copa-vino`, `coctel`, `cubiertos`, `plato`, `hamburguesa`, `filete`, `pasta`, `postre`, `cafe`, `propina` (billete + monedas), `resena` (5 estrellas en tarjeta), `reloj-turno`, `mesa-libre`, `mesa-ocupada`, `alergia` (triángulo con trigo tachado), `cumpleanos` (vela), `vip` (corona sobre silla)

**Ánimo del cliente** (A pequeño, 5 caras de Capi-cliente en círculo de 40 px)
`animo-molesto`, `animo-impaciente`, `animo-neutro`, `animo-contento`, `animo-encantado`

**Estados y feedback** (B con color semántico)
`acierto` (check en círculo), `error` (x en círculo), `casi` (check con ondas), `aviso` (triángulo), `info`, `pista` (bombilla), `candado`, `nuevo` (chispa), `favorito` (corazón, vacío/lleno), `error-guardado`, `sincronizando`, `sin-conexion`

**Tienda y perfil** (C + A)
`ropa`, `sombrero`, `lentes`, `cuello`, `animal`, `protector`, `bolsa`, `ranking`, `logro`, `calendario-racha`, `idioma`, `sonido`, `vibracion`, `notificacion`, `invitacion`

**Admin** (B) — `equipo`, `menu-carta`, `informe`, `exportar`

Total: ~60 iconos B, ~34 iconos A. Se dibujan los B en una sola tanda (nueva `Icon.svelte` con 2 capas) y los A se generan en Flow (§3.4).

### 3.4 Hoja de iconos 3D para Google Flow
Reglas (mismas que `FLOW_PAQUETE_IMAGENES.md`): una **cuadrícula** por hoja, mismo tamaño y encuadre para todos, fondo liso claro, sin texto, sin sombra de suelo, sin partículas. Después se recortan con el script de recorte de fondo existente (`cortar_hoja.py`) y se exportan a WebP 512 y 256.

**Bloque de estilo (se pega al final de TODOS los prompts):**
> *stylized 3D cartoon icon set, soft Pixar-like render, rounded chunky shapes with generous bevels, warm studio lighting from top-left, subtle subsurface glow, rich saturated colors in amber gold #ffb020, teal #1fd6c8, coral #ff5d7a, lime #7be04a and violet #8d7bff, small specular highlights, thick friendly silhouettes readable at 48 pixels, each icon centered with equal padding, front three-quarter view, isolated on a plain flat light-grey background, no shadow on the floor, no text, no letters, no numbers, no sparkles, no particles, consistent scale and style across the whole sheet, same camera and lighting for every icon.*

**Hoja 1 · Recompensas (cuadrícula 4 × 3 = 12)**
> *A 4 by 3 grid sheet of twelve separate 3D game reward icons, evenly spaced: (1) an orange-gold flame with a warm inner glow, (2) the same flame in cold grey ash, unlit, (3) the same flame frozen inside pale blue ice crystals, (4) a gold coin with an embossed star, (5) a gold lightning bolt with a rounded bevel, (6) a gold five-point star, (7) a small golden trophy cup with two handles, (8) a golden crown with three round jewels, (9) a round gold medal with a ribbon, (10) a closed treasure chest with gold trim and a keyhole, (11) the same chest open with gold coins glowing inside, (12) a teal shield with a white check mark. [BLOQUE DE ESTILO]*

**Hoja 2 · Ligas y metas (4 × 3)**
> *A 4 by 3 grid sheet of twelve separate 3D icons: (1) a bronze league cup, (2) a silver league cup, (3) a gold league cup, (4) a diamond-blue league cup, (5) a dartboard with a dart in the bullseye, (6) a gift box with a coral ribbon, (7) a small calendar page with a big checkmark, (8) a round level badge with a laurel border and a blank center, (9) a coral-and-gold double flame for a seven day streak, (10) a violet faceted gem, (11) a round alarm clock with amber face, (12) a gold ticket stub. [BLOQUE DE ESTILO]*

**Hoja 3 · Mesas y servicio (4 × 3)**
> *A 4 by 3 grid sheet of twelve separate 3D restaurant icons: (1) a waiter order pad with a pencil and a ripped top page, (2) a silver serving tray with two glasses, (3) a silver cloche dome on a plate, (4) a golden reception bell, (5) a wine glass with red wine, (6) a tropical cocktail with an umbrella, (7) crossed fork and knife with gold handles, (8) a white plate with a gold rim, (9) a cheeseburger, (10) a grilled steak on a board, (11) a bowl of pasta with a fork, (12) a slice of cake with a cherry. [BLOQUE DE ESTILO]*

**Hoja 4 · Servicio y dinero (4 × 3)**
> *A 4 by 3 grid sheet of twelve separate 3D icons: (1) a stack of dollar bills with a few coins on top, (2) a rating card with five gold stars, (3) a coffee cup on a saucer, (4) a hanging table sign reserved in blank white, (5) a birthday candle cake, (6) a wheat ear inside a coral warning triangle, (7) a crown resting on a leather chair back, (8) a microphone with a rounded amber body and silver mesh, (9) the same microphone in grey with a coral slash, (10) a loudspeaker with three curved sound waves, (11) a small ear with teal sound waves, (12) a turtle in teal and lime for slow playback. [BLOQUE DE ESTILO]*

**Hoja 5 · Ánimo del cliente (5 × 1 por fila, 2 filas)** — mismo cliente neutro (círculo de fondo de color distinto por cara)
> *A sheet of five 3D cartoon emoji faces in round badges, same character, all with a tan skin tone and dark hair, expressions from left to right: furious (coral badge), impatient (orange badge), neutral (grey badge), happy (teal badge), delighted with sparkly eyes (gold badge). [BLOQUE DE ESTILO]*

**Hoja 6 · Tienda (4 × 3)**
> *A 4 by 3 grid sheet of twelve separate 3D icons: (1) a teal waiter vest, (2) a small straw hat, (3) round sunglasses with amber lenses, (4) a bow tie in amber, (5) a leather shopping bag with a gold handle, (6) a rounded shield with a snowflake, (7) a trophy shelf with three empty slots, (8) a wardrobe hanger in gold, (9) a gold key, (10) a padlock closed with a gold shackle, (11) a padlock open, (12) a violet gift box with a gold seal. [BLOQUE DE ESTILO]*

**Si Flow mezcla estilos en una hoja** (lección de AtomicRupture): generar icono por icono con la plantilla *«A single [objeto], [BLOQUE DE ESTILO], 1:1, 1024 px»* y mantener la misma semilla/estilo de referencia (subir `obj_llama.png` y `obj_moneda.png` como imagen de estilo, que son el listón de calidad).

**Control de calidad antes de aceptar un icono:** legible a 48 px en pantalla negra; silueta distinta de la de sus vecinos (llama ≠ moneda ≠ rayo); borde de color propio (ámbar/turquesa/coral) para que el color diga el módulo; ≤ 18 KB en WebP.

### 3.5 Cómo entran en la app
- `lib/ui/Ico3D.svelte` (nuevo): `<Ico3D name="llama" size={72} state="activa" />`; carga `/art/ico3d/<name>.webp` con `loading="lazy"`, `decoding="async"`, ancho/alto fijados (sin salto de layout) y un halo `drop-shadow` del color del icono. Estados `activa/apagada/congelada` cambian el archivo, no el filtro.
- Se retiran las llamas de emoji/gris del marcador de racha a 0: se muestra `llama-apagada` con un destello de «enciéndeme» (§4).
- Un único **sprite** SVG para los B (`<symbol>`), `<use>` en lugar de `{#each}` de paths: menos DOM (hoy cada icono pinta un `<svg>` completo).

## 4. Catálogo de animaciones y microinteracciones

Reglas: (1) **todo movimiento tiene propósito** (confirmar, guiar, celebrar, dar profundidad); (2) **una sola familia de curvas** (tokens de 2.1): `--ease-expo` para layout y hojas, `--ease-spring` para «pop» y rebote, `--ease-out` para entradas, `--ease-inout` para anillos y barras; (3) duraciones solo de la escala `90/160/260/420/700 ms` (Duolingo concentra el 60 % de sus animaciones en .3 s y .4 s; Speak, en .5 s); (4) solo `transform`, `opacity`, `filter` y `stroke-dashoffset` (sin animar `width/height` salvo barras y acordeones por `grid-template-rows`); (5) `prefers-reduced-motion` de verdad con `@media` (Duolingo no lo hace en CSS): se sustituye por fundido de 150 ms y desaparecen flotación, inclinación, brillos, parallax, halos y partículas; (6) pausa de lo infinito fuera de pantalla (`IntersectionObserver`) y con la pestaña oculta; (7) cada hito lleva **sonido y háptica** emparejados (`lib/sound.ts`, `vibrate` solo donde exista).

| # | Nombre | Qué anima | Disparo | Duración | Curva | Detalle (referencia) | Sonido / háptica |
|---|---|---|---|---|---|---|---|
| 4.1 | **press** | Botón/panel `.tap` baja el grosor del labio, sombra a 0 | `:active` | 90 ms | linear | `translateY(var(--lip))` (Duolingo 100 ms linear) | `tap` · vibrate 8 |
| 4.2 | **lift + tilt** | Panel sube 3 px; inclinación 3D ≤ 6° con brillo que sigue al cursor | hover (solo ratón) | 220 ms (seguir 120, volver 420) | `--ease-out` / `--ease-expo` | `perspective:900px`; objeto 3D con `translateZ(40px)` | — |
| 4.3 | **sheen** | Franja diagonal blanca cruza el botón | hover del CTA; 1 vez al montar el CTA principal (tras 900 ms) | 700 ms | `cubic-bezier(.54,.2,.6,.71)` | `skewX(-35deg)`, `translateX(-120% → 420%)`, opacidad .6 (Duolingo `_39wxj`) | — |
| 4.4 | **reveal** | Aparición al entrar en pantalla: `opacity 0→1`, `translateY(18px→0)` | `IntersectionObserver` umbral .18, una vez (Praktika `useReveal`) | 420 ms, escalonado 60 ms × i (máx 6 = 360 ms de cola) | `--ease-out` | Sin IO si hay movimiento reducido; ya en pantalla = visible sin animar | — |
| 4.5 | **pop** | Insignias, chips, ✔ de acierto: `scale .7 → 1.1 → .9 → 1` + `opacity` | al aparecer | 450 ms | `--ease-spring` | Duolingo `_3qS6D` | `success` · vibrate 10 |
| 4.6 | **count-up** | Contador (`Counter`) sube; en XP, **rodillo de dígitos** (`translateY` por dígito) | al montar / al cambiar | 600 ms (rodillo 480) | `--ease-out` | `tabular-nums`; al llegar, «rebote» de 220 ms (`scale 1.12 → 1`) | `coin` si hay monedas |
| 4.7 | **ring-fill** | Anillo SVG de meta/puntuación: `stroke-dashoffset` hasta el valor | al entrar en pantalla (+150 ms) | 1000 ms | `--ease-inout` | ELSA: 1 s ease-in-out, radio 12 u (grande) / 10 u; extremo redondeado; giro −90° | `whoosh` suave |
| 4.8 | **bar-fill** | Barra de XP/progreso se llena + destello en la punta | al cambiar el valor | 500 ms | `ease` → `--ease-out` | Duolingo `width .5s ease`; punta con brillo de 3 px | — |
| 4.9 | **float** | Capi, objetos 3D y el teléfono-demo flotan: `translateY(0 → −8px)` | reposo, solo en héroes | 3.2 s alternate, infinito | `ease-in-out` | Praktika `heroFloat` (−0.7 rem); fase aleatoria por elemento; pausa fuera de pantalla | — |
| 4.10 | **mic-halo** | 3 anillos de 1.5 px que se expanden y se desvanecen alrededor del orbe en «listo» | estado `ready` | 3.2 s infinito, retraso 0 / 1.07 / 2.13 s | `ease-in-out` | Praktika: 4 anillos 1 px, escala 1→4, 4 s, retraso .8 s; aquí 3 anillos, escala 1→2.4, opacidad .5→0 (§6) | — |
| 4.11 | **sheet** | Hoja inferior (resultado, filtros, compra): `translateY(100% → 0)` + velo | abrir | 420 ms (cerrar 240) | `--ease-expo` (cerrar `ease-in`) | Duolingo 400 ms spring; asa 36×4; arrastrar para cerrar si velocidad > .5 px/ms o desplazamiento > 35 % | `whoosh` · vibrate 8 |
| 4.12 | **vista** | Transición entre pantallas: fundido cruzado + 12 px de deslizamiento; **elementos compartidos** (Capi, sala→mesa) con `view-transition-name` | navegación (`document.startViewTransition`) | 260 ms (compartidos 420) | `--ease-expo` | ELSA usa `astroSlide*`; Duolingo ninguna. Sin soporte → corte | — |
| 4.13 | **nav-ind** | El indicador activo de la navegación se desliza al icono nuevo; el icono hace `translateY(-2px) scale(1.12)` | cambio de pestaña | 420 ms (icono 320 con rebote) | `--ease-expo` / `--ease-spring` | ya existe (Shell); en escritorio el icono pasa a versión 3D | `tap` |
| 4.14 | **toast** | Entra desde arriba 16 px + `scale .96→1`; sale deslizando | evento | 320 ms; permanece 3.2 s | `--ease-spring` | arrastrar para descartar (sonner `swipe-out`) | `success`/`error` según tono |
| 4.15 | **reward-fly** | Moneda/XP **vuelan en arco** desde el origen al contador de la barra (o riel) y el contador rebota | ganar monedas/XP | 700 ms (+60 ms entre piezas, máx 6) | `cubic-bezier(.4,0,.2,1)` + `scale 1 → .6` | Web Animations API sobre `transform` con 2 puntos de control; al llegar, 4.6 | `coin` ×n · vibrate 10 |
| 4.16 | **ignite** | **Racha**: llama-ceniza → llama viva: `scale .6 → 1.2 → 1`, `brightness .4 → 1`, 8 chispas con `translate` radial | primer día / mantener racha | 650 ms + chispas 500 | `--ease-spring` / `--ease-out` | Duolingo/ELSA celebran el día 1; aquí es el momento de marca | `levelup` corto |
| 4.17 | **chest** | Cofre: sacudida 3 × (±6°, 80 ms) → tapa salta → monedas en abanico | abrir cofre | 900 ms | `--ease-spring` | 3D de Flow en 2 imágenes (cerrado/abierto) + partículas CSS | `coin` ×3 · vibrate [10,40,10] |
| 4.18 | **level-up** | Pantalla de nivel: rayos `--rays` giran lentos, insignia 3D hace `pop`, confeti 1.6 s | subir de nivel | 1.6 s | `--ease-out` | `lib/confetti.ts` | `levelup` |
| 4.19 | **shake** | Error: sacudida horizontal ±7 px; el borde parpadea coral | respuesta errónea / permiso denegado | 420 ms | `ease-in-out` | ya existe en `MicButton` | `error` · vibrate [10,40,10] |
| 4.20 | **flip** | Tarjeta de Repasar gira para mostrar el reverso | tocar / `Espacio` | 520 ms | `--ease-inout` | `perspective:1000px`, `rotateY(0→180deg)`, `backface-visibility:hidden` | `tap` |
| 4.21 | **deck** | Baraja (Speak): 2 tarjetas asoman detrás (`translateY 8/16 px`, `scale .97/.94`); al responder la frontal sale volando (`translateX ±120 %`, `rotate ±8°`) y las otras suben | responder / deslizar | 320 ms | `--ease-expo` | Arrastre con la mano: sigue el dedo 1:1, umbral 35 % del ancho | `whoosh` · vibrate 8 |
| 4.22 | **línea del cliente** | La frase del cliente aparece **palabra a palabra** sincronizada con su voz (TTS) | llega el turno | 40 ms entre palabras (o por `timeupdate`) | `--ease-out` | La traducción entra a los 600 ms con `opacity` | voz del cliente |
| 4.23 | **sweep** | Marcador por palabra se «pinta» de izquierda a derecha (2.7) | al mostrar el resultado | 320 ms, +70 ms por palabra | `--ease-out` | `background-size 0 → 100 %` | `success` o `error` en la palabra clave |
| 4.24 | **ánimo** | Cara del cliente: `scale 1 → 1.25 → 1` + barra de ánimo cambia de color y ancho | cambia el ánimo | 280 ms (barra 500) | `--ease-spring` | La cara cambia de icono con fundido de 120 ms | `tap` agudo si sube |
| 4.25 | **skeleton** | Esqueleto: brillo que cruza | carga | 1.4 s infinito | linear | `Skeleton.svelte` ya existe; alinear a 1.4 s | — |
| 4.26 | **parallax** | Sala en 3 capas (fondo, mesa, personaje) con ≤ 6 px de desplazamiento según el cursor | movimiento del ratón (escritorio) | seguir 600 ms | `--ease-out` | Mesas 2.0 (14); sin giroscopio | — |
| 4.27 | **tooltip** | Aparece con `translateY(6px→0)` + `opacity` | hover/foco 350 ms | 140 ms | `--ease-out` | Incluye chip de atajo (`Espacio`) | — |
| 4.28 | **foco** | Anillo de foco 3 px turquesa, offset 3 px | `:focus-visible` | 120 ms | `--ease-out` | ya global | — |
| 4.29 | **escribir comanda** | Línea nueva de la comanda se «escribe» (`clip-path` de izquierda a derecha) + el precio sube a `Propina` con 4.6 | plato confirmado | 380 ms | `--ease-out` | Caveat 22 px | `tap` grave (lápiz) |
| 4.30 | **luces** | Lámparas de la sala: `opacity .92 ↔ 1`; luces de cuerda del login con retardo en cascada | reposo (solo escritorio) | 6 s infinito | `ease-in-out` | Sutil: si se nota, está de más | — |

### 4.31 Reglas de coreografía
- **Entrada de pantalla** (móvil y escritorio): título 0 ms → bloque héroe 80 ms → módulos 160 ms + 60 ms × i; total ≤ 600 ms.
- **Resultado de voz**: veredicto (hoja sube, 4.11) 0 → anillo (4.7) 150 → cifra (4.6) 150 → marcadores (4.23) 450 → consejo 900 → botón «Siguiente» 1100 (sin bloquear: el botón se puede pulsar desde 0 ms si hay atajo).
- **Cierre de turno**: reseña (pop de estrellas una a una, 120 ms entre ellas) → propina (4.15 al contador) → frases flojas pasan al mazo con `deck` hacia el icono de Repasar.
- **Nunca** animar más de 2 cosas a la vez en el mismo lugar de la pantalla; **nunca** un movimiento infinito junto a un texto que se está leyendo (solo en héroes y estados vacíos).
- **Sonido**: tabla de volúmenes de 16 (acierto/error .35; micrófono .3; fin de lección .5); un solo sonido a la vez; interruptor `e47.sound`.
- **Rendimiento**: `will-change` solo durante la animación; las infinitas con `animation-play-state` ligado a visibilidad; presupuesto 60 fps en gama media y **degradar** (sin inclinación, sin grano, sin cristal) con `@media (update: slow)` o si el FPS medido baja de 40.

## 5. Escritorio «Estudio» vs móvil «Bolsillo», pantalla por pantalla

### 5.0 Reglas de las dos interfaces
**Puntos de corte** (los de Duolingo: 700 es el principal y 1100 el segundo; ELSA 500/1024/1520): `< 700` móvil · `700-1099` tableta (composición móvil con 2 columnas y riel compacto de 88 px, sin panel derecho) · `≥ 1100` escritorio · `≥ 1600` ancho (el contenido no crece: se centra, máx 1480 con márgenes que respiran). Se implementa con `@container`/`@media` y un atributo `data-layout="pocket|studio"` en `<html>` fijado por `matchMedia` para que el JS (gestos, atajos, tilt) también lo sepa.

| Dimensión | Bolsillo (móvil) | Estudio (escritorio) |
|---|---|---|
| Márgenes | 16 px (20 px en ≥ 400) | 32 px; gutter de rejilla 24 px |
| Rejilla | 1 columna; carruseles `scroll-snap` x | 12 columnas, máx 1240 + panel derecho 344 |
| Navegación | inferior (5 pestañas, 64 px + safe-area, cristal) | riel izquierdo 272 px con marca |
| Panel secundario | **hoja inferior** (snap 50 % / 92 %) | **panel lateral derecho** (344 px, fijo) y cajón (420 px) |
| Objetivos táctiles | ≥ 48 px, principal 56 | 40 px con cursor, 48 con teclado; el principal 52-56 |
| Texto | cuerpo 17, frase 28 | cuerpo 18, frase 40; nada bajo 14 px |
| Entrada | toque, arrastre, deslizar | clic, hover, **teclado**, rueda; sin gestos obligatorios |
| Alto | la pantalla de juego cabe en `100dvh` sin scroll | idem en 1366×768 (mínimo soportado) |
| Densidad | una tarea a la vez | 3 cosas a la vez (tarea + contexto + progreso) |

**Atajos globales de escritorio** (visibles en un chip dentro de cada tooltip y en una hoja de ayuda con `?`): `g` luego `h/r/m/b/y` = ir a Hoy/Repasar/Mesas/Biblioteca/Yo · `/` buscar (Biblioteca) · `?` ayuda de atajos · `Esc` cerrar/salir (con confirmación en juego) · `Enter` acción principal · `m` silenciar sonido. En pantallas de voz: `Espacio` micrófono, `←/→`, `1-4`, `r`, `s` (ver abajo). Foco visible siempre; `Tab` sigue el orden visual.

### 5.1 Shell (barra, navegación, paneles)

**Escritorio ≥ 1100** — se elimina la barra superior actual (racha y monedas a 600 px del contenido):
```
┌───────────┬──────────────────────────────────────────────┬──────────────┐
│ RIEL 272  │ CONTENIDO (rejilla 12 col, máx 1240, gap 24) │ PANEL 344    │
│ marca     │ título de pantalla (display)                 │ Racha        │
│ Hoy       │ módulos                                       │ Meta de hoy  │
│ Repasar   │                                               │ Liga (top 3) │
│ Mesas     │                                               │ Propinas     │
│ Biblioteca│                                               │ Capi dice…   │
│ Yo        │                                               │              │
│ ─ Nv·XP   │                                               │              │
│ Capi tip  │                                               │              │
└───────────┴──────────────────────────────────────────────┴──────────────┘
```
- **Riel** (`position:sticky; top:0; height:100dvh`, fondo `--night-1`, borde derecho `--line-1`): arriba wordmark SVG 28 px + mini-Capi; 5 ítems de 56 px de alto (icono 28 + etiqueta Bricolage 700 16 px; activo = fondo `rgb(255 176 32 / .10)`, borde 1.5 px ámbar al 35 %, icono 3D de 36 px con rebote 320 ms, chip de atajo `g h` a la derecha en gris); abajo la tarjeta de **nivel** (anillo de XP con número, «Nv 3 · Mesero») y un **consejo de Capi** en Caveat (cambia por día).
- **Panel derecho** (344 px, `position:sticky; top:24px`, 3-4 módulos de 96-160 px): racha (llama 3D 72 px + cifra display + 7 puntos de la semana), meta de hoy (3 anillos compactos de 56 px con objeto 3D), liga (top 3 + tú) y propinas del día. En Mesa en juego y Repasar el panel **cambia de contenido** (comanda / resultado / frase).
- **Barra superior** solo en subpantallas (breadcrumb + acciones); 64 px; al hacer scroll gana cristal.
- Monedas, racha y XP viven en el panel y el riel; **desaparecen de la barra**.

**Móvil < 700**
- Barra superior **56 px + safe-area**: izquierda mini-Capi/atrás, centro título pequeño al hacer scroll (cristal), derecha 2 píldoras (llama 3D 20 px + n, moneda 3D 20 px + n). La barra de nivel «Nv 1 — Aprendiz» se convierte en **anillo de XP alrededor del avatar** (progreso visible, menos altura).
- **Navegación inferior** 64 px + safe-area, **cristal**; la pestaña **Mesas** (la razón de pagar) va **elevada 12 px** con su cloche 3D de 44 px y un círculo de luz ámbar detrás; las otras con icono duotono 24 + etiqueta 11/700; indicador deslizante (4.13). Se oculta al abrir un teclado o una pantalla completa (mesa en juego, login).
- **Zona del pulgar**: acciones primarias en el 40 % inferior; el 25 % superior solo informa o cierra. CTA principal de pantalla = **dock fijo** sobre la navegación (56 px, ancho completo menos 32) mientras haya algo que hacer.
- Hojas inferiores: asa 36×4, radio superior 28, snap 50 %/92 %, arrastrar para cerrar; el fondo se atenúa a .55 y baja 4 px de escala (efecto «capa»).
- Gestos: borde izquierdo → atrás; arrastrar la hoja; deslizar tarjetas en Repasar; mantener pulsado el micrófono (ajuste opcional «mantener para hablar»).

### 5.2 Hoy
**Escritorio** (cols 1-8 + panel): 
1. **Héroe** 8 col × 300 px, `--aurora` + `--rays` + Capi 3D de 240 px sobresaliendo 28 px por arriba-derecha y un globo de Caveat («¡Hoy toca una mesa de turistas!»); saludo en display 56/56 («Buenos días, Ana»), subtítulo 18 px, **CTA «Empezar mi práctica» 56 px con `--grad-sunset`** y secundario «Ir a Mesas». Tecla `Enter` = CTA.
2. Fila 2: **Meta de hoy** (cols 1-5): 3 módulos con objeto 3D (libro, cloche, micrófono), anillo 88 px, «0/2 · +15 XP»; clic abre la actividad; teclas `1/2/3`. **Racha** (cols 6-8): llama 3D 96 px, cifra display, calendario de 7 días con ✔, protectores como escudos 3D.
3. Fila 3: «Reto de la semana» (barra + cofre 3D) y «Aprendiz/Mesas/Pronunciar» como 3 tarjetas de progreso con la imagen del salón.
4. «Primer día» → tira de 56 px descartable arriba del héroe (no tarjeta de 60 px permanente).
En 1440×900 se ven héroe + fila 2 + inicio de fila 3 sin scroll.

**Móvil**: héroe de 220 px a sangre (radio inferior 28) con Capi 140 px a la derecha, saludo 32/36 («Buenos días, Ana» en una línea), **sin** tarjeta de «primer día» (pasa a chip). Después: **Meta de hoy** como **3 mosaicos** 112×150 (objeto 3D 56 + anillo 56 + «0/2») en fila con `scroll-snap`; **racha** como cinta de 72 px; resto en bloques planos. **Dock CTA** «Empezar mi práctica» fijo sobre la navegación hasta cumplir las 3 metas (entonces se vuelve «Ver mi día» + confeti). Pull-to-refresh no necesario.

### 5.3 Repasar
**Escritorio** — *maestro-detalle* sin scroll de página:
- Izquierda (cols 1-4): lista «Tus frases de hoy» con filas de 64 px (frase 19/700, traducción 15, círculo de audio 40 px, punto de estado: nueva/débil/firme); selección con `↑/↓`.
- Derecha (cols 5-12): **tarjeta grande** 560×340 con la frase a 40 px, IPA/pronunciación figurada (`ui ar ful ráit náu`) en ámbar, traducción, y debajo el **mic dock** (§6). Controles: `Espacio` (micrófono), `←` «otra vez», `→` «lo sé», `1-4` calificar, `r` oír modelo, `s` oír lento, `Enter` siguiente.
- Panel derecho del shell: progreso de la tanda (segmentos) y racha.
**Móvil** — **baraja** a pantalla completa (Speak): tarjeta 100 % − 32 de ancho y ~54 dvh, frase 28/34, dos tarjetas asomando detrás; arrastrar = otra vez (←, coral) / lo sé (→, lima) con la tarjeta tiñéndose; **mic dock** en el tercio inferior con [teclado] [ORBE] [tortuga]; segmentos de progreso (5-9) de 3 px arriba (Praktika); la lista completa en hoja inferior.

### 5.4 Mesas (portada) y mesa en juego
**Portada, escritorio**: título display + tira fina de estadísticas (Dificultad · Propinas · Turno de hoy) de 56 px; **El Turno** como tarjeta héroe de 8 col × 280 px con la sala a sangre, objetos 3D, chip «Cuenta para la racha» y CTA; **Servicio libre** y **Menú propio** en 2 tarjetas de 4 col; debajo **Salones** (5 tarjetas 16:9 de 4 col con la sala, candado/estrellas, paleta propia, hover = parallax 6 px y tilt). **Móvil**: El Turno a sangre 220 px; salones en carrusel horizontal (78 % de ancho); estadísticas como chips; dificultad en hoja.

**Mesa en juego — la pantalla más importante.**

*Escritorio ≥ 1100 (cabe en 1366×768 sin scroll).* Pantalla completa sin shell (como hoy) pero con rejilla propia:
```
┌ barra 56: [✕ salir]  ▓▓▓░ turno 2/4 · mesa 1        [propina $12] ┐
├──────────────────────────────────────────┬────────────────────────┤
│ ESCENA 16:9 (1fr, mín 640, máx 880)      │ PANEL LATERAL 360      │
│  [ánimo ☺ ▓▓░]            [lista espera]│  ── Comanda (ticket) ──│
│  burbuja del cliente (cristal)           │  1× Burger  medium     │
│  cliente 3D                              │  1× Coke               │
│                                          │  propina $12           │
├──────────────────────────────────────────┤  ── o ── Resultado ──  │
│ DOCK de voz (centrado bajo la escena)    │  ring · chips · consejo│
│ Tú dices: frase 40 px · [⌨] (MIC) [🐢]   │  [Siguiente ↵]         │
└──────────────────────────────────────────┴────────────────────────┘
```
- **Presupuesto vertical** (800 px): barra 56 + escena `min(52dvh, ancho/16×9)` ≈ 416 + dock 220 = 692 → **el micrófono queda a ~y 640-740, sobre el pliegue** (hoy está en 715-795 cortado). Si la ventana es < 720 de alto, la escena baja a 44 dvh y la frase a 32 px.
- **Panel lateral con dos modos**: *Comanda* (ticket 2.3c, líneas en Caveat, el precio sube a Propina) mientras se atiende; **Resultado** cuando termina la evaluación: anillo 140 px con chips (palabras, claridad, tiempo), frase con marcador (2.7), «Es mejor decir…» con píldoras (Praktika), consejo de una línea con botón «Oír modelo / Oír tu voz» (ELSA), botón **Siguiente** (`Enter`). La escena sigue visible y **el cliente reacciona** (cara y línea nueva).
- Ánimo del cliente: chip de cristal con cara 3D y barra; si baja, la sala toma un viñeteado coral suave.
- Atajos: `Espacio` micrófono (mantener = hablar y soltar = parar si dura > 350 ms; pulsación corta = alternar), `Enter` siguiente, `h` ayuda («Te mostramos qué decir»), `l` oír lento, `r` oír al cliente otra vez, `Esc` salir. Tooltips con atajo.
- **Cierre del turno**: modal central 560 px: estrellas de reseña 3D, propina que vuela al contador, trofeo si hay, y «frases para repasar» que viajan al icono de Repasar; botón «Otra mesa» (`Enter`).

*Móvil < 700.* Pantalla completa, **sin scroll de página**:
- **Escena a sangre arriba** `42dvh` (radio inferior 28), sin marco, el cliente de pie; **burbuja** del cliente de cristal anclada al borde inferior de la escena (máx 3 líneas; resto con «ver más»); chip de ánimo arriba-izquierda; **comanda plegada** = chip tipo ticket «Comanda 2/4» arriba-derecha que abre una **hoja** (snap 50 %).
- **Dock de voz** en el 38 % inferior sobre degradado `transparent → night-0`: etiqueta «TÚ DICES», frase 28/34 con IPA figurada, y la fila [⌨ teclado 48] [**ORBE 96**] [🐢 lento 48] a 24 px del borde inferior (alcance del pulgar). «Responder escribiendo» siempre visible.
- **Resultado = hoja inferior** que sube sobre el dock (4.11) con labio de color del veredicto (lima/ámbar/coral): anillo 96 + cifra, frase con marcadores, «Es mejor decir…», consejo, botón **Siguiente** de 56 px a ancho completo; arrastrar hacia arriba para expandir la explicación (92 %). Vibración [10] según veredicto.
- Teclado abierto (escribir): el dock sube con `visualViewport`; la escena se contrae a 28 dvh.

### 5.5 Biblioteca
**Escritorio**: portada como **estantería** 12 col: tile grande «Diccionario VIP» (corona 3D, 6 col × 200), 4 tiles de 3 col (Expresiones, Mis errores, Favoritas, Mis palabras) con objeto 3D y contador; reemplaza las 5 filas idénticas. Dentro de Expresiones: **maestro-detalle** — filtros a la izquierda (nivel, categoría, «solo flojas»: chips, 240 px), rejilla de 2 columnas de tarjetas de frase (19 px/700 + traducción 15 + audio + corazón), **cajón derecho** de 420 px con ficha (pronunciación figurada, ejemplos, «Practicar esta frase»), `Esc` lo cierra, `/` enfoca la búsqueda. Diccionario VIP: tabla con cabecera fija y columnas de formas verbales; acordeón por `grid-template-rows` (ELSA).
**Móvil**: buscador fijo arriba (cristal), chips de filtro con scroll horizontal, lista de filas de 72 px con audio a la derecha, deslizar a la derecha = favorito, ficha en hoja 92 %. Portada: 2×2 de tiles + Diccionario VIP a ancho completo.

### 5.6 Yo, Tienda, Ranking, Logros
**Escritorio — Tienda como vestidor** (cols 1-12): izquierda **escaparate de Capi** 360 px sticky (3D, arrastrar para girar, rayos tras él, monedas arriba) con **prueba en vivo**: al pasar el cursor sobre una prenda se la pone en Capi (150 ms fundido); derecha rejilla de **4-5 columnas** de tarjetas con el objeto 3D sobresaliendo, nombre, precio con moneda, estado (Puesto/Comprar/Candado con requisito); categorías como píldoras en una barra fija; `Enter` = comprar/poner; compra con popover de confirmación junto al botón (no hoja).
**Móvil — Tienda**: Capi de prueba **sticky arriba 36 dvh** con degradado; debajo rejilla de **3 columnas** (objetos 3D 72 px), tocar = prueba instantánea; **CTA fijo** «Comprar · 350» en el dock; detalles en hoja.
**Perfil**: escritorio = banner `--aurora` con Capi vestido de 260 px, nombre display, insignias 3D en fila, calendario de racha ancho y 3 cifras grandes (XP, racha, mesas); móvil = el mismo banner a 200 px y cifras en una fila de 3.
**Ranking**: escritorio = **podio** (3 copas 3D de altura distinta) + tabla de filas de 56 px con tu fila resaltada; móvil = lista con tu fila **fija abajo** (sticky) y el podio compacto arriba.
**Logros**: rejilla de medallas 3D (escritorio 6 col, móvil 3 col); bloqueadas = silueta gris con candado; abrir = hoja/cajón con la historia y el progreso.

### 5.7 Login e invitación
**Escritorio — pantalla dividida**: izquierda **56 %** foto del rooftop (ya existe) con aurora, luces de cuerda animadas (4.30), Capi 3D de 380 px saludando y globo con cola en Bricolage («Welcome back!»); derecha **44 %** panel sólido `--night-2` de 480 px centrado: wordmark SVG 96 px, titular H1 «Bienvenido de vuelta», campos de 56 px (radio 14, etiqueta visible, ojo para contraseña), CTA ámbar 56 px, enlace «¿Tienes una invitación?» como botón secundario, aviso legal en 13 px. `Enter` envía.
**Móvil**: foto a sangre arriba 38 dvh con Capi asomando sobre el borde de la hoja; el formulario es una **hoja** que cubre 62 % (radio superior 28), campos 56 px, CTA fijo en el pulgar, `autocomplete` correcto; con el teclado abierto la hoja sube (`visualViewport`) y la foto se reduce a 20 dvh. La **invitación** reutiliza la misma estructura con el código precargado y la ficha del restaurante (logo + nombre) en el héroe.

### 5.8 Qué se comparte y qué no
Se comparte: tokens, componentes (`Button`, `Panel`, `Ico3D`, `Icon`, `MicDock`, `Sheet`), arte, sonidos, textos, lógica y rutas. No se comparte: **composiciones** (cada pantalla exporta `Pocket.svelte` y `Studio.svelte` sobre los mismos componentes de datos), ni los gestos (solo móvil) ni los atajos/hover/tilt (solo escritorio). Las pruebas e2e corren en 390 (Pixel 7) **y** 1440×900 **y** 1366×768 (verifica que el micrófono queda sobre el pliegue) con capturas.

## 6. Micrófono definitivo («Mic dock»)

La **máquina de estados, la calibración de ruido, los umbrales de voz, los tiempos, la técnica de audio, la accesibilidad y los textos** ya están especificados en `investigacion/16-rea-duolingo-profundo.md` §A.5 (estados `unsupported | needs-permission | denied | ready | asking | calibrating | listening | heard | processing | done | no-sound | device-lost | error`). **Esto no se repite**: aquí se define **cómo se ve y se mueve** cada estado y cómo se compone en cada formato, con lo que aportan ELSA (orbe de 90 px con sombra de color, media luna cortada por el borde, anillo de puntuación) y Praktika (orbe de 100 px con anillos de radar).

### 6.1 Anatomía (de atrás hacia delante)
1. **Dock**: contenedor de la zona de voz. Móvil: panel de ancho completo con `linear-gradient(0deg, var(--night-0) 55%, transparent)` y 24 px de relleno inferior + safe-area; escritorio: bajo la escena, centrado, `--r-xl`, cristal (`--glass-*`).
2. **Halo**: 3 anillos de 1.5 px (`border: 1.5px solid rgb(var(--glow) / .5)`), radio 50 %, mismo centro que el orbe.
3. **Corona de barras radiales**: **40 trazos** de 3 px de ancho (extremos redondeados) repartidos 360° a `radio orbe + 14 px`; longitud `4 + 26 × nivelBanda` px. Se pinta en **un `<canvas>` 2D** de 220×220 (o SVG con 40 `<line>` y `transform` por rAF): presupuesto < 1 ms/fotograma, 30 fps en gama baja. Los 40 trazos se alimentan con **20 bandas** de `AnalyserNode.getByteFrequencyData` (`fftSize 256`, `smoothingTimeConstant .55`, bandas de 85 Hz a 4 kHz en escala logarítmica) **espejadas** (izquierda = derecha) para que respire simétrico. Color por trazo: `--glow` con `alpha .35 + .65 × banda`. La envolvente global (RMS −60..−12 dBFS, ataque .6 / caída .9, ya en el proyecto) sigue gobernando la escala del orbe y el resplandor.
4. **Arco de tiempo**: un anillo fino de 2 px **por fuera** de la corona que se vacía en sentido horario durante el tiempo máximo de la frase (`min(20 s, 4 s + .7 s × palabras)`); en el último 3 s pasa a coral y late. Si «Terminar solo» está activo, el arco se detiene cuando se detecta silencio de cierre.
5. **Orbe**: círculo de **96 px en móvil / 88 px en escritorio** (en ≥ 1100 el dock da aire; ELSA 90, Praktika 100, Duolingo DET 80). Material: `radial-gradient(circle at 32% 28%, color-mix(in oklab, var(--glow) 70%, white), var(--glow) 55%, var(--glow-700))`; sombra `0 6px 0 var(--glow-900), 0 14px 30px rgb(0 0 0 / .45), 0 0 28px rgb(var(--glow) / .35)`; borde de luz `inset 0 1px 0 rgb(255 255 255 / .35)`. Icono 36 px en `--on-accent` (duotono, con la barrita de acento).
6. **Controles laterales** (48 px, `icon`): izquierda **teclado** («Responder escribiendo», siempre visible), derecha **tortuga** («Oír lento» el modelo). Separación 44 px del orbe. Con tooltip y atajo (`t`, `s`).
7. **Etiqueta** (Bricolage 700 17 px) + **subtexto** (Inter 15 px `--muted`) debajo, con `role="status" aria-live="polite"`; en escritorio, el chip de atajo `Espacio` al lado.
8. **Objetivo táctil**: orbe 96 + 16 invisibles = 128 px; los laterales 48 + 8.

### 6.2 Estados (apariencia, movimiento y salida)
`--glow` por estado: ámbar `255 176 32` (acción), turquesa `31 214 200` (voz), lima `123 224 74` (bien), coral `255 93 122` (problema), violeta `141 123 255` (procesando).

| Estado | Orbe | Halo / corona | Icono | Texto principal · apoyo | Sonido · háptica |
|---|---|---|---|---|---|
| `ready` | ámbar; «respira» `scale 1 → 1.045` 3.2 s | **3 anillos** en bucle: `scale 1 → 2.4`, `opacity .5 → 0`, 3.2 s ease-in-out, retraso 0/1.07/2.13 s (Praktika adaptado); corona **plana** (trazos de 4 px, opacidad .25) | micrófono | «Toca y habla» · «Di la frase en inglés» | — |
| `needs-permission` | ámbar apagado (saturación .6) con un «candado de pregunta» | sin anillos | micrófono + `?` | «Activa el micrófono» · «Tu navegador te va a preguntar. Toca Permitir.» + botón «Activar» | — |
| `asking` | ámbar con halo único fijo | un anillo que gira lento (3 s linear) | micrófono | «Esperando tu permiso…» · «Mira la ventana del navegador» | — |
| `calibrating` | ámbar → turquesa (200 ms) | **un solo pulso** de anillo (500 ms, 1×) | micrófono | «Un momento…» · «Escuchando el ruido del lugar» | — |
| `listening` (sin voz) | **turquesa**, `scale 1`, sin respiración | anillos apagados; corona **baja** (4-8 px) con parpadeo de 1 trazo cada 400 ms para que se note vivo | micrófono con punto rojo 12 px parpadeante «● grabando» | «Te escucho…» · «Cuando quieras, habla» | **pitido de inicio** (`start`, vol .3) · vibrate 12 |
| `heard` (voz detectada) | turquesa brillante; `scale 1 + .14 × nivel`; sombra `0 0 (24 + 60 × nivel) px` | **corona viva** (40 trazos por banda); 1 anillo de destello a los 100 ms de voz | micrófono (barra de acento sube con el nivel) | «Habla ahora» · «Toca el botón cuando termines» | — |
| `listening` (ruido alto) | turquesa con borde coral 2 px | corona con trazos en coral | micrófono + `!` | «Hay mucho ruido» · «Acércate al micrófono o busca un lugar más tranquilo» | — |
| `processing` | violeta; encoge a 88 %, sin respiración | **corona colapsa** a 3 puntos que orbitan (900 ms linear); arco de tiempo desaparece | tres puntos / ondas que suben en cascada 120 ms | «Analizando tu voz…» | `stop` (vol .3) · vibrate 8 |
| `done` — bien | **lima**; `pop` 420 ms spring | **un anillo** de celebración (scale 1 → 2.2, .6 → 0, 500 ms) + 6 chispas | ✔ que se dibuja (260 ms) | «¡Listo!» | `success` (.35) · vibrate 10 |
| `done` — casi | ámbar | anillo ámbar | `~` | «Casi» + palabra a mejorar | `tap` agudo |
| `done` — mal | **coral**, sacudida 420 ms | sin anillo | ✖ | «Otra vez, tú puedes» (sin culpa) | `error` (.35) · vibrate [10,40,10] |
| `no-sound` | coral suave, `shake` corto | corona plana coral | micrófono con raya | «No te escuché» · «Acércate más y repite. No cuenta como intento.» + reintento inmediato | `error` suave |
| `denied` | gris-ceniza con candado | sin anillos | `mic-bloqueado` | «El micrófono está bloqueado» · «Actívalo en el candado de la barra del navegador y vuelve a tocar» + dibujo del candado | — |
| `unsupported` | gris | — | `teclado` en grande | «Tu navegador no puede grabar» · «Prueba con Chrome o Safari actualizado, o responde escribiendo» | — |
| `device-lost` | coral | — | `mic-apagado` | «Se desconectó el micrófono» · «Conéctalo y toca de nuevo» | `error` |
| `error` (red) | coral | arco de reintento (3 intentos, 300·2ⁿ ms) | `refrescar` | «No pudimos enviar tu voz» · «Reintentando…» / «Intenta otra vez» | `error` |

Reglas: (1) **el color nunca es la única señal**: cada estado lleva icono y texto (daltonismo); (2) el estado `heard` solo se activa tras ≥ 3 tics sobre el umbral (≈ 100 ms) para que el ruido de sala no encienda la corona; (3) en `done` el orbe **queda** lima/ámbar/coral hasta que se pulsa Siguiente (no vuelve solo a ámbar); (4) con `prefers-reduced-motion`: sin respiración, anillos ni corona animada; solo una **barra horizontal estática** de nivel de 160×8 px con transición de 120 ms y el texto de estado.

### 6.3 Interacción
- **Alternar** (por defecto): un toque inicia, otro termina; `Espacio` o `Enter` igual. **Mantener para hablar** (ajuste, también `Espacio` mantenido > 350 ms en escritorio): soltar = terminar; deslizar el dedo hacia fuera del orbe = cancelar (el orbe se vuelve gris, «Cancelado»).
- **Terminar solo** (ajuste, apagado por defecto): según 16 (1400 ms de silencio tras ≥ 400 ms de voz).
- **Cancelar**: `Esc` (escritorio) o la «×» que aparece sobre el orbe en `listening`.
- **Oír tu voz**: tras `done`, dos botones circulares de 40 px en el panel de resultado — «Oír modelo» (altavoz) y «Oír tu voz» (oído) —, un solo reproductor activo a la vez (ELSA).
- **Libera** el micrófono al pasar a `processing`, al ocultar la pestaña y al salir (16).

### 6.4 Formatos
- **Móvil**: orbe 96 px en el centro del dock, a 24 px del borde inferior (zona del pulgar); [teclado] a la izquierda, [tortuga] a la derecha; **nada flota por encima en el área del pulgar**; corona de 140 px de diámetro útil (cabe en 390 px con márgenes).
- **Escritorio**: dock centrado bajo la escena (ancho 520, alto 200); orbe 88; chips de atajo (`Espacio`, `t`, `s`); en `heard` el título de la pestaña muestra «● Grabando…»; el resultado va al **panel lateral** (5.4) y el orbe se queda en el estado final.
- **Repasar** reutiliza el mismo componente (`MicDock`) con la tarjeta de frase encima; **Mesa** lo envuelve con el panel de resultado. Un único componente → un único conjunto de pruebas.
- **Pre-tarjeta de permiso** (la primera vez): tarjeta `panel` con Capi señalando hacia la barra del navegador (escritorio) o hacia abajo (móvil), 3 pasos ilustrados y el botón «Activar micrófono».

### 6.5 Componente
`lib/ui/MicDock.svelte` (nuevo; `MicButton.svelte` se conserva hasta migrar): props `phrase`, `maxMs`, `layout='pocket'|'studio'`, `onresult`, `onskip` («escribir»); expone los estados anteriores como `data-state`; la corona vive en `lib/ui/MicCrown.svelte` (canvas, sin dependencias). Pruebas: estados con micrófono falso de Chromium (`--use-fake-device-for-media-stream`, ya en la configuración), capturas de cada estado y axe.

## 7. Orden de implementación por impacto

Criterio: impacto visible por hora de trabajo, empezando por lo que toca **todas** las pantallas y por lo que **arregla un fallo de uso**. Cada fase se puede entregar sola y deja la app consistente.

| Fase | Qué | Cambia | Esfuerzo | Criterio de aceptación |
|---|---|---|---|---|
| **0 · Base de luz** | `tokens-v2.css`, fuentes (Bricolage + Caveat), fondo aurora + grano, `Panel` v2 (doble trazo + labio de tono + tinte), `Button` v2 (sheen, labio de color), titulares y cifras con la nueva tipografía, wordmark SVG | **Toda la app, sin tocar su estructura** | 1-1.5 días | Capturas 390/1440: ninguna tarjeta es «caja gris con línea»; contraste AA; peso JS/CSS +≤ 25 KB, fuentes +≤ 80 KB; axe sin graves |
| **1 · Estudio** | Shell de escritorio (riel 272 + rejilla + panel derecho), eliminar barra superior ≥ 1100, atajos globales, `Hoy` v2 desktop (héroe + fila de módulos) | **El peor fallo: escritorio = móvil estirado** | 2-3 días | A 1280: sin vacío lateral > 64 px; 3 módulos sobre el pliegue en 1440×900 |
| **2 · Mesa sin scroll** | Rejilla de mesa en escritorio (escena + panel lateral comanda/resultado + dock de voz), micrófono sobre el pliegue en 1366×768; móvil: escena a sangre + hoja de resultado | **Fallo crítico de usabilidad** | 2-3 días | e2e a 1366×768: botón del micrófono con `boundingBox().bottom ≤ viewport`; `Espacio` inicia/termina |
| **3 · Iconos** | `Icon` v2 duotono (60 iconos, sprite), `Ico3D` con los 8 objetos ya existentes (llama, moneda, trofeo, cofre, comanda, bandeja, cóctel, platos) en barra/riel/racha/tienda; generar **hojas 1 y 3** en Flow y recortarlas | Racha, monedas, navegación, estados vacíos | 2 días + generación | Ningún icono de línea en estadísticas, racha, monedas ni navegación activa en escritorio |
| **4 · Micrófono v2** | `MicDock` + `MicCrown` (canvas), estados con apariencia propia (6.2), pre-tarjeta, controles laterales | Momento central del producto | 2-3 días | Todos los estados capturados; 60 fps en gama media; reduced-motion con barra |
| **5 · Resultado de voz** | Marcador por palabra, píldoras «Es mejor decir…», anillo con chips, consejo, oír modelo/oír tu voz, hoja de veredicto con color | Donde se siente el valor | 2 días | Ver 2.7 y 4.31; prueba con `GOOD` simulada de `mesas.spec.ts` |
| **6 · Hero y salones** | Héroe de Hoy con Capi, portada de Mesas con salones a sangre y tilt, Tienda como vestidor con prueba en vivo | Primera impresión y deseo | 3 días | — |
| **7 · Login, Biblioteca, Repasar, Yo** | Login dividido, estantería de Biblioteca con maestro-detalle, Repasar maestro-detalle/baraja, perfil y podio | Cierre de consistencia | 3-4 días | — |
| **8 · Movimiento y sonido** | View Transitions con elementos compartidos, `reward-fly`, `ignite`, cofre, level-up, parallax de sala, pase de sonido | Pulido «de primer nivel» | 2-3 días | Reduced-motion verificado; sin jank en Pixel 7 |
| **9 · Hojas 2, 4, 5, 6 de Flow** | Resto de iconos 3D (ligas, servicio, ánimo, tienda) | Completar el jardín de iconos | continuo | ≤ 18 KB por icono; legible a 48 px |

Total estimado: **~21-27 días de trabajo** de una persona; las fases 0-2 (≈ 6 días) producen el 70 % del cambio percibido y corrigen lo más grave.

### 7.1 Presupuestos y riesgos
- **Peso**: CSS +≤ 25 KB, fuentes +≤ 80 KB (Bricolage ~55, Caveat ~25; Outfit −30 al retirarla), iconos 3D 34 × ≤ 14 KB cargados **perezosamente** (≈ 480 KB totales, nunca todos a la vez), canvas de la corona sin dependencias. Sin Lottie/Rive/Three (08 y 16 lo desaconsejan).
- **Rendimiento**: cristal máx. 3 superficies visibles; grano y rayos se apagan con `@media (update: slow)`/`prefers-reduced-transparency`; el canvas de la corona se detiene fuera de `listening`/`heard`.
- **Riesgo de fuentes**: si Bricolage no cargara, el respaldo es Outfit (ya instalada) y el diseño no se rompe (anchos distintos: reservar `min-height` en titulares).
- **Riesgo de coherencia del 3D**: Flow puede mezclar estilos en una hoja; se mitiga con la imagen de estilo (`obj_llama`, `obj_moneda`) y el control de calidad de 3.4.
- **Riesgo de sobrecarga visual**: la regla «un solo degradado de texto, un solo CTA con degradado y como máximo un `panel--neon` por pantalla» evita el exceso. Cuando dudes, **plano**.
- **Cambios de servidor**: ninguno. Los umbrales de color del semáforo (2.7) deben coincidir con la escala real de evaluación en `server/`; si no existe una banda publicada, definirla en cliente a partir de `stars`/`parts` y anotarlo.
- **No copiar**: ni el violeta de ELSA/Praktika, ni su marca, ni las fuentes SF/Aeonik/Axiforma, ni su `alert()` de error de micrófono, ni su aviso de cookies que tapa el móvil, ni el CSS con fuentes en base64 (12). Los patrones y las medidas, sí, con la paleta ámbar/turquesa/coral.

### 7.2 Pruebas y revisión visual obligatorias por fase
Capturas a **390 (Pixel 7)**, **1366×768** y **1440×900**, mirándolas antes de cerrar; `axe` sin graves; `svelte-check` 0 errores; `vite build`; comprobar `prefers-reduced-motion` y `forced-colors`. Un solo Chromium a la vez.

## 8. Anexo — qué se decidió y por qué (resumen de decisiones)
1. **Bricolage Grotesque en lugar de Outfit** para titulares: la geométrica pura de Outfit es de plantilla; Bricolage tiene eje de ancho y personalidad editorial a 800, y mantiene la calidez que pide un producto de hospitalidad. Respaldo Outfit.
2. **Cristal solo en lo que flota**: ELSA no usa `backdrop-filter` (cristal falso con degradado), Praktika tampoco; nosotros lo reservamos para legibilidad/coste.
3. **Labio de color por tono** (de Duolingo 16) llevado a tarjetas: es lo que más distingue «juego táctil» de «panel».
4. **3D para lo deseable, duotono para lo utilitario**: Duolingo ilustra todo; nosotros ya tenemos 3D propio, y los iconos de línea se limitan a controles.
5. **Dos composiciones con un solo sistema**: ELSA/Praktika no resuelven app de escritorio (sin dato público); la propuesta de «Estudio» sale de principios (rejilla de 12, panel contextual, atajos) y de la medida de nuestras capturas, y se valida con pruebas a 1366×768 y 1440×900.
6. **Micrófono con corona radial + 3 anillos en reposo**: combina el radar de Praktika (ready) con un medidor real (que ELSA no tiene) y la máquina de estados de 16.
