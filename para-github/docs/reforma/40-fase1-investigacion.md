# Fase 1 - Investigacion acotada (16/11/2026)

Fuentes: busquedas web (3). Sin REA ni Crawl4AI: no hacian falta, para ahorrar tokens. Cifras de terceros = orientativas.

## Economia (Duolingo, Finch)
- Duolingo: gemas por cofres e hitos; se gastan en protector de racha (recarga 400 gemas), vidas y avatar. Critica: la tienda ofrece poca eleccion real, gastar no tiene peso estrategico. Leccion: **dar al gasto sentido** (sets, rarezas, metas visibles), no solo protectores.
- Finch: moneda por metas + **caja diaria gratis** + tinte de colores; la mascota crece. Leccion: caja/regalo diario, personalizacion de color, progreso visible de la mascota. Critica: no explica la moneda; **explicarla en la app**.
- Racha: protector maximo 2 (ya lo tenemos); el miedo a perder racha motiva, pero cuidar no castigar de mas.

## Menu por foto/PDF/link/QR
- Claude acepta PDF e imagenes directo en la API (limites de terceros: 32 MB, 100 paginas; verificar en docs oficiales al construir).
- Patron: prompt con esquema JSON estricto (nombre, descripcion, precio, categoria, alergenos) + revision humana.
- **Ya existe en el servidor**: `server/menus.js` con validacion, alergenos, `csvAPlatos` y `/api/mesas/menu`. La extraccion por IA solo debe producir platos que pasen por `validarPlatos`. Sin proveedor Anthropic de texto/vision aun: hay que agregarlo (hoy solo voz).
- Riesgos: fotos borrosas, menus mixtos ES/EN, links con JavaScript (leer con Crawl4AI/render en servidor), SSRF al leer links (bloquear IPs internas), costo por menu (medir en piloto).

## Decisiones para Fase 2 (recomiendo Opus)
1. Precios y rarezas con simulacion (ingreso real: 20/dia + 50/semana + propinas hasta $10/mesa).
2. Caja diaria gratis y tinte de color como extras de tienda.
3. Arquitectura de menu: proveedor de vision, limites por usuario, almacenamiento minimo de la foto.
