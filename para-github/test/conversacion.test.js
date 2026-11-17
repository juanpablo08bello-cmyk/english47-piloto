import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login } from './helpers.js';

const DAY = 86400000;
const decir = async (api, list) => { for (const f of list) await api('POST', '/api/conversacion/intento', { index: f.id, heard: f.en }); };
const pasada = async (api) => {
  const home = (await api('GET', '/api/conversacion')).data;
  await decir(api, home.pack);
  return (await api('POST', '/api/conversacion/terminar', { kind: 'pack' })).data;
};

test('Conversación: el mismo pack 5 días activos, y después pasa a repaso espaciado', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const first = (await api('GET', '/api/conversacion')).data;
    assert.equal(first.pack.length, 5);
    assert.equal(first.day, 1);
    assert.equal(first.review.length, 0);
    const ids = first.pack.map((f) => f.id);
    for (let d = 1; d <= 5; d++) {
      const home = (await api('GET', '/api/conversacion')).data;
      assert.deepEqual(home.pack.map((f) => f.id), d <= 5 ? ids : [], 'el pack no cambia en 5 días activos');
      assert.equal(home.day, d);
      const out = await pasada(api);
      assert.equal(out.graduated, d === 5);
      app.clockBox.now += DAY;
    }
    const next = (await api('GET', '/api/conversacion')).data;
    assert.notDeepEqual(next.pack.map((f) => f.id), ids, 'el día 6 llega un pack nuevo');
    assert.equal(next.day, 1);
    assert.equal(next.learnedCount, 5);
    // Las frases graduadas (dichas bien en 2 días y sin ver el texto) vuelven a los 3 días.
    assert.equal(next.review.length, 0, 'todavía no toca');
    app.clockBox.now += 2 * DAY;
    const later = (await api('GET', '/api/conversacion')).data;
    assert.equal(later.review.length, 5, 'a los 3 días del último pack, las 5 vuelven a repaso');
    assert.equal((await api('GET', '/api/today')).data.plan.review.done, false, 'el repaso ya cuenta para la racha');
    await decir(api, later.review);
    const r = (await api('POST', '/api/conversacion/terminar', { kind: 'repaso' })).data;
    assert.equal(r.plan.review.done, true);
    assert.equal((await api('GET', '/api/conversacion')).data.review.length, 0, 'al acertar, el intervalo se alarga: hoy ya no hay más');
    app.clockBox.now += 6 * DAY;
    assert.equal((await api('GET', '/api/conversacion')).data.review.length, 0, 'a los 6 días todavía no (toca a los 7)');
    app.clockBox.now += DAY;
    assert.equal((await api('GET', '/api/conversacion')).data.review.length, 5, 'a los 7 días vuelven');
  } finally { await app.stop(); }
});

test('Conversación: saltar días no acumula ni castiga; una semana sin practicar vuelve al día 1', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    await pasada(api);
    app.clockBox.now += DAY;
    await pasada(api);
    assert.equal((await api('GET', '/api/conversacion')).data.day, 3);
    app.clockBox.now += 3 * DAY;
    assert.equal((await api('GET', '/api/conversacion')).data.day, 3, 'tres días fuera: sigue donde iba');
    app.clockBox.now += 7 * DAY;
    assert.equal((await api('GET', '/api/conversacion')).data.day, 1, 'diez días fuera: retoma desde el principio');
  } finally { await app.stop(); }
});

test('Conversación: pide voz (3 frases) o modo silencioso, solo frases de hoy, y no se paga dos veces', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    const home = (await api('GET', '/api/conversacion')).data;
    assert.equal((await api('POST', '/api/conversacion/terminar', { kind: 'pack' })).status, 400, 'sin decir nada no cuenta');
    await decir(api, home.pack.slice(0, 2));
    assert.equal((await api('POST', '/api/conversacion/terminar', { kind: 'pack' })).status, 400, 'con 2 frases todavía no');
    assert.equal((await api('POST', '/api/conversacion/intento', { index: 39, heard: 'x' })).status, 404, 'una frase que no es de hoy');
    const bad = (await api('POST', '/api/conversacion/intento', { index: home.pack[2].id, heard: 'banana' })).data;
    assert.equal(bad.result.stars, 0, 'decir otra cosa no suma estrellas');
    const silent = (await api('POST', '/api/conversacion/terminar', { kind: 'pack', silent: true })).data;
    assert.equal(silent.rewards.xp, 15);
    const again = (await api('POST', '/api/conversacion/terminar', { kind: 'pack', silent: true })).data;
    assert.equal(again.rewards.xp, 0);
    assert.equal(again.already, true);
    assert.equal((await api('GET', '/api/conversacion')).data.day, 2, 'cuenta un solo día');
  } finally { await app.stop(); }
});

test('Conversación: lo graduado con el modo silencioso vuelve mañana (flojo), no a los 3 días', async () => {
  const app = await startApp();
  try {
    const api = await login(app, 'ana');
    for (let d = 1; d <= 5; d++) {
      await api('POST', '/api/conversacion/terminar', { kind: 'pack', silent: true });
      app.clockBox.now += DAY;
    }
    const home = (await api('GET', '/api/conversacion')).data;
    assert.equal(home.review.length, 5, 'sin haberlas dicho bien, vuelven al día siguiente');
  } finally { await app.stop(); }
});

test('Conversación: una temporada nueva empieza de cero (nuevo pack, nada aprendido ni por repasar)', async () => {
  const { setSeason } = await import('../server/season.js');
  const app = await startApp();
  try {
    setSeason({ id: 2, start: '1970-01-01T00:00:00.000Z' });
    const api = await login(app, 'ana');
    for (let d = 1; d <= 5; d++) { await pasada(api); app.clockBox.now += DAY; }
    assert.equal((await api('GET', '/api/conversacion')).data.learnedCount, 5);
    setSeason({ id: 3, start: '1970-01-01T00:00:00.000Z' });
    const home = (await api('GET', '/api/conversacion')).data;
    assert.equal(home.learnedCount, 0);
    assert.equal(home.day, 1);
    assert.equal(home.packNumber, 1, 'vuelve al primer pack');
    assert.equal(home.review.length, 0);
  } finally { setSeason(null); await app.stop(); }
});
