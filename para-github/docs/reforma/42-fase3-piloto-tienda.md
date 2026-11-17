# Fase 3 - Piloto de tienda en capas (16/11/2026)

Resultado: **aprobado el metodo**. Una prenda comprada sirve a todos los animales.

## Metodo que funciona
1. **Animal base**: de frente, simetrico, sin ropa, brazos colgando a los lados, fondo gris liso (`art/flow/_nuevas/base_capi.jpg`). Los 10 animales deben compartir el mismo torso y pose (solo cambian cabeza, orejas, pelaje y color) para que las prendas encajen en todos.
2. **Prendas que envuelven el cuerpo (chalecos, atuendos)**: en Flow, editar la imagen base: "dress this exact same capybara in X... both arms hanging at its sides ... keep identical pose, size, position, face, fur and background. Change nothing else". Luego `art/flow/extraer_prenda.py base editada salida.png` deja solo la prenda (moldeada al cuerpo, brazos por delante). Probado sobre otro animal: encaja.
   - Error a evitar: NO pedir "brazos por delante": la capibara junta las manos y cambia la pose.
   - Una sola prenda por edicion (o 2 en paneles lado a lado, por probar).
3. **Gorros, lentes, cuellos, objetos de mano**: hojas de 4 disenos en cuadricula con huecos, **fondo verde plano** (el blanco sobre gris no recorta), `art/flow/cortar_hoja.py`. El anclaje se define por animal en una tabla (x, y, escala), con los gorros entre las orejas.
4. **Fondos**: salas de Flow (ya hay 5 en `art/flow/`).

## Pose (decision final del usuario, 16/11)
Se queda **brazos a los lados** (la de manitas en la pancita se descarto). Los 10 animales usan esa misma pose. Ranura "objeto en la mano" = prop al costado.

## Lo que NO funciona
- Pegar un chaleco plano de hoja sobre el cuerpo: parece calcomania (descartado).
- Gorro blanco sobre fondo gris (huecos al recortar).

## Pendiente del lote (bloque B)
- 9 animales base mas (mismo torso/pose), ~36 prendas de cuerpo por edicion, ~80 piezas por hojas, 3 fondos mas.
- Tabla de anclajes por animal y componente de capas en `web/src/lib/ui/yo/` (hoy `ItemArt.svelte` + `cosmeticArt.ts` SVG).
- Catalogo por lineas (Mesero Clasico, Tranqui, Playa, Miami Beach, Vice City, Lujo/Gala, Chef, Noche) y niveles (Basico, Pro, Elite, Legendario por logro); animales lo mas caro (600-1.800), prendas 40-400.
- El proyecto de Flow es "nov 16 - 13:52" (id 8d5a1859-da6e-4d8c-b126-13eb27c44600). Las URL de imagen de Flow caducan: descargar al momento.

## Estado del lote en Flow (16/11/2026, fin del bloque A)
Material en `art/flow/_nuevas/` (animales/, hojas/, cuerpo/, capas/, descartes/). Catalogo y precios provisionales en `art/flow/catalogo_tienda.json`.
- **Animales base (10, mismo torso y pose)**: HECHOS en `animales/*.jpg` (capibara, gato, perro, conejo, zorro, panda, mono, flamenco, leon, tigre). Leon y tigre traen sombra en el suelo: quitarla al recortar.
- **Hojas de 4 con fondo verde**: HECHAS y recortadas (`capas/`): gorros chef/gala/playa/vicecity/tranqui, lentes clasico(+gala mezcla)/playa, cuellos x4 lineas, props x3 lineas. **Faltan**: gorros Mesero Clasico, lentes Vice City.
- **Prendas de cuerpo (por edicion + extraer_prenda.py)**: 9 de 33 listas en `capas/`: mc_chaleco_verde, mc_chaleco_marino, mc_esmoquin, pl_hawaiana_flores, pl_lino_blanco, pl_salvavidas, pl_tank_neon, tq_polo_verde, tq_camisa_cuadros. Encajan bien sobre otros animales (probado con el panda). **Faltan 24**: mc_chaleco_vino (la edicion cayo sobre el leon: repetir sobre la base), tq_camiseta_blanca, tq_hoodie_gris, tq_delantal_cafe, pl_hawaiana_dorada, mb_*, vc_*, lj_*, ch_*, nc_*.
- **Fondos**: 5 salas existentes; faltan sala_playa, sala_neon_vicecity, sala_gala.

## Trucos de Flow (para no repetir errores)
- El boton de enviar en la vista de edicion a veces no registra el clic tras escribir: pulsar enviar **dos veces** y esperar >= 18 s antes de la siguiente edicion.
- Tras "scroll arriba + clic en la primera tarjeta" a veces se selecciona otra version (el leon): **comprobar con captura** que la tarjeta elegida es la base sin ropa antes de pedir una prenda.
- Asociar imagen y prompt leyendo el texto de la tarjeta del DOM falla (se cruzan). Mejor: tras cada edicion leer la URL de la imagen grande principal, o bajar todas y **nombrar mirando el contacto**.
- Adjuntar con "+" a la peticion toma la ULTIMA version del recurso, no la base.
- Las URL de imagen caducan en ~6 h: bajar de inmediato con curl.
- Maximo 25 acciones por `browser_batch`.
- Fondo verde plano en hojas = recorte limpio; fondo gris no sirve para piezas blancas.
