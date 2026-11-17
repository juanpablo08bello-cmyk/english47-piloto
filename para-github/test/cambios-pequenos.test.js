import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvitation, redeemInvitation } from '../server/auth.js';
import { login, startApp } from './helpers.js';

test('invitación: dice si sirve y para quién es, sin revelar nada más', async () => {
  const app = await startApp();
  const anon = app.client();
  const { code } = await createInvitation(app.db, { role: 'student', label: 'Harbor 47' }, app.clockBox.now);
  const ok = await anon('GET', `/api/auth/invitation/${code}`);
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.data, { valid: true, label: 'Harbor 47' });
  const mala = await anon('GET', '/api/auth/invitation/codigo-que-no-existe');
  assert.equal(mala.status, 200);
  assert.deepEqual(mala.data, { valid: false, label: null });
  // Una invitación usada ya no sirve.
  await redeemInvitation(app.db, { code, username: 'ana', displayName: 'Ana', password: 'password123' }, app.clockBox.now);
  assert.deepEqual((await anon('GET', `/api/auth/invitation/${code}`)).data, { valid: false, label: null });
  await app.stop();
});

test('invitación: adivinar códigos tiene límite de intentos', async () => {
  const app = await startApp();
  const anon = app.client();
  let ultimo = 0;
  for (let i = 0; i < 30; i++) ultimo = (await anon('GET', `/api/auth/invitation/intento-${i}`)).status;
  assert.equal(ultimo, 429, 'tras muchos intentos fallidos se bloquea');
  await app.stop();
});

test('vocabulario: cada expresión trae su guía de pronunciación', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const r = await api('GET', '/api/vocab?view=todas&limit=50');
  assert.equal(r.status, 200);
  assert.ok(r.data.entries.length > 0);
  for (const e of r.data.entries) assert.equal(typeof e.pron, 'string', `pron en ${e.id}`);
  assert.ok(r.data.entries.some((e) => e.pron.length > 0), 'al menos alguna tiene guía');
  await app.stop();
});

test('tienda: los 9 animales comprables están disponibles', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const r = await api('GET', '/api/profile');
  assert.equal(r.status, 200);
  const animales = r.data.shop.filter((i) => i.kind === 'animal');
  assert.equal(animales.length, 9);
  assert.ok(r.data.shop.every((i) => i.available === true));
  await app.stop();
});
