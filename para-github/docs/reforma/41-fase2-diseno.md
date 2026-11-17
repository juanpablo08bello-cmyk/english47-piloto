# Fase 2 - Diseno: economia, tienda, menu inteligente y "Expresarse" (16/11/2026, Opus)

## 1. Economia (simulada con las reglas reales)
Ingreso actual: 20 monedas/dia de meta + 50 cada 7 dias + $2 por estrella (max 4 sin pronunciacion, 5 con) + Servicio libre con curva y tope 60/dia.

| Perfil | Dias/sem | Monedas/dia | Monedas/sem |
|---|---|---|---|
| Casual (1 Turno de 3 mesas, 2,5 estrellas) | 4 | ~35 | ~170 |
| Constante (Turno de 4, 3,2 estrellas, 2 libres) | 6 | ~57 | ~385 |
| Intenso (Turno de 5, 3,8 estrellas, 6 libres) | 7 | ~82 | ~625 |

Primer catalogo propuesto (21.500 monedas) = 56 semanas al jugador constante: **demasiado**. Ajuste:
- **Meta:** primera prenda el dia 1-2; primer animal a la semana (constante); catalogo comprable completo en ~6-7 meses (constante), ~4 (intenso). El casual no lo completa, y esta bien.
- **No se tocan** las reglas de ingreso (estan probadas y la racha depende de ellas). Solo precios.
- **Sin cajas al azar.** El "cofre del dia" es la entrega animada de las monedas ya ganadas (premio conocido, sin azar).
- **La moneda se explica** en la app (tarjeta "Como ganar propinas") la primera vez que se abre la tienda.

## 2. Catalogo (Plan A: Flow 2D en capas con anclajes)
| Grupo | Cantidad | Precio | Total |
|---|---|---|---|
| Animales | 10 (capibara gratis + gato, perro, conejo, zorro, panda, mono, flamenco, leon, tigre) | 300-550 | ~3.950 |
| Comunes | 28 | 60 | 1.680 |
| Raras | 24 | 120 | 2.880 |
| Epicas | 12 | 250 | 3.000 |
| Legendarias | 6 | **no se compran**: se ganan por logro | - |
| Tintes (opcional) | 3 colores por chaleco | 40 | sumidero para intensos |

Total comprable ~11.500 -> constante ~30 semanas, intenso ~18, casual ~68.

Ranuras (6): gorro 16, chaleco/atuendo 16, lentes 10, cuello 10, **en la mano** 10 (bandeja, libreta, copa, coctelera...), **fondo** 8 (salas de Flow: brunch, rooftop, hotel, steakhouse, cafe...). = 70 prendas.
Legendarias por logro: racha 30 dias, top 3 del Ranking semanal, nivel 10 de Mesas, 100 mesas de 4+ estrellas, diccionario completo, un set completo.
**Sets** tematicos (Miami Beach, Chef, Gala, Brunch...): equipar el set completo da insignia en el perfil.

Arte: un PNG/WebP transparente por prenda, alineado a la silueta comun (mismos anclajes para los 10 animales). Animales: misma pose y encuadre. Animaciones CSS: respirar, parpadear, brinco al comprar, destello al equipar. 3D solo para cofre, trofeo e icono.

## 3. Menu inteligente (foto / PDF / link / QR)
Flujo: entrada -> extraccion -> revision -> practica.
- **Entrada (cliente):** foto (camara o galeria), PDF, link, o QR (se lee en el telefono con `BarcodeDetector` y se convierte en link).
- **Servidor `POST /api/mesas/menu/importar`:**
  - Foto/PDF: se envia a Claude (vision, Sonnet) con esquema JSON estricto: seccion, nombre, descripcion, precio, alergenos (solo si estan escritos).
  - Link: se descarga en el servidor con proteccion SSRF (solo http/https, sin IPs privadas, limite de tamano y tiempo); si es HTML se extrae texto; si es PDF o imagen, va a vision.
  - El resultado **pasa por `validarPlatos` existente** y vuelve como borrador; no se guarda nada hasta que el mesero confirma en `MenuEditor`.
- **Limites:** 3 importaciones por dia por cuenta; archivo maximo 10 MB; la foto no se guarda, solo el menu resultante.
- **Costo:** se mide en el piloto con 3 menus reales; si la clave de IA no esta configurada, la funcion se oculta (el CSV y el editor manual siguen).
- **Practica con su menu:** el vocabulario de sus platos entra al repaso; las Mesas ya usan el menu propio.
- Pruebas: extraccion simulada (sin IA real), SSRF, limites, y validacion.

## 4. "Expresarse" (el hilo del contenido)
El mesero no solo responde: conversa. Cada palabra del diccionario lleva **tema** y **nivel** (1-4); las mismas palabras alimentan frases del dia, repaso espaciado, unidades y Mesas.

Tramos nuevos de "Expresarse": charla breve con la mesa (de donde son, el clima, Miami), recomendar con razones, describir un plato (sabor, textura, coccion), vender un extra sin presionar, resolver quejas, explicar demoras, despedirse.

Metas de contenido:
| Area | Hoy | Meta |
|---|---|---|
| Diccionario | 636 | ~2.400 (restaurante ~1.000 + cotidiano ~1.000 + expresarse ~400) |
| Mesas | 4 niveles / 40 escenas / 5 clientes | 10 niveles / ~110 escenas / 8 clientes |
| Unidades | 8 / 48 microlecciones | 16 / ~120 |
| Conversacion | 8 packs x 5 frases | ~24 packs x 5 (mismas frases repetidas a diario, como piden los probadores) |
| Tienda | 8 animales + 40 prendas | 10 animales + 70 prendas + tintes |
