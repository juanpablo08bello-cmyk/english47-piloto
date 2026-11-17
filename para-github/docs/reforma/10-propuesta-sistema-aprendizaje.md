# Propuesta: sistema de aprendizaje coherente de ENGLISH47 2.0

Síntesis de la Fase 1 (16/11/2026). Base: `00-auditoria-sistema-actual.md` e `investigacion/01…09`. Es una PROPUESTA: nada de esto está implementado. Los datos de costes y de otras apps vienen de los informes de los agentes y se marcan allí como evidencia o inferencia.

## 1. Diagnóstico en una frase

Hoy son dos productos pegados (menú nuevo + sistema antiguo escondido), con cuatro catálogos que no se hablan entre sí y un bucle diario sin repetición espaciada: el alumno ve frases nuevas cada día en vez de repetir las mismas, que es justo lo que piden los probadores y lo que hacen Babbel, Memrise y Duolingo.

## 2. Principio rector

**Una sola unidad de aprendizaje: la «frase de servicio»** (tarjeta con inglés, español, audio, nivel, tema, errores típicos). Todo lo demás son MODOS de practicar esas mismas tarjetas:

| Modo | Qué practica | Qué evalúa |
|---|---|---|
| Escuchar y repetir | oír → decir la frase | Azure (voz) |
| Completar / armar | reconocer y construir | el servidor (reglas) |
| Mesa | usar la frase en una conversación | voz + frase + objetivo de servicio |

Cada resultado actualiza la MISMA tarjeta en la repetición espaciada. Lo que falla en una Mesa vuelve en el repaso de mañana. Hoy esa conexión no existe (auditoría 3.3).

## 3. Estructura de la app (5 destinos)

1. **Hoy.** Un botón: «Empezar mi práctica». Muestra el plan del día y el progreso real.
2. **Repasar.** Las frases de hoy + vencidas. Aquí viven Aprender, Escuchar y el repaso.
3. **Mesas.** El núcleo. Absorbe Pronunciar (como «mesa rápida» de un turno).
4. **Biblioteca.** Diccionario VIP (buscador, verbos en 5 formas), catálogo de frases, «Mis errores» y mini-lecciones de gramática.
5. **Yo.** Perfil, tienda, logros, ranking opcional, ajustes, plan y facturación.

## 4. Qué se fusiona, recorta o expande

| Hoy | Propuesta | Por qué |
|---|---|---|
| Aprender (tandas de 4 frases nuevas) | Pasa a «Repasar»: frases del día fijas + 3-5 nuevas | Hoy solo reconoce, no produce, y no envía aciertos al servidor |
| Temas (juegos) + Diccionario VIP | Una sola «Biblioteca»; los juegos pasan a ser ejercicios de calentamiento | Mismo catálogo de 704 filas, dos pantallas |
| Pronunciar + Escuchar | Modos de Repasar («Escuchar y repetir») y de Mesas («mesa rápida») | Ya comparten motor y corrector |
| Voice Lab | Se convierte en «Probar mi micrófono» del onboarding y de Ajustes | No necesita ser sección |
| Mesas clásicas (16 escenarios, motor `sim/engine.js`) | Retirar de la interfaz; rescatar sus escenarios al nuevo formato de Mesas | Dos motores de simulación distintos |
| Ruta de 48 lecciones | Conservar el contenido de gramática como «mini-lecciones» que se ofrecen según tus errores frecuentes; sin mapa propio | Es el único sitio con gramática explícita |
| Diagnóstico de 15 preguntas | Reemplazar por una primera Mesa guiada de 2 minutos que ubica el nivel | Hoy se salta y es inalcanzable |
| Palabras/Repaso (636 expresiones) | Migrar sus entradas a las tarjetas únicas | Evita 4 catálogos |
| Ranking | Opcional y por constancia y calidad, no por propinas | Hoy premia cantidad y es manipulable |
| Tienda | Se queda; propinas con tope diario | Es retención barata; hoy no tiene tope |
| **Mesas (expandir)** | Menú configurable por restaurante, ramificación (2-3 salidas según lo dicho), dificultad por desempeño, resumen con transcripción y 1-3 frases «para repasar», escenarios en datos con revisión nativa | Es lo que diferencia el producto |

Lo que NO se borra del servidor todavía: las rutas antiguas se mantienen hasta que el cliente nuevo esté completo y probado. Se retira de la interfaz, no de la base.

## 5. El bucle diario (≈ 18 min)

1. **Calentamiento, 4 min.** «Tus frases de hoy»: 5 frases FIJAS. Se oyen, se dicen, se evalúan.
2. **Nuevas, 4 min.** 3-5 frases nuevas, ahora con producción en voz alta (no solo tocar).
3. **Mesa, 8 min.** 1-2 mesas. El cliente ya no es solo guion fijo: ramificación.
4. **Cierre, 2 min.** Repetir las 2 frases más flojas de la mesa. Entran al mazo.

**Jornada válida con calidad:** frases dichas en voz alta con evaluación (no «Me salió bien»), una mesa completa con media mínima, y el repaso vencido terminado. Sin recompensas por intentos de 0 estrellas.

### Repetición de las mismas frases (lo que piden los probadores)

Calendario provisional, inspirado en Memrise y Babbel (ambos [EVIDENCIA] en el informe 07):
- Mismo día: 3 exposiciones (ahora, +4 h, +12 h).
- Después: 1, 3, 7, 14 y 30 días.
- Error: vuelve a +4 h (Babbel lo manda a mañana; Memrise a 4 h).
- Una frase sale del pack del día tras 2 aciertos de ≥ 4 estrellas.
- Botón «repetir las de hoy» que no consume intervalos.
- Tope de nuevas al día (3-5) para no desbordar el repaso (Anki: 20 nuevas ≈ 200 repasos diarios [EVIDENCIA, frase del manual]).
Es una HIPÓTESIS a validar con los alumnos; los intervalos son configurables en el servidor.

## 6. Micrófono y voz (prioridad pedida por el dueño)

Basado en el informe 08 y en lo observado de ELSA, Praktika y Speak:
- Botón grande (80-88 px). Toca para empezar, toca para terminar (Speak lo justifica: los aprendices pausan mucho).
- Pantalla previa que explica el permiso antes del aviso del sistema.
- Medidor real: `AnalyserNode` → nivel en una variable CSS que mueve un orbe y 5 barras; estados: reposo, pidiendo permiso, escuchando, procesando, resultado, error con salida (modo texto de verdad, que hoy no existe).
- Resultado por palabra con semáforo (patrón ELSA y Praktika), «Mejor así», escuchar al nativo y escucharte, «Try again».
- Selector de tono del cliente (suave, equilibrado, estricto) y velocidad del cliente: ideas de Praktika.
- Formatos: webm/opus → mp4 → respaldo WAV existente.
- Pendiente de probar en un iPhone real: permiso del micrófono en la PWA instalada y el interruptor de silencio (solo hay fuentes secundarias).

## 7. IA y costes (a validar con A/B antes de adoptar)

Según el informe 09 (cifras del agente, aún sin verificar por mí):
- Coste actual aprox. 13,4 USD por alumno activo al mes si todo usa Opus 5.5.
- Configuración recomendada ≈ 4,6 USD (Sonnet 5.5 evalúa, Haiku 5.5 hace de cliente solo si pasa la prueba, caché de prompts).
- Mantener Azure (pronunciación), transcripción actual y voz realtime-mini. Descartar DeepL, Google, LanguageTool público y ElevenLabs por ahora.
- La voz de extremo a extremo premium (≈ 25 USD) no es viable a este precio.

## 8. Producto público: lo que falta construir

Auditoría sección 6 más precios de referencia (informes 01-07):
- Registro por correo, términos y privacidad visibles, borrado de cuenta.
- Pagos y planes (gratis limitado + premium). Referencia anual: Memrise 61,99 USD, Busuu 72,99, Speak 83,99, Babbel 107,40 [EVIDENCIA, precios EE. UU.]. Con ≈ 4,6 USD de coste mensual, 8-10 USD al mes deja margen.
- Topes de coste por alumno, no globales.
- Posible plan para restaurantes (Speak tiene uno B2B; la administración ya existe). Idea, no decisión.
- Revisión del contenido por una persona nativa.

## 9. Dirección visual (se decide con prototipo en la Fase 2)

Dos candidatos medidos en los informes:
- **A. Oscuro premium** (referencia Linear/ELSA/Praktika): fondo ≈ `#08090a`, un acento, borde de luz de 1 px, Inter Variable, animaciones de 120-500 ms.
- **B. Claro lúdico evolucionado** (referencia Duolingo): botón 3D con sombra dura, tarjetas con borde inferior, modo oscuro propio.
Recomendación inicial: **A como base con toques lúdicos del capibara**, con modo claro. Se confirma viendo el prototipo.

## 10. Riesgos y límites de esta investigación

- Ninguna app de referencia es accesible sin cuenta: la UI interna (lección, micrófono, sonidos) es inferida de páginas públicas, bundles y fuentes de terceros.
- Los intervalos y el bucle son hipótesis; hay que medirlos con los alumnos.
- REA no se pudo usar con éxito (no había conexión de depuración del navegador). El diseño se midió con el navegador integrado.
- Las cifras de costes y precios son del informe 09 y de los informes 05-07; hay que revisarlas antes de fijar un precio.
