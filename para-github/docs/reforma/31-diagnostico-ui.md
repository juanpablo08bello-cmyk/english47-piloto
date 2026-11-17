# 31 - Diagnóstico visual del cliente 2.0 frente a las referencias

Fecha: 2026-11-16. Capturas en `docs/reforma/capturas-diagnostico/` (Playwright, cuenta sembrada, instancia `dis`; **móvil = Pixel 7 emulado (412 px, ×2.6)** y **escritorio 1280×800**). Referencias: informes 11, 12, 13, 16 y 17.

Lo que sí funciona (no tocar): la identidad ámbar/turquesa/coral sobre negro, Capi y el arte de Flow, la foto de rooftop del login, el botón con «labio», el orbe del micrófono, la navegación inferior con indicador deslizante, los estados vacíos con mascota. **El problema no es de «mal diseño»: es de «diseño sin sello»**. Se ve prolijo y genérico; el dueño pide que parezca una web de primer nivel con carácter. Lo siguiente explica por qué y dónde.

## 1. Qué se ve «simple» o «de plantilla» y por qué

| # | Síntoma (captura) | Causa técnica | Qué lo arregla (ver 32) |
|---|---|---|---|
| 1 | **Todas las tarjetas son la misma tarjeta** (`d-hoy`, `d-mesas`, `d-biblioteca`): rectángulo `--surface`, borde 1 px, labio inferior 4 px gris, radio 24. Racha, meta, reto, «primer día» pesan igual. | `Card.svelte`: un solo tratamiento, solo cambia el tinte (`amber/teal` al 10 %). Sin niveles de elevación, sin luz, sin segundo trazo. Duolingo hace igual **pero con el labio de color distinto por tarjeta**; aquí el labio es gris. | Familia de superficies: hero (luz + imagen), panel (doble trazo + labio de tono), ticket (comanda), cristal selectivo, plano. |
| 2 | **Fondo negro plano** `#0a0b0d` en todas las pantallas; el login (foto) es el único sitio con atmósfera y por eso es lo mejor de la app. | `body{background:var(--bg)}`; cero degradado, cero grano, cero luz ambiental. «Ocean Drive de noche» no llega a las pantallas de trabajo. | Aurora (3 resplandores ámbar/coral/turquesa), grano 5 %, rayos Art Deco tras Capi. |
| 3 | **Iconos genéricos**: los de navegación, tiles de Biblioteca, chips y botones son líneas de 2 px del mismo molde que cualquier plantilla (Lucide/Feather). La llama 3D y la moneda 3D existen pero **en la barra superior se usan iconos de línea de 14 px** (`d-hoy`: llama y moneda diminutas). | `Icon.svelte` solo trazo; tiles de 48 px con relleno translúcido (patrón de ELSA 2023). | Dos niveles: 3D para lo deseable (racha, monedas, trofeos), duotono propio para lo utilitario; navegación con iconos de marca. |
| 3b | La **racha a 0** muestra una llama gris con número gris: lo más motivador de la pantalla se ve apagado y plano. | Estado «sin racha» pensado como ausencia. | Llama-ceniza con chispa «enciéndeme» + una frase y animación de encendido (ELSA/Duolingo celebran el primer día). |
| 4 | **Tipografía correcta pero sin carácter**: Outfit 600-700 a −0.02 em es una geométrica muy usada en SaaS. Los titulares «Buenos días, Alumno Prueba» y «Mesas» podrían ser de cualquier app. Cifras (0, 0/2) sin personalidad. | Una sola familia de títulos con tracking estándar; nada de contraste de ancho/peso; sin cifras de marca. | Display con eje de ancho (Bricolage Grotesque 800, wdth 88), cifras grandes con degradado, mano «Caveat» para la comanda. |
| 5 | **Letra pequeña en escritorio**: subtítulos de 12-13 px («Sin protectores», «Se guardan como monedas», «Sube en 4 mesas», 14 px grises) en una pantalla de 1280 px. | Se diseñó a 16 px de móvil y se estiró el contenedor, no el texto. Mínimos de lectura de la guía (17-18 px) no se cumplen en secundarios. | Escala fluida con mínimo 14 px y cuerpo 17-19; subtítulos de 15-16 en escritorio. |
| 6 | **Falta de profundidad**: sin superposición de elementos, nada «sale» de su marco. Capi está dentro de su caja, los objetos 3D no rompen el borde, no hay parallax. | Todo es contenido dentro de cajas; sombras solo negras. ELSA y Praktika **rompen el marco** (avatar que sobresale, tarjetas inclinadas, teléfono que flota). | Objetos 3D que sobresalen 24-28 px del marco, tarjetas inclinadas «sticker», sombra teñida del color del tono. |
| 7 | **Jerarquía débil**: en `d-hoy` hay 6 bloques seguidos de peso parecido; el botón ámbar es el único ancla. El titular (28 px) no domina; la pantalla se lee de arriba abajo como una lista. | Pila vertical sin bloque héroe. | Banner héroe con Capi grande + CTA, y el resto como módulos secundarios. |
| 8 | **Escritorio = móvil estirado** (el fallo mayor, ver §2). | `Shell`: columna de 820 px + riel izquierdo de 220; 240 px de vacío a la derecha; sin panel lateral. | Shell de estudio: riel 272 + rejilla 12 col (máx 1240) + panel derecho 344. |
| 9 | **Biblioteca** (`d-biblioteca`): 5 filas idénticas con tile de icono, título y descripción: parece una pantalla de ajustes, no una biblioteca. | Lista homogénea; icono de línea genérico; sin imagen. | Estantería de tiles con objeto 3D, uno dominante (Diccionario VIP). |
| 10 | **Login** (`d-login`): lo mejor, pero la tarjeta del formulario es plana, el wordmark «ENGLISH47» es texto de Outfit sin lettering propio y el globo «Welcome back!» es una etiqueta rotada 4° en Inter 800 de 13 px (sin la tipografía de marca) y sin cola real (solo la esquina inferior izquierda a 4 px). | `Login.svelte` línea 99: `.bubble` sin `font-family` de marca ni pseudo-elemento de cola. | Wordmark SVG propio; globo con cola en la tipografía de marca; vidrio ligero en la tarjeta. |
| 11 | **Mesas hub** (`d-mesas`): «Dificultad 1» y «Propinas $0» son 2 tarjetas con cifra grande y un hueco enorme; las dos modalidades usan el icono de línea en tile; la sala (el arte más rico) no aparece. | Prioridad visual a números en vez de a los salones. | Tarjetas con la sala a sangre, escrim degradado y objetos 3D; estadísticas en una tira fina. |
| 12 | **Tienda** (`d-tienda`): bien en concepto (arte), pero tarjetas con fondo gris dentro de tarjeta gris, objeto pequeño dentro de caja, sin vista previa en Capi. | Doble caja; el objeto no se vincula con el personaje. | Prueba de prendas en vivo sobre Capi, objetos 3D rompiendo marco. |

## 2. El problema número uno: la composición de escritorio
Evidencia (`d-hoy`, `d-mesas`, `d-biblioteca`, `d-tienda`, `d-repasar` a 1280 px): **la zona de trabajo mide 788 px de ancho (x = 236 a 1024) y queda un vacío de ~256 px a la derecha**; la barra superior pone la racha y las monedas en el extremo derecho, a 600 px de donde se mira. Todo es una pila vertical de tarjetas de ancho completo: «Tu meta de hoy» ocupa 790 × 335 px para enseñar tres anillos pequeños.

**Mesa en juego** (`d-mesa-turno`, `d-mesa-portada`) a 1280×800:
- La escena 16:9 y el panel «Comanda» están pegados a la izquierda (x = 107 a 1174) con otro vacío a la derecha y ninguna lectura central: la composición no está centrada ni usa la proporción de una pantalla ancha.
- **El micrófono — la acción principal — queda en y ≈ 715-795, cortado por el borde inferior de la ventana de 800 px**: en un portátil de 1366×768 el alumno tiene que hacer scroll para poder hablar. Fallo crítico de usabilidad en escritorio (en `m-mesa-turno` el micrófono sí está en la zona del pulgar).
- La comanda de la derecha son 4 líneas grises vacías con borde punteado: un panel de 330 px que no «enseña» nada hasta que hay platos (ocasión desaprovechada de «ticket vivo»).
- «Tú dices» es el bloque de lectura principal (frase 22 px) y es **más pequeño que la burbuja del cliente** de la escena.

**Móvil** (`m-hoy`, `m-mesa-turno`): funciona mejor porque la guía se escribió móvil primero: acción principal en el tercio inferior, navegación inferior, 3 anillos legibles, CTA a ancho completo. Aquí el diagnóstico es de **sello** (puntos 1-7), no de composición. Detalles: la burbuja del cliente tapa un tercio de la escena y al personaje; los títulos se parten en dos líneas («Alumno / Prueba»); la barra de nivel «Nv 1 — Aprendiz» es una línea fina sin presencia; los anillos con `0/2` en gris son tres círculos casi iguales.

## 3. Contra las referencias (qué hacen mejor y es transferible)
- **ELSA**: fondo con luz (índigo + resplandores), tarjetas con tinte de esquina, texto con degradado en 1-2 palabras, radios 20, secciones con esquinas inferiores 24-28, cifras enormes con chips de cristal flotando, radar y anillo. → nosotros: superficies con luz y cifras de marca.
- **Praktika**: hero en panel de radio 32-48 con la ilustración rompiendo el marco, tarjetas de cristal inclinadas con píldoras de color sobre la palabra, hoja inferior con asa, micrófono blanco con ondas de radar. → nosotros: «sticker cards» y hoja de resultado.
- **Speak**: seriedad editorial: titular de 56 px con −0.04 em, mucho aire, una curva de movimiento única (expo-out 500 ms), baraja de tarjetas apiladas, marcador verde por palabra. → nosotros: titulares con tracking apretado y cifras grandes, marcador por palabra.
- **Duolingo** (13/16): el labio **de color** + un sistema de ilustración propio para todo (no iconos de línea). → nosotros: el 3D de Flow en toda la app.
- **Lo que ya hacemos mejor que ellos**: mascota única y consistente, escena viva, voz real con medidor, identidad nocturna más rica que el índigo genérico de ELSA y el morado de Praktika.

## 4. Prioridad del diagnóstico
1. Composición de escritorio y mic sobre el pliegue (usabilidad, no estética).
2. Superficies con luz + fondo aurora + tipografía de marca (el 80 % del «efecto web profesional» con el 20 % del trabajo).
3. Iconos 3D en racha/monedas/navegación y duotono propio para el resto.
4. Resultado de voz al nivel de ELSA/Praktika (marcador por palabra, «es mejor decir», anillo).
5. Pulido de movimiento.
