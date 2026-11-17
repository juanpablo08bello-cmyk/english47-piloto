# Plan v2 — Remasterización total de ENGLISH47 (16/11/2026)

Reemplaza al plan inicial. Incorpora: auditoría, 13 informes (incluido REA sobre ELSA, Praktika y Duolingo), Mesas 2.0 (`14-mesas-2-concepto.md`) y las ideas del dueño. **Regla: todo se construye sin gasto; las IA de pago se enchufan después.**

## Lo que REA confirmó (hechos observados en código público)

- **ELSA:** su widget transmite audio por WebSocket: mono 16 kHz, trozos WAV cada 2 s, mensaje de inicio y de último paquete; el resultado trae puntaje y rangos de caracteres para colorear la frase por tramos. Es el PATRÓN a replicar con nuestro propio servidor y Azure (no se usa nada de ELSA).
- **Duolingo:** medidor de micrófono con `AnalyserNode` cada 200 ms y nivel = (−√media(dB²)+100)/70. Mascota animada con Rive: máquina de estados y triggers `correct`/`incorrect`/`reset`. Sonidos con Howler a volumen 0.35. Botón con sombra dura de 4 px que baja al pulsar.
- **Praktika:** NO usa 3D ni Lottie ni Rive (corrección del informe 04): es React + CSS + un video WebM de 591 KB. Corrige con píldoras rojo/verde por palabra.
- **Límites:** lectura estática de scripts; la voz de Duolingo y Praktika está tras sesión y no se vio. Un bundle de terceros traía una credencial incrustada: no se anotó ni se usará.

## Decisiones de arquitectura

- **Cliente:** Vite + Svelte 5 + TypeScript en `web/` (ya compila). El actual `public/` sigue vivo hasta el relevo.
- **Animación:** CSS + Svelte (transiciones, FLIP) para todo; **Rive** para mascota y clientes (máquina de estados con triggers); View Transitions API entre pantallas. Se prueba el peso en un Android medio.
- **3D:** por pasos. (1) Imágenes y secuencias renderizadas en Blender (≤ 60 KB por pose). (2) Escena 2.5D por capas con parallax. (3) `model-viewer` con GLB ≤ 300 KB solo en tienda y capibara. Sin WebGL en la ruta inicial.
- **Sonido:** unos 10 efectos CC0/propios en AAC mono ≤ 120 KB, `AudioBuffer`, volumen bajo, interruptor para silenciar y archivo de créditos.
- **Servidor:** se conserva. Cambios nuevos (Fase 6) con migración para SQLite y PostgreSQL, y `pg_dump` de producción ANTES de tocar el esquema.

## Fases

| Fase | Contenido | Resultado verificable |
|---|---|---|
| **2. Identidad y sistema de diseño** | Tokens definitivos (color, tipografía, radios, sombras, curvas de movimiento), componentes base animados (botón 3D con sombra, tarjeta, chip, barra, modal), **botón de micrófono con medidor**, motor de sonido, página «Laboratorio» para verlo todo | Se ve y se prueba en navegador a 390 y 1280 px |
| **3. Activos 3D** | Capibara mesero con 8 poses (reposo, saludo, pensar, celebrar, triste, bandeja, tomar orden, reverencia), 5 clientes tipo, salones de 5 restaurantes, props (bandeja, comanda, platos, copas, cofre), cosméticos de la tienda, insignias | Archivos ligeros en `web/public/` y mascota con estados en Rive |
| **4. Arquitectura del cliente** | Router, estado, cliente de API, sesión/login, PWA, accesibilidad base, transiciones entre pantallas | Login y navegación funcionando contra el servidor local |
| **5. Pantallas por bloques** | a) Hoy + Yo · b) Repasar · c) **Mesas (Turno y Servicio libre)** · d) Biblioteca · e) Tienda, logros, ranking opcional · f) Administración y menú propio | Cada bloque: tests en verde + capturas a 360/390/768/1280 |
| **6. Servidor del sistema nuevo** | Tarjeta única de frase y repetición espaciada (3 exposiciones el mismo día; 1-3-7-14-30; error = +4 h; Cadena con retroceso parcial; modo Hardcore opcional); Mesas ramificadas con ticket en vivo; menú propio por formulario/CSV; propinas con curva y tope; jornada con calidad; topes de coste por alumno | Tests nuevos + migración probada en SQLite y PostgreSQL de prueba |
| **7. Calidad y salida** | Rendimiento, accesibilidad, contraste, uso sin conexión, iPhone y Android reales, términos y privacidad, registro por correo, preparación de planes y cobro (sin activar) | Lista de revisión firmada por el dueño |

Orden real de trabajo: 2 → 4 → 5a (Hoy) → 6 (motor de tarjetas) → 5b/5c… las fases 3 y 6 corren en paralelo con la 5 según lo que cada pantalla necesite.

## Animaciones (en TODOS los botones y pantallas)

- Botón: baja 4 px al pulsar, sube al soltar, brillo al pasar el cursor, rebote de confirmación.
- Entrada de tarjetas escalonada (deslizan y aparecen); salida con desvanecido y desplazamiento.
- Transición entre pantallas con View Transitions (el elemento «vuela» de la lista al detalle).
- Contadores que suben; las monedas y el XP vuelan hasta el contador al ganarlos.
- Confeti y destello en hitos; llama de racha viva; orbe del micrófono que respira y reacciona a la voz.
- Todo con `prefers-reduced-motion`.

## Aprendizaje y retención (resumen)

Una sola tarjeta por frase; Hoy = 4 pasos de ≈ 18 min; Turno (3-5 mesas) valida la racha; Servicio libre infinito; Mesa del día; Quests y temporadas mensuales; colección y restaurantes desbloqueables; reseñas de clientes; Cadena de frases con salvavidas. Sin vidas que bloqueen y sin culpa en las notificaciones.

## Venta (preparación, sin cobrar)

Plan gratis limitado + Premium; plan de restaurante con menú propio y panel. Se prepara el diseño de los planes y los topes de coste; la pasarela de pago y las IA de pago se activan cuando haya presupuesto.

## Riesgos

- Alcance enorme: se avanza en rebanadas verticales siempre funcionando; la app actual no se apaga hasta el relevo.
- Rendimiento en Android medio (animación y Rive): se mide en cada bloque.
- Contenido de Mesas y de frases requiere revisión por una persona nativa antes de vender.
- Licencias: solo sonidos y assets CC0 o propios; créditos documentados.
