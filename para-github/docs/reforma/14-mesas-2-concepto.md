# Mesas 2.0 — «El Turno»

Concepto de diseño (16/11/2026). Propuesta, no implementado. Objetivo: que Mesas sea la razón por la que la gente paga y vuelve. Todo se construye SIN costes de IA de pago: el «cerebro» del cliente es un motor de reglas con ramificación y, cuando haya presupuesto, se enchufa Claude en el mismo punto.

## Idea central

Hoy una mesa es un guion con forma de diálogo: el cliente no escucha lo que dices (auditoría 4.3). En 2.0 **el cliente reacciona**, **ves tu pedido formarse en un ticket mientras hablas** y cada noche es un **Turno** con varias mesas, eventos y una reseña final.

## Los 6 sistemas

1. **Escena viva.** Salón de restaurante de Miami Beach en capas 2.5D renderizadas desde Blender (parallax suave, luces, clientes con 5 poses: llega, habla, piensa, contento, molesto). Tu capibara viste lo que compraste en la tienda. Sin WebGL pesado en la ruta inicial.
2. **Cliente que escucha.** Cada turno tiene 2-3 salidas según lo dicho (pidió bien, cambió algo, no entendió, respondió fuera de tema). Medidor de ánimo del cliente visible (no castiga con «vidas»: baja la reseña, no bloquea).
3. **Ticket en vivo.** Cada dato (plato, punto de cocción, alergia, bebida) aparece en una comanda cuando lo dices bien. Ya existe `server/order.js` con el estado de la orden; se reutiliza. Confirmar la orden al final es un objetivo explícito.
4. **Turno completo.** 3-5 mesas por noche, con eventos: alergia, cambio de pedido, queja, cuenta dividida, cumpleaños, cliente apurado, turista con acento fuerte, VIP. Se atiende una a la vez por voz, pero la ESCENA muestra a las demás esperando: tensión sin presión punitiva.
5. **Reseña y propina.** Al cierre, reseña del cliente en inglés (plantillas por resultado), propina con curva y tope diario, y 1-3 frases flojas que pasan al mazo de repaso mañana.
6. **Progresión por restaurantes.** Se desbloquean locales: Café, Brunch, Steakhouse, Rooftop, Hotel de Ocean Drive. Cada uno con su menú, vocabulario y jefe de sala. Dificultad por desempeño (velocidad, acento, ruido, ayudas), no por cantidad de mesas.

## Dos modos (decisión del dueño, 16/11)

- **El Turno (cuenta para la racha):** 3-5 mesas por noche, con eventos, reseña final y progresión. Es la dosis diaria y es lo que valida la jornada.
- **Servicio libre (infinito):** mesas sin límite diario, una tras otra, para practicar todo lo que quieras. Elige restaurante, dificultad y tipo de cliente, o deja que sea aleatorio. Mesas generadas al vuelo desde las situaciones, personajes, ánimos y acentos. Da propinas con curva decreciente y tope diario (para que no se manipule el ranking), pero el aprendizaje no tiene tope: cada frase floja sigue entrando al repaso. No suma racha extra.

## Menú propio (el diferenciador de venta)

Cómo se hace en la práctica:
1. **Gratis, desde el inicio:** el gerente pega o escribe su carta en un formulario guiado (plato, categoría, descripción, alérgenos, precio opcional) o sube un CSV/hoja. Reglas propias lo convierten en la carta de las mesas. Las mesas se generan con ESOS platos: nombres reales, preguntas de punto de cocción, alérgenos, sustituciones.
2. **Cuando haya presupuesto:** subir una foto o PDF de la carta y que una IA la lea. No lo prometo gratis: depende de un modelo de visión; se evaluará con A/B y se revisará siempre antes de guardar.
3. **Equipos:** el menú se comparte con los meseros del mismo restaurante desde el panel de administración.
Riesgos: los nombres de platos en otro idioma o con jerga necesitan revisión; el vocabulario nuevo debe pasar por el mazo de repaso para que la pronunciación se practique.

## Ganchos de retención (honestos, sin trampas)

- **Mesa del día:** la misma mesa para todos, una vez al día, comparable con amigos o con el equipo. Resultado compartible.
- **Reseña variable y cofres de propina:** recompensa con algo de azar, pero la parte de aprendizaje no depende del azar.
- **Colección:** ropa, mascotas, restaurantes, insignias.
- **Racha + Cadena de frases** (ver plan v2): el miedo a perder la cadena trae de vuelta, con salvavidas para que no sea cruel.
- **Temporadas con tema:** Art Basel, Spring Break, Fin de Año.
- No usar: vidas que bloqueen, culpa en las notificaciones, nada que oculte el precio.

## Lo que lo hace vendible

- **Tu restaurante real:** el gerente carga su menú (a mano, o foto del menú cuando haya IA) y sus meseros practican con SU carta. Plan para equipos con panel de administración (la administración ya existe).
- **Resultados que se ven:** historial de reseñas, errores frecuentes y mejora semanal.

## Voz en Mesas

Botón grande tocar-para-hablar con orbe y barras que reaccionan al nivel real; transcripción visible; resultado por palabra con semáforo; «Try again» sin costo. Modo texto de verdad si falla el micrófono.

## Por fases (todo sin gasto)

1. Motor de ramificación + ticket en vivo sobre el contenido actual (40 situaciones, 45 personajes).
2. Escena 2.5D y personajes en Blender; sonidos.
3. Turno completo, reseñas, mesa del día.
4. Restaurantes, Servicio libre y menú propio (formulario y CSV).
5. Enchufe opcional del cerebro de IA para clientes (cuando haya presupuesto).

## Riesgos

- Escribir buenas ramificaciones lleva trabajo de contenido: se empieza con 10 escenas excelentes y se amplía.
- El contenido requiere revisión por una persona nativa antes de vender.
- 2.5D debe probarse en un Android de gama media (peso y fluidez).
