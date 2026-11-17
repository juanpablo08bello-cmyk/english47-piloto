// Reseña del cliente al cerrar un Turno: plantillas en inglés por resultado, con su traducción.
// Sin IA y sin azar escondido: la misma noche siempre da la misma reseña (la variante sale del id del Turno).
const L = (en, es) => ({ en, es });

const POR_ESTRELLAS = {
  5: [
    L('Amazing service! Clear, friendly and fast. We will be back!', '¡Servicio increíble! Claro, amable y rápido. ¡Volveremos!'),
    L('Best night out in a long time. Our server was great!', 'La mejor salida en mucho tiempo. ¡Nuestro mesero fue genial!'),
    L('Perfect from start to finish. Thank you so much!', 'Perfecto de principio a fin. ¡Muchas gracias!'),
  ],
  4: [
    L('Very good service. A little more practice and it will be perfect.', 'Muy buen servicio. Con un poco más de práctica será perfecto.'),
    L('Friendly service and a nice night. We enjoyed it.', 'Servicio amable y buena noche. Lo disfrutamos.'),
    L('Good night. Our server was kind and easy to understand.', 'Buena noche. Nuestro mesero fue amable y fácil de entender.'),
  ],
  3: [
    L('Good effort. We understood most things. Please keep going!', 'Buen esfuerzo. Entendimos casi todo. ¡Sigue así!'),
    L('Nice server, but we had to repeat a few things.', 'Mesero amable, pero tuvimos que repetir algunas cosas.'),
    L('Okay service. Friendly, but we had trouble understanding a few things.', 'Servicio regular. Amable, pero nos costó entender algunas cosas.'),
  ],
  2: [
    L('Our server was very kind, but it was hard to communicate at times.', 'Nuestro mesero fue muy amable, pero a veces costó comunicarnos.'),
    L('It was hard to understand some things. Please speak slowly.', 'Costó entender algunas cosas. Habla despacio, por favor.'),
    L('Kind server, but a few things were missing from our order.', 'Mesero amable, pero faltaron algunas cosas en el pedido.'),
  ],
  1: [
    L('We could not understand much tonight. Please practice more.', 'Esta noche no entendimos mucho. Practica un poco más.'),
    L('A tough night for everybody. Maybe next time!', 'Una noche difícil para todos. ¡Quizás la próxima vez!'),
  ],
};
const SIN_NOTA = [L('Friendly service. Thank you!', 'Servicio amable. ¡Gracias!')];

const plural = (n, uno, varios) => (n === 1 ? uno : varios);

/**
 * @param avg       estrellas medias de las mesas calificadas (null si solo hubo autoevaluación)
 * @param perfects  mesas perfectas (5 estrellas en todos los turnos)
 * @param total     mesas del Turno
 * @param seed      id del Turno: elige la variante de forma estable
 */
export function resenaDeTurno({ avg, perfects = 0, total, local, autor, seed = 0 }) {
  const stars = avg === null ? 3 : avg >= 4.5 ? 5 : avg >= 3.5 ? 4 : avg >= 2.5 ? 3 : avg >= 1.5 ? 2 : 1;
  const options = avg === null ? SIN_NOTA : POR_ESTRELLAS[stars];
  const base = options[Math.abs(seed) % options.length];
  // Una frase extra si hubo mesas perfectas: hace que la reseña cuente lo que pasó esa noche.
  const extra = avg === null || perfects <= 0 ? null
    : perfects >= total ? L('Not a single mistake all night.', 'Ni un solo error en toda la noche.')
      : L(`${perfects} ${plural(perfects, 'table was', 'tables were')} perfect.`, `${perfects} ${plural(perfects, 'mesa fue perfecta', 'mesas fueron perfectas')}.`);
  return { estrellas: stars, en: extra ? `${base.en} ${extra.en}` : base.en, es: extra ? `${base.es} ${extra.es}` : base.es, autor, local };
}
