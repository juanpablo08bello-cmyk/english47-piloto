# Plan de salida al público — ENGLISH47

Resumen ejecutivo que junta los tres informes (`01-infraestructura-costes-y-precios.md`, `02-mercado-adquisicion-y-lanzamiento.md`, `03-preparacion-para-publicar.md`). Las cifras vienen de esos informes y de agentes de investigación; **las marcadas [INFERENCIA] no están verificadas** y los precios cambian: confírmalos en las páginas oficiales antes de decidir. Fecha: 16/11/2026.

## 1. Dónde estamos (honesto)
- **Producto:** cliente nuevo completo (acceso, Hoy, Repasar, Mesas, Biblioteca, Yo, tienda, menú propio, administración) y servidor de Mesas 2.0 (Turno, Servicio libre, 5 restaurantes, comanda, menú propio). Falta lo 3D (Capi real y 17 prendas).
- **Preparación según la auditoría:** ≈ **35 % para cobrar**, ≈ **70 % para una beta cerrada gratuita** de 10-30 personas.
- **Lo que impide cobrar hoy:** no hay términos ni privacidad ni borrado de cuenta; no hay registro por correo, recuperación de contraseña, planes ni cobro; tope fijo de 7 alumnos en `server/auth.js`; capacidad limitada (cada petición ocupa una de 5 conexiones mientras espera a la IA); el límite de intentos de login se puede abusar; contenido sin revisión de un nativo; iPhone sin probar; la app nueva no se puede instalar (falta manifiesto e iconos).

## 2. Etapas
**Etapa 1 — Beta cerrada (0 USD, 8-15 jornadas de trabajo).** 10 a 30 personas por invitación (tus 7 actuales + meseros que conozcas).
Hay que hacer antes: términos y privacidad básicos, borrado de cuenta, subir el tope de alumnos, límite general de peticiones y por alumno en voz/IA, hacer instalable la app, probar el micrófono en iPhone y Android reales, copia de seguridad de PostgreSQL, y aplicar la migración del menú propio (con `pg_dump` antes).
Meta: que 10 personas la usen 3 días seguidos y decir qué se rompe.

**Etapa 2 — Beta abierta con cobro.** Registro por correo y recuperación de contraseña, Stripe (o la pasarela que corresponda según tu país), planes, prueba de 7 días, panel de restaurante.
Meta: primeros 5 suscriptores y 1-2 restaurantes en piloto.

**Etapa 3 — Lanzamiento.** Solo cuando haya retención medida (volver el día 7) y el coste por alumno esté controlado. No antes.

## 3. Costes (verificar antes de decidir)
| Ruta | Coste fijo | Para qué sirve |
|---|---|---|
| A | 0 USD | Render gratis + Supabase gratis + Azure gratis. Azure aguanta ≈ 6 alumnos activos. Solo para beta cerrada. |
| B | ≈ 8-14 USD/mes | Primeros suscriptores. |
| C | ≈ 45-90 USD/mes | Lanzamiento en serio. |
- **Tus suscripciones:** Claude Max y Gemini AI Pro son de chat y **no incluyen API** para una app. Usar tu acceso de Max como motor de terceros está prohibido por sus condiciones. Hay un crédito mensual si vinculas una organización de la consola (no queda claro que sirva para clientes de pago). **No hay que suscribirse a nada nuevo para la Etapa 1.**
- **Coste de IA por alumno activo:** ≈ 4-5 USD/mes con la configuración recomendada [INFERENCIA; no medido]. El coste de los usuarios gratis pesa más de lo que parece: limitarlos.
- **Cobro:** Stripe directo (lo más simple). **Depende de tu país**: Stripe en América Latina solo cubre Brasil y México; si resides en otro país hace falta otra vía (Paddle como intermediario o una LLC en EE. UU.). Lanzar como PWA, sin pasar por las tiendas de apps (evita 15-30 % de comisión).

## 4. Planes propuestos
- **Gratis:** Aprender, 1 Mesa a la semana y 5 frases al día.
- **Premium:** 9,99 USD/mes o 59,99 USD/año, prueba de 7 días. (Referencia anual: Memrise 61,99; Busuu 72,99; Speak 83,99; ELSA ≈ 90-100; Babbel 107,40.)
- **Restaurante:** 8 USD por asiento al mes, mínimo 5 asientos, con el menú propio y panel.
- Margen bruto ≈ 66 %; equilibrio: 1 suscriptor en la ruta A, 5 en la B, 21 en la C [INFERENCIA].

## 5. Cómo conseguir clientes
**Mercado:** ≈ 2,28 millones de meseros en EE. UU. (BLS); ≈ 18 % habla español en casa (lectura incierta); estimación de 19-25 mil meseros en Miami-Dade [INFERENCIA].
**Las 5 palancas gratis, en orden de importancia:**
1. **Pilotos de "menú propio" en restaurantes de Miami Beach:** visitar 10 restaurantes, ofrecer un piloto gratis de 30 días a 5 meseros cada uno con SU carta. Es tu diferenciador y el camino al plan Restaurante.
2. **Videos cortos en español con el capibara** (TikTok, Reels, Shorts): frases de servicio de 20 segundos, "reto de la mesa".
3. **WhatsApp + "Mesa del día" compartible:** el resultado se comparte en el grupo del equipo.
4. **Demo sin registro + búsquedas de cola larga** ("inglés para meseros", "frases en inglés para mesero").
5. **Alianzas** con docentes de inglés para adultos (bibliotecas, Miami Dade College), asociaciones del sector (FRLA Miami-Dade, ROC, HEAT).
**Dónde NO publicar:** Product Hunt, Hacker News y directorios de IA: su audiencia es tecnológica, no de meseros. BetaList y esos directorios además son de pago.
**Dificultad honesta:** con ≈ 10 h/semana y 0 USD, a 90 días se esperan 300-900 registros, 5-25 pagadores y 1-2 restaurantes de pago, unos 50-250 USD/mes [INFERENCIA]. La publicidad de pago no se recupera (80-240 USD por pagador frente a ≈ 40 USD al año). Lo difícil no es el producto: es la **confianza** de personas con poco tiempo y desconfianza a pagar por apps. Por eso el boca a boca dentro del restaurante y el piloto por equipo importan más que cualquier anuncio.

## 6. Calendario sugerido
- **Semanas 1-2:** cerrar la beta cerrada (lista de la Etapa 1), probar en iPhone y Android reales, grabar 5 videos con Capi.
- **Semanas 3-4:** invitar a 20-30 meseros conocidos; visitar 5 restaurantes con el piloto de menú propio; medir quién vuelve el día 3 y el día 7.
- **Mes 2:** arreglar lo que falle, abrir registro, activar el cobro con 5-10 personas, publicar 3 videos por semana.
- **Mes 3:** decidir por datos: ¿retención del día 7 sobre 25 %? ¿alguien pagó sin que se lo pidieras? Si sí, subir a la ruta B; si no, mejorar el producto antes de gastar.

## 7. Decisiones que necesito de ti
1. **País de residencia y si puedes abrir una LLC en EE. UU.** (decide la pasarela de cobro).
2. **Nombre y marca:** ¿"ENGLISH47" se queda? Verificar que no choque con otra marca y que el dominio esté libre.
3. **Beta cerrada:** ¿a quiénes invitas primero y cuántos restaurantes puedes visitar tú?
4. **Quién revisa el inglés** de las cartas y las mesas (un nativo o alguien con nivel alto) antes de cobrar.

## 8. Riesgos que no se pueden ignorar
- **Privacidad de la voz:** nunca se guardan grabaciones; hay que decirlo claro en la política y cumplir con borrado de cuenta.
- **Costes de IA fuera de control:** poner topes por alumno antes de abrir.
- **Dependencia de proveedores gratuitos** (cuotas y cambios de condiciones).
- **Revisión legal:** términos, privacidad y condiciones de cobro conviene que las vea un abogado.
