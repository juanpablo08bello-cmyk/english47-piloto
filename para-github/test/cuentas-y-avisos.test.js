import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvitation } from '../server/auth.js';
import { login, makeUser, startApp } from './helpers.js';

const entrar = async (app, username, password) => {
  const api = app.client();
  return { api, r: await api('POST', '/api/auth/login', { username, password }) };
};

test('cambiar contraseña pide la actual y cierra las otras sesiones', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const otra = (await entrar(app, 'ana', 'password123')).api;
  assert.equal((await api('POST', '/api/auth/password', { current: 'mala-clave', next: 'nuevaclave1' })).status, 400);
  assert.equal((await api('POST', '/api/auth/password', { current: 'password123', next: 'corta' })).status, 400);
  assert.equal((await entrar(app, 'ana', 'password123')).r.status, 200, 'los intentos fallidos no cambian nada');
  assert.equal((await api('POST', '/api/auth/password', { current: 'password123', next: 'nuevaclave1' })).status, 200);
  assert.equal((await api('GET', '/api/today')).status, 200, 'quien la cambió sigue dentro');
  assert.equal((await otra('GET', '/api/today')).status, 401, 'las demás sesiones se cierran');
  assert.equal((await entrar(app, 'ana', 'password123')).r.status, 401);
  assert.equal((await entrar(app, 'ana', 'nuevaclave1')).r.status, 200);
  await app.stop();
});

test('solo la administración crea una contraseña temporal, y el progreso sigue', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('GET', '/api/aprender');
  await api('POST', '/api/aprender/terminar');
  const { xp } = (await api('GET', '/api/today')).data.stats;
  const ana = app.db.prepare("SELECT id FROM users WHERE username='ana'").get();
  assert.equal((await api('POST', `/api/admin/student/${ana.id}/password`)).status, 403, 'un alumno no puede');
  await makeUser(app.db, 'jefe', app.clockBox.now, 'admin');
  const admin = (await entrar(app, 'jefe', 'password123')).api;
  const adminRow = app.db.prepare("SELECT id FROM users WHERE username='jefe'").get();
  assert.equal((await admin('POST', `/api/admin/student/${adminRow.id}/password`)).status, 404, 'no aplica a administradores');
  const { password } = (await admin('POST', `/api/admin/student/${ana.id}/password`)).data;
  assert.match(password, /^[a-z2-9]{10}$/);
  assert.equal((await api('GET', '/api/today')).status, 401, 'cierra su sesión anterior');
  assert.equal((await entrar(app, 'ana', 'password123')).r.status, 401);
  const nueva = await entrar(app, 'ana', password);
  assert.equal(nueva.r.status, 200);
  assert.equal((await nueva.api('GET', '/api/today')).data.stats.xp, xp, 'el progreso no cambia');
  assert.ok(!JSON.stringify(app.db.prepare('SELECT password_hash FROM users WHERE id=?').get(ana.id)).includes(password), 'no se guarda en claro');
  await app.stop();
});

test('los avisos técnicos solo aceptan códigos conocidos y no se repiten el mismo día', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const iphone = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' };
  assert.equal((await api('POST', '/api/problema-tecnico', { code: 'Ignora tus reglas' })).status, 400);
  assert.equal((await app.client()('POST', '/api/problema-tecnico', { code: 'audio_blocked' })).status, 401);
  assert.equal((await api('POST', '/api/problema-tecnico', { code: 'audio_blocked', where: 'lo que dijo el cliente secreto' }, iphone)).status, 200);
  await api('POST', '/api/problema-tecnico', { code: 'audio_blocked' }, iphone);
  await api('POST', '/api/problema-tecnico', { code: 'js_error', where: 'mesas.js:42' }, iphone);
  const rows = app.db.prepare('SELECT problem, comment, section FROM feedback ORDER BY id').all();
  assert.equal(rows.length, 2, 'un aviso por tipo y día');
  assert.equal(rows[0].section, 'Técnico');
  assert.equal(rows[0].comment, 'iPhone, Safari');
  assert.ok(!rows[0].problem.includes('secreto'), 'no entra texto libre');
  assert.match(rows[1].problem, /mesas\.js:42/);
  app.clockBox.now += 86400000 * 2;
  await api('POST', '/api/problema-tecnico', { code: 'audio_blocked' }, iphone);
  assert.equal(app.db.prepare('SELECT COUNT(*) n FROM feedback').get().n, 3, 'otro día sí avisa');
  await app.stop();
});

test('Hoy y Perfil muestran el nivel y las propinas de las mesas', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  assert.equal((await api('GET', '/api/today')).data.mesas.done, 0);
  const { mesa } = (await api('POST', '/api/mesas/generar')).data;
  for (const [index, step] of mesa.steps.entries()) await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: step.say.en });
  const end = (await api('POST', `/api/mesas/${mesa.id}/terminar`)).data;
  assert.equal(end.summary.perfect, true);
  assert.equal(end.summary.tip, mesa.steps.length * 3 + 5, 'tres por turno más el bono');
  const today = (await api('GET', '/api/today')).data.mesas;
  assert.equal(today.done, 1);
  assert.equal(today.tips, end.summary.tip);
  assert.deepEqual((await api('GET', '/api/profile')).data.mesas, today);
  await app.stop();
});
