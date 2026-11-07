// Temporada: el juego solo cuenta lo ganado desde su inicio. Racha, XP, monedas, propinas, mesas y dificultad,
// frases vistas, logros y compras arrancan en cero. Las filas anteriores no se borran.
// Se quedan las cuentas, sus contraseñas y las secciones antiguas de Más práctica.
const SEASON = { id: 1, start: '2026-11-07T06:38:55.932Z' };

// En las pruebas el reloj es fijo y anterior a la temporada: cada prueba elige la suya con setSeason.
const OPEN_SEASON = { id: 0, start: '1970-01-01T00:00:00.000Z' };
let current = process.env.NODE_TEST_CONTEXT ? OPEN_SEASON : SEASON;

// Regalos de monedas al empezar la temporada, una sola vez por cuenta. Las monedas no cuentan en el Ranking.
const SEASON_GIFTS = { juan08x: 5000 };
const plain = (text) => String(text ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const seasonGift = (user) => SEASON_GIFTS[plain(user.username)] ?? SEASON_GIFTS[plain(user.display_name)] ?? 0;

export const season = () => current;
export const seasonStart = () => current.start;
export const setSeason = (next) => { current = next ?? OPEN_SEASON; };

/** Las recompensas de una sola vez llevan la temporada en su clave: lo cobrado antes no bloquea lo nuevo. */
export const seasonKey = (key) => (current.id ? `s${current.id}:${key}` : key);
