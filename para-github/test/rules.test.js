import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';
import { addDays, localDate } from '../server/dates.js';
import { award, balance, buyItem, reconcileShields, RULES, streakStats, validatePracticeDay } from '../server/progress.js';
import { dueVocab, recordResult } from '../server/srs.js';
import { at, makeUser } from './helpers.js';

const NY = 'America/New_York';
const noonOn = (date) => at(`${date}T17:00:00Z`);

test('fecha local: respeta Nueva York alrededor de medianoche', () => {
  assert.equal(localDate(at('2026-11-06T04:59:00Z'), NY), '2026-11-05'); // 23:59 EST
  assert.equal(localDate(at('2026-11-06T05:01:00Z'), NY), '2026-11-06'); // 00:01 EST
});

test('fecha local: cambio de horario de noviembre y marzo', () => {
  // El 1 de noviembre de 2026 termina el horario de verano: ese dia dura 25 horas.
  assert.equal(localDate(at('2026-11-01T03:59:00Z'), NY), '2026-10-31'); // 23:59 EDT
  assert.equal(localDate(at('2026-11-01T04:01:00Z'), NY), '2026-11-01'); // 00:01 EDT
  assert.equal(localDate(at('2026-11-02T04:59:00Z'), NY), '2026-11-01'); // 23:59 EST
  assert.equal(localDate(at('2026-11-02T05:01:00Z'), NY), '2026-11-02');
  // Marzo: un offset fijo de -5 fallaria aqui.
  assert.equal(localDate(at('2026-03-09T03:59:00Z'), NY), '2026-03-08'); // 23:59 EDT
  assert.equal(localDate(at('2026-03-09T04:01:00Z'), NY), '2026-03-09');
  assert.equal(addDays('2026-11-01', 1), '2026-11-02');
  assert.equal(addDays('2026-03-08', 1), '2026-03-09');
});

test('una jornada suma un solo dia aunque se valide muchas veces', async () => {
  const db = openDb(':memory:');
  const now = noonOn('2026-11-05');
  const u = await makeUser(db, 'ana', now);
  const first = await validatePracticeDay(db, u, 'brief', now);
  const second = await validatePracticeDay(db, u, 'full', now + 3600000);
  assert.equal(first.newDay, true);
  assert.equal(first.coins, RULES.COINS_PER_DAY);
  assert.equal(second.newDay, false);
  assert.equal(second.coins, 0);
  const s = await streakStats(db, u.id, '2026-11-05');
  assert.equal(s.current, 1);
  assert.equal((await balance(db, u.id)).coins, 20);
});

test('se usa la fecha de finalizacion: 23:59 y 00:01 son dias distintos', async () => {
  const db = openDb(':memory:');
  const u = await makeUser(db, 'ana', at('2026-11-05T17:00:00Z'));
  await validatePracticeDay(db, u, 'brief', at('2026-11-06T04:59:00Z'));
  await validatePracticeDay(db, u, 'brief', at('2026-11-06T05:01:00Z'));
  const s = await streakStats(db, u.id, '2026-11-06');
  assert.equal(s.current, 2);
});

test('recompensas: la misma clave no paga dos veces', async () => {
  const db = openDb(':memory:');
  const now = noonOn('2026-11-05');
  const u = await makeUser(db, 'ana', now);
  assert.equal(await award(db, u.id, 'lesson:u1l1', { xp: 10 }, now), true);
  assert.equal(await award(db, u.id, 'lesson:u1l1', { xp: 10 }, now), false);
  assert.equal((await balance(db, u.id)).xp, 10);
});

test('siete dias realmente practicados pagan el bloque una sola vez; el protector no cuenta', async () => {
  const db = openDb(':memory:');
  let date = '2026-11-01';
  const u = await makeUser(db, 'ana', noonOn(date));
  for (let i = 0; i < 6; i++) { await validatePracticeDay(db, u, 'brief', noonOn(date)); date = addDays(date, 1); }
  // Dia perdido cubierto con protector: continuidad sin sumar.
  db.prepare('UPDATE users SET shields=1 WHERE id=?').run(u.id);
  date = addDays(date, 1);
  await validatePracticeDay(db, u, 'brief', noonOn(date));
  const s = await streakStats(db, u.id, date);
  assert.equal(s.practicedTotal, 7);
  assert.equal(s.current, 7);
  assert.equal((await balance(db, u.id)).coins, 7 * 20 + 50);
  await validatePracticeDay(db, u, 'full', noonOn(date));
  assert.equal((await balance(db, u.id)).coins, 7 * 20 + 50);
});

test('protector: cubre un dia, no suma practica y no se consume dos veces', async () => {
  const db = openDb(':memory:');
  const u = await makeUser(db, 'ana', noonOn('2026-11-01'));
  await validatePracticeDay(db, u, 'brief', noonOn('2026-11-01'));
  db.prepare('UPDATE users SET shields=2 WHERE id=?').run(u.id);
  const nowLater = noonOn('2026-11-03');
  assert.deepEqual(await reconcileShields(db, u, nowLater), ['2026-11-02']);
  assert.deepEqual(await reconcileShields(db, u, nowLater), []);
  assert.deepEqual(await reconcileShields(db, u, nowLater + 3600000), []);
  assert.equal(db.prepare('SELECT shields FROM users WHERE id=?').get(u.id).shields, 1);
  const s = await streakStats(db, u.id, '2026-11-03');
  assert.equal(s.current, 1);
  assert.equal(s.practicedTotal, 1);
  const shielded = db.prepare(`SELECT status FROM streak_days WHERE user_id=? AND local_date='2026-11-02'`).get(u.id);
  assert.equal(shielded.status, 'shielded');
});

test('protector: una unidad no cubre varios dias; si no alcanza no se gasta', async () => {
  const db = openDb(':memory:');
  const u = await makeUser(db, 'ana', noonOn('2026-11-01'));
  await validatePracticeDay(db, u, 'brief', noonOn('2026-11-01'));
  db.prepare('UPDATE users SET shields=1 WHERE id=?').run(u.id);
  assert.deepEqual(await reconcileShields(db, u, noonOn('2026-11-04')), []);
  assert.equal(db.prepare('SELECT shields FROM users WHERE id=?').get(u.id).shields, 1);
  const s = await streakStats(db, u.id, '2026-11-04');
  assert.equal(s.current, 0);
  assert.equal(s.best, 1);
  assert.equal(s.interrupted, true);
});

test('interrupcion: conserva monedas y mejor racha', async () => {
  const db = openDb(':memory:');
  const u = await makeUser(db, 'ana', noonOn('2026-11-01'));
  await validatePracticeDay(db, u, 'brief', noonOn('2026-11-01'));
  await validatePracticeDay(db, u, 'brief', noonOn('2026-11-02'));
  await validatePracticeDay(db, u, 'brief', noonOn('2026-11-10'));
  const s = await streakStats(db, u.id, '2026-11-10');
  assert.equal(s.current, 1);
  assert.equal(s.best, 2);
  assert.equal((await balance(db, u.id)).coins, 60);
});

test('tienda: precio, tope de dos protectores y compra duplicada', async () => {
  const db = openDb(':memory:');
  const now = noonOn('2026-11-05');
  const u = await makeUser(db, 'ana', now);
  assert.equal((await buyItem(db, u, 'shield', 'r1', now)).code, 'not_enough');
  await award(db, u.id, 'test', { coins: 300 }, now);
  assert.equal((await buyItem(db, u, 'shield', 'r1', now)).ok, true);
  assert.equal((await buyItem(db, u, 'shield', 'r1', now)).duplicate, true);
  assert.equal((await balance(db, u.id)).coins, 240);
  assert.equal((await buyItem(db, u, 'shield', 'r2', now)).ok, true);
  assert.equal((await buyItem(db, u, 'shield', 'r3', now)).code, 'max_shields');
  assert.equal((await balance(db, u.id)).coins, 180);
  assert.equal((await buyItem(db, u, 'hat_beret', null, now)).ok, true);
  assert.equal((await buyItem(db, u, 'hat_beret', null, now)).duplicate, true);
  assert.equal((await balance(db, u.id)).coins, 100);
});

test('repaso: intervalos 1-3-7-14-30 y un fallo adelanta', async () => {
  const db = openDb(':memory:');
  const u = await makeUser(db, 'ana', noonOn('2026-11-01'));
  const get = () => db.prepare(`SELECT * FROM vocab_progress WHERE user_id=? AND vocab_id='refill'`).get(u.id);
  await recordResult(db, u.id, 'refill', { level: 'recognize', correct: true }, '2026-11-01');
  assert.equal(get().due_date, '2026-11-02');
  await recordResult(db, u.id, 'refill', { level: 'use', correct: true }, '2026-11-01');
  assert.equal(get().due_date, '2026-11-02', 'no avanza el mismo dia en que se presento');
  await recordResult(db, u.id, 'refill', { level: 'use', correct: true }, '2026-11-02');
  assert.equal(get().due_date, '2026-11-05');
  await recordResult(db, u.id, 'refill', { level: 'use', correct: true }, '2026-11-02');
  assert.equal(get().due_date, '2026-11-05', 'solo avanza una vez por dia');
  await recordResult(db, u.id, 'refill', { level: 'use', correct: true }, '2026-11-05');
  assert.equal(get().due_date, '2026-11-12');
  await recordResult(db, u.id, 'refill', { level: 'use', correct: false }, '2026-11-06');
  assert.equal(get().due_date, '2026-11-07');
  assert.equal(get().lapses, 1);
  assert.ok(get().recognized_count === 1 && get().used_count >= 2, 'reconocer y usar se cuentan por separado');
  assert.deepEqual(await dueVocab(db, u.id, '2026-11-07', 5), ['refill']);
});
