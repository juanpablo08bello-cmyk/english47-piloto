# Ceviches by Divino + contenido ampliado (16/11/2026)

## Contenido nuevo
| Área | Antes | Ahora |
|---|---|---|
| Diccionario (Temas) | 704 palabras / 20 tablas | ~3.100 palabras / 77 tablas en 3 grupos: Restaurante, Día a día, Expresarse; cada palabra con nivel 1-4 |
| Mesas | 40 escenas | 223 escenas (4 niveles) |
| Unidades | 8 / 48 microlecciones | 16 / 72 microlecciones (hilo «Expresarse» 9-16, con 8 simulaciones nuevas) |
| Conversación | 8 packs | 48 packs de 5 frases (con la frase del cliente en cada una) |

Archivos: `content/dic/{restaurante,cotidiano,expresarse}.js` (formato `en|cómo suena|español|nivel`), `content/conversacion-mas.js`, `content/units-expresarse.js`, `content/scenarios-expresarse.js`, `content/vocab/expresarse.js`.

## Cómo entra una carta a la app (formato)
1. **Fuente**: web, PDF, foto o QR. `server/menu-import.js` descarga el link con protección SSRF (solo http/https, sin IPs privadas, redirecciones revisadas, 10 MB, 10 s) o recibe el archivo.
2. **Lectura**: Claude (visión) devuelve JSON `{plato, categoria, descripcion, precio, alergenos}`. `POST /api/mesas/menu/importar`, máximo 3 por día y cuenta, solo con `ANTHROPIC_API_KEY`.
3. **Validación**: `validarPlatos` (las mismas reglas de «Mi carta»). Vuelve como BORRADOR; nada se guarda hasta confirmar.
4. **Local de Mesas**: `restauranteDesdeMenu` (carta del alumno) o `restauranteDivino` (carta fija con español).

### Divino
- `scripts/importar-divino.mjs` lee `art/menu-divino/menu.txt` (texto de su web) y genera `content/divino-platos.js` (80 platos reales con variantes y precios).
- `content/divino-es.js`: español de cada plato, glosario (18 palabras) y datos del local.
- `content/divino.js` → `DIVINO_MENU`; `server/menus.js` → `restauranteDivino()`; `GET /api/divino`; local `divino` siempre abierto en Mesas.
- Pantalla `#/divino` (carta con filtro, búsqueda, español, audio, glosario, panel «cómo entra una carta» con prueba del importador) y tarjeta en Mesas.
- Los alérgenos de Divino se DEDUCEN de los ingredientes escritos: el restaurante debe confirmarlos.

## Pendiente / recomendaciones
- Probar el importador con `ANTHROPIC_API_KEY` real (en pruebas se usa un extractor simulado) y medir el costo con 3 cartas.
- Repetir `scripts/importar-divino.mjs` cuando cambie la carta del restaurante.
- Idea: QR propio de Divino en el local que abra `#/divino` para que sus meseros practiquen su carta.
