import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login, correctAnswer } from './helpers.js';
import { VOCAB_BY_ID } from '../content/vocab.js';
import { SCENARIO_BY_ID } from '../content/scenarios.js';
import { createInvitation } from '../server/auth.js';

async function answerStep(api, session, step) {
  const exercises = step === 'brief' ? session.brief.exercises : session.steps[step].exercises;
  let last;
  for (let i = 0; i < exercises.length; i++) {
    last = await api('POST', '/api/daily/answer', { step, index: i, answer: correctAnswer(exercises[i], VOCAB_BY_ID) });
    assert.equal(last.status, 200, JSON.stringify(last.data));
  }
  return last.data;
}

async function playDemo(api, scenarioId, daily) {
  const created = await api('POST', '/api/sim', { scenarioId, mode: 'demo', helpMode: 'help', daily });
  assert.equal(created.status, 200, JSON.stringify(created.data));
  const scenario = SCENARIO_BY_ID.get(scenarioId);
  let sim = created.data.sim;
  let i = 0;
  while (!sim.done) {
    const r = await api('POST', `/api/sim/${sim.id}/turn`, { text: scenario.beats[i].model, source: 'text', requestId: `t${i}` });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    sim = r.data.sim;
    i += 1;
  }
  return sim;
}

async function fullDay(api) {
  let { session } = (await api('GET', '/api/daily')).data;
  session = (await answerStep(api, session, 'review')).session;
  session = (await api('POST', '/api/daily/cards-seen')).data.session;
  session = (await answerStep(api, session, 'learn')).session;
  const sim = await playDemo(api, session.steps.talk.scenarioId, true);
  const finished = await api('POST', `/api/sim/${sim.id}/finish`);
  assert.equal(finished.status, 200);
  session = (await api('GET', '/api/daily')).data.session;
  return { session: (await answerStep(api, session, 'improve')).session, simId: sim.id };
}

test('sin sesion no hay datos; registro publico inexistente; invitacion de un solo uso', async () => {
  const app = await startApp();
  const anon = app.client();
  assert.equal((await anon('GET', '/api/today')).status, 401);
  assert.equal((await anon('POST', '/api/auth/redeem', { code: 'inventado', username: 'pepe', displayName: 'Pepe', password: 'password123' })).status, 400);
  const { code } = await createInvitation(app.db, { role: 'student' }, app.clockBox.now);
  assert.equal((await anon('POST', '/api/auth/redeem', { code, username: 'pepe', displayName: 'Pepe', password: 'password123' })).status, 200);
  const other = app.client();
  assert.equal((await other('POST', '/api/auth/redeem', { code, username: 'lola', displayName: 'Lola', password: 'password123' })).status, 400);
  await app.stop();
});

test('maximo cinco alumnos', async () => {
  const app = await startApp();
  for (const n of ['a1a', 'a2a', 'a3a', 'a4a', 'a5a']) await login(app, n);
  const r = await createInvitation(app.db, { role: 'student' }, app.clockBox.now);
  assert.equal(r.ok, false);
  assert.equal(r.code, 'seats_full');
  await app.stop();
});

test('aislamiento: una cuenta no ve ni modifica lo de otra', async () => {
  const app = await startApp();
  const ana = await login(app, 'ana');
  const beto = await login(app, 'beto');
  await fullDay(ana);
  const anaToday = (await ana('GET', '/api/today')).data;
  const betoToday = (await beto('GET', '/api/today')).data;
  assert.equal(anaToday.stats.current, 1);
  assert.equal(betoToday.stats.current, 0);
  assert.equal(betoToday.session.doneCount, 0);
  assert.equal(betoToday.stats.xp, 0);

  const simId = app.db.prepare(`SELECT id FROM sim_sessions LIMIT 1`).get().id;
  assert.equal((await beto('GET', `/api/sim/${simId}`)).status, 404);
  assert.equal((await beto('POST', `/api/sim/${simId}/turn`, { text: 'hello there' })).status, 404);
  assert.equal((await beto('POST', `/api/sim/${simId}/finish`)).status, 404);
  assert.equal((await beto('POST', `/api/sim/${simId}/comfort`, { value: 1 })).status, 404);

  await ana('POST', '/api/phrases', { en: 'Secret of Ana', es: 'x' });
  const anaPhrase = (await ana('GET', '/api/vocab')).data.phrases[0];
  assert.equal((await beto('GET', '/api/vocab')).data.phrases.length, 0);
  await beto('DELETE', `/api/phrases/${anaPhrase.id}`);
  assert.equal((await ana('GET', '/api/vocab')).data.phrases.length, 1);
  await app.stop();
});

test('un alumno no entra a administracion; el administrador no ve conversaciones', async () => {
  const app = await startApp();
  const ana = await login(app, 'ana');
  assert.equal((await ana('GET', '/api/admin/overview')).status, 403);
  const { code } = await createInvitation(app.db, { role: 'admin' }, app.clockBox.now);
  const admin = app.client();
  await admin('POST', '/api/auth/redeem', { code, username: 'jefe', displayName: 'Jefe', password: 'password123' });
  const o = await admin('GET', '/api/admin/overview');
  assert.equal(o.status, 200);
  assert.equal(o.data.seats.used, 1, 'el administrador no ocupa plaza');
  assert.ok(!JSON.stringify(o.data).includes('turns'));
  await app.stop();
});

test('sesion completa: racha, XP y monedas; repetir no duplica nada', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { session, simId } = await fullDay(api);
  assert.equal(session.fullDone, true);
  const a = (await api('GET', '/api/today')).data.stats;
  assert.equal(a.current, 1);
  assert.equal(a.coins, 20);
  assert.equal(a.xp, 10 + 10 + 20);

  // Peticiones duplicadas y repeticion completa
  await api('POST', '/api/daily/answer', { step: 'review', index: 0, answer: 'x' });
  await api('POST', '/api/daily/answer', { step: 'improve', index: 0, answer: { recordedMs: 2000 } });
  await api('POST', `/api/sim/${simId}/finish`);
  const again = await playDemo(api, 'dinner_for_two', false);
  await api('POST', `/api/sim/${again.id}/finish`);
  const b = (await api('GET', '/api/today')).data.stats;
  assert.equal(b.current, 1);
  assert.equal(b.coins, 20);
  assert.equal(b.xp, a.xp);
  await app.stop();
});

test('peticiones simultaneas no duplican recompensas', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { session } = (await api('GET', '/api/daily')).data;
  const ex = session.steps.review.exercises;
  await Promise.all(ex.flatMap((e, i) => [0, 1, 2].map(() => api('POST', '/api/daily/answer', { step: 'review', index: i, answer: correctAnswer(e, VOCAB_BY_ID) }))));
  const s = (await api('GET', '/api/today')).data.stats;
  assert.equal(s.xp, 10);
  await app.stop();
});

test('una visita sin actividad no conserva la racha; el modo breve si, y la sesion sigue pendiente', async () => {
  const app = await startApp({ now: Date.parse('2026-11-05T17:00:00Z') });
  const api = await login(app, 'ana');
  await api('GET', '/api/today');
  await api('GET', '/api/daily');
  assert.equal((await api('GET', '/api/today')).data.stats.current, 0, 'abrir la app no cuenta');

  const session = (await api('POST', '/api/daily/brief')).data.session;
  assert.equal(session.brief.exercises.length, 4);
  assert.equal(session.brief.exercises[3].type, 'respond');
  const before = await answerStep(api, { brief: { exercises: session.brief.exercises.slice(0, 3) } }, 'brief');
  assert.equal(before.stats.current, 0, 'tres repasos sin respuesta contextual no bastan');
  const done = await api('POST', '/api/daily/answer', { step: 'brief', index: 3, answer: correctAnswer(session.brief.exercises[3], VOCAB_BY_ID) });
  assert.equal(done.data.stats.current, 1);
  assert.equal(done.data.session.briefOnly, true, 'la sesion de 22 minutos sigue pendiente');
  assert.equal(done.data.session.fullDone, false);
  await app.stop();
});

test('el vocabulario y el avance del dia se conservan al recargar y entre dispositivos', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const a = (await api('GET', '/api/daily')).data.session;
  assert.equal(a.vocab.length, 5);
  await api('POST', '/api/daily/answer', { step: 'review', index: 0, answer: correctAnswer(a.steps.review.exercises[0], VOCAB_BY_ID) });
  const b = (await api('GET', '/api/daily')).data.session;
  assert.deepEqual(b.vocab.map((v) => v.id), a.vocab.map((v) => v.id));
  assert.deepEqual(b.steps.review.exercises, a.steps.review.exercises);
  assert.equal(Object.keys(b.steps.review.answers).length, 1);
  // Otro dispositivo con la misma cuenta
  const second = app.client();
  await second('POST', '/api/auth/login', { username: 'ana', password: 'password123' });
  const c = (await second('GET', '/api/daily')).data.session;
  assert.deepEqual(c.vocab.map((v) => v.id), a.vocab.map((v) => v.id));
  // Dia siguiente: vocabulario nuevo, porque el de hoy ya se presento
  await api('POST', '/api/daily/cards-seen');
  app.clockBox.now += 86400000;
  const d = (await api('GET', '/api/daily')).data.session;
  assert.notDeepEqual(d.vocab.map((v) => v.id), a.vocab.map((v) => v.id));
  await app.stop();
});

test('sesion que cruza la medianoche: cuenta en la fecha de finalizacion', async () => {
  const app = await startApp({ now: Date.parse('2026-11-06T04:50:00Z') }); // 23:50 del dia 5 en Nueva York
  const api = await login(app, 'ana');
  let { session } = (await api('GET', '/api/daily')).data;
  assert.equal(session.today, '2026-11-05');
  session = (await api('POST', '/api/daily/answer', { step: 'review', index: 0, answer: correctAnswer(session.steps.review.exercises[0], VOCAB_BY_ID) })).data.session;
  const vocab = session.vocab.map((v) => v.id);

  app.clockBox.now = Date.parse('2026-11-06T05:10:00Z'); // 00:10 del dia 6
  const carried = (await api('GET', '/api/daily')).data.session;
  assert.equal(carried.today, '2026-11-06');
  assert.equal(carried.sessionDate, '2026-11-05', 'sigue la misma sesion');
  assert.deepEqual(carried.vocab.map((v) => v.id), vocab);
  for (let i = 1; i < carried.steps.review.exercises.length; i++) {
    await api('POST', '/api/daily/answer', { step: 'review', index: i, answer: correctAnswer(carried.steps.review.exercises[i], VOCAB_BY_ID) });
  }
  const days = app.db.prepare('SELECT local_date FROM streak_days').all().map((r) => r.local_date);
  assert.deepEqual(days, ['2026-11-06'], 'review+respond validan con la fecha de finalizacion');
  await app.stop();
});

test('protector por API: se muestra distinto y un dia no se consume dos veces', async () => {
  const app = await startApp({ now: Date.parse('2026-11-05T17:00:00Z') });
  const api = await login(app, 'ana');
  const s = (await api('POST', '/api/daily/brief')).data.session;
  await answerStep(api, s, 'brief');
  app.db.prepare('UPDATE users SET shields=2').run();
  app.clockBox.now = Date.parse('2026-11-07T17:00:00Z');
  await api('GET', '/api/today');
  await api('GET', '/api/today');
  const p = (await api('GET', '/api/profile')).data;
  assert.equal(p.stats.shields, 1);
  assert.equal(p.stats.current, 1);
  const marks = Object.fromEntries(p.calendar.map((d) => [d.date, d.status]));
  assert.equal(marks['2026-11-05'], 'practiced');
  assert.equal(marks['2026-11-06'], 'shielded');
  await app.stop();
});

test('zona horaria configurable por alumno, y rechaza valores no validos', async () => {
  const app = await startApp({ now: Date.parse('2026-11-06T04:30:00Z') });
  const api = await login(app, 'ana');
  assert.equal((await api('GET', '/api/daily')).data.session.today, '2026-11-05');
  assert.equal((await api('POST', '/api/settings', { timezone: 'Marte/Olympus' })).status, 400);
  await api('POST', '/api/settings', { timezone: 'Europe/Madrid' });
  assert.equal((await api('GET', '/api/today')).data.stats.today, '2026-11-06');
  await app.stop();
});

test('demo: identificada, sin IA, con evaluacion por reglas y sin pronunciacion', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const status = (await api('GET', '/api/voice/status')).data;
  assert.equal(status.aiAvailable, false);
  assert.ok(status.missing.length >= 3);
  assert.equal((await api('POST', '/api/sim', { scenarioId: 'dinner_for_two', mode: 'ai' })).status, 409);
  assert.equal((await api('POST', '/api/voice/transcribe', undefined, { 'content-type': 'audio/webm' })).status, 409);
  assert.equal((await api('POST', '/api/voice/speak', { text: 'hi' })).status, 409);

  const created = (await api('POST', '/api/sim', { scenarioId: 'nut_allergy', mode: 'demo', helpMode: 'work' })).data.sim;
  assert.equal(created.mode, 'demo');
  assert.equal(created.goal, null, 'como en el trabajo no muestra pista');
  assert.equal((await api('POST', `/api/sim/${created.id}/hint`)).status, 400);

  await api('POST', `/api/sim/${created.id}/turn`, { text: 'Okay', source: 'text' });
  await api('POST', `/api/sim/${created.id}/turn`, { text: 'No nuts, it is fine', source: 'text' });
  await api('POST', `/api/sim/${created.id}/turn`, { text: 'Yes, it is totally safe, do not worry', source: 'text' });
  const { sim } = (await api('POST', `/api/sim/${created.id}/finish`)).data;
  assert.equal(sim.summary.evaluator, 'rules');
  assert.equal(sim.summary.pronunciation, 'not_evaluated');
  assert.equal(sim.summary.criticalMet, false, 'una garantia inventada no supera el criterio');
  assert.ok(sim.summary.improvements.length <= 2 && sim.summary.improvements.length > 0);
  assert.ok(sim.summary.improvements[0].corrected.includes('guarantee'), 'prioriza el punto critico');
  assert.ok(sim.summary.reviewVocab.length > 0);
  await app.stop();
});

test('demo: decir que no se puede garantizar supera el criterio critico', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const sim = await playDemo(api, 'nut_allergy', false);
  const done = (await api('POST', `/api/sim/${sim.id}/finish`)).data.sim;
  assert.equal(done.summary.criticalMet, true);
  await app.stop();
});

test('privacidad: sin permiso no queda la conversacion, y se puede borrar el historial', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const sim = await playDemo(api, 'table_for_two', false);
  const done = (await api('POST', `/api/sim/${sim.id}/finish`)).data.sim;
  assert.equal(done.turns.length, 0);
  assert.ok(done.summary);
  await api('POST', '/api/privacy/delete-history');
  assert.equal((await api('GET', `/api/sim/${sim.id}`)).data.sim.summary, null);
  await app.stop();
});

test('rutas: no permite salir de la carpeta publica ni peticiones de otro origen', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const forged = await api('POST', '/api/settings', { soundOn: false }, { origin: 'https://malicioso.example' });
  assert.equal(forged.status, 403);
  const res = await fetch(`${app.base}/..%2f..%2fpackage.json`);
  assert.notEqual(res.status, 200);
  await app.stop();
});

test('la leccion paga XP una vez, aunque se repita', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const run = async () => {
    const l = (await api('GET', '/api/lesson/u4l2')).data;
    for (let i = 0; i < l.exercises.length; i++) {
      await api('POST', '/api/lesson/u4l2/answer', { index: i, answer: correctAnswer(l.exercises[i], VOCAB_BY_ID) });
    }
    return (await api('POST', '/api/lesson/u4l2/complete')).data;
  };
  const first = await run();
  assert.equal(first.completed, true);
  assert.equal(first.xp, 10);
  const second = await run();
  assert.equal(second.completed, true);
  assert.equal(second.xp, 0);
  assert.equal(second.stats.xp, 10);
  await app.stop();
});
