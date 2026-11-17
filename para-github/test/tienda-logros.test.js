import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../server/db.js';
import { at, makeUser } from './helpers.js';
import { grantEarnedItems, ownedItems, SHOP_ITEMS, EARN_RULES, buyItem } from '../server/progress.js';

test('Tienda: los looks legendarios se ganan por logro, una sola vez y solo con su animal', async () => {
  const db = openDb(':memory:');
  const now = at('2026-11-20T15:00:00Z');
  const user = await makeUser(db, 'ana', now);
  const earn = SHOP_ITEMS.filter((i) => i.earn);
  assert.equal(earn.length, 20, '2 legendarios por animal');
  for (const i of earn) assert.ok(EARN_RULES[i.earn], `${i.id}: el logro «${i.earn}» no tiene regla`);

  assert.deepEqual(await grantEarnedItems(db, user.id, { practicedTotal: 13, mesasHechas: 19 }, now), [], 'sin cumplir no se da nada');
  assert.deepEqual(await grantEarnedItems(db, user.id, { practicedTotal: 14, mesasHechas: 0 }, now), ['look_capibara_16'], 'racha: solo el de la capibara (no hay otros animales)');
  assert.deepEqual(await grantEarnedItems(db, user.id, { practicedTotal: 14, mesasHechas: 0 }, now), [], 'idempotente');
  assert.deepEqual(await grantEarnedItems(db, user.id, { practicedTotal: 14, mesasHechas: 20 }, now), ['look_capibara_20']);
  assert.ok((await ownedItems(db, user.id)).has('look_capibara_16'));

  assert.equal((await buyItem(db, user, 'look_capibara_16', 'x', now)).code, 'earned_only', 'no se compra');
  // Con el gato comprado, sus legendarios llegan al siguiente chequeo.
  await db.prepare("INSERT INTO reward_events (user_id, key, xp, coins, created_at) VALUES (?,?,0,5000,?)").run(user.id, 'test:coins', new Date(now).toISOString());
  assert.equal((await buyItem(db, user, 'animal_cat', 'y', now)).ok, true);
  assert.deepEqual((await grantEarnedItems(db, user.id, { practicedTotal: 14, mesasHechas: 20 }, now)).sort(), ['look_gato_16', 'look_gato_20']);
});
