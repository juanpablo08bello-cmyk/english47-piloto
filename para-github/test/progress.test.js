// Fallos reproducidos en la revision: recompensas sin practica, reintentos falsos,
// repasos prometidos y citas que quedaban guardadas sin permiso. Y la migracion de datos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startApp, login, correctAnswer } from './helpers.js';
import { VOCAB_BY_ID } from '../content/vocab.js';
import { SCENARIO_BY_ID } from '../content/scenarios.js';
import { ACHIEVEMENTS } from '../server/progress.js';
import { openDb, SCHEMA_VERSION } from '../server/db.js';

async function finishWith(api, scenarioId, lines, daily = false) {
  const { sim } = (await api('POST', '/api/sim', { scenarioId, mode: 'demo', helpMode: 'work', daily })).data;
  for (let i = 0; i < lines.length; i++) {
    const r = await api('POST', `/api/sim/${sim.id}/turn`, { text: lines[i], source: 'text', requestId: `r${i}` });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }
  return { id: sim.id, ...(await api('POST', `/api/sim/${sim.id}/finish`)).data };
}
const models = (id) => SCENARIO_BY_ID.get(id).beats.map((b) => b.model);
const hasAchievement = (app, key) => Boolean(app.db.prepare('SELECT 1 FROM achievements WHERE key=?').get(key));

test('«banana banana banana» no da XP ni completa el reto', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const out = await finishWith(api, 'table_for_two', ['banana banana banana']);
  assert.equal(out.rewards.xp, 0);
  assert.equal(out.sim.outcome, 'attempted');
  assert.equal(out.sim.summary.endedEarly, true);
  assert.ok(out.sim.summary.reinforce.length > 0);
  assert.ok(!hasAchievement(app, 'first_conversation'));
  const route = (await api('GET', '/api/route')).data;
  const unit = route.units.find((u) => u.id === 1);
  assert.equal(unit.challenge.done, false);
  assert.equal(unit.challenge.outcome, 'attempted');
  await app.stop();
});

test('recorrer toda la escena con disparates tampoco cuenta', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const out = await finishWith(api, 'table_for_two', ['banana banana banana', 'banana banana banana', 'asdf qwer zxcv']);
  assert.equal(out.sim.outcome, 'attempted');
  assert.equal(out.rewards.xp, 0);
  await app.stop();
});

test('terminar antes de tiempo es «intentado», con un premio pequeno por el esfuerzo', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const out = await finishWith(api, 'dinner_for_two', [models('dinner_for_two')[0]]);
  assert.equal(out.sim.outcome, 'attempted');
  assert.equal(out.sim.summary.endedEarly, true);
  assert.equal(out.rewards.xp, 5);
  assert.notEqual(out.sim.summary.outcome, 'resolved');
  await app.stop();
});

test('completado no es resuelto: equivocarse da esfuerzo, no dominio', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const wrong = ['The fries are good tonight', 'The fries are good tonight', 'The fries are good tonight'];
  const out = await finishWith(api, 'table_for_two', wrong);
  assert.equal(out.sim.outcome, 'completed');
  assert.equal(out.rewards.xp, 20);
  assert.ok(out.sim.summary.reinforce.length === 3);
  assert.equal((await api('GET', '/api/route')).data.units[0].challenge.done, false);
  const right = await finishWith(api, 'table_for_two', models('table_for_two'));
  assert.equal(right.sim.outcome, 'resolved');
  assert.equal(right.rewards.xp, 0, 'el mismo dia y escenario no paga dos veces');
  assert.equal((await api('GET', '/api/route')).data.units[0].challenge.done, true);
  await app.stop();
});

test('el criterio critico falla aunque el resto este bien: no se resuelve', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const lines = models('nut_allergy');
  lines[2] = 'Yes, it is totally safe, do not worry';
  const out = await finishWith(api, 'nut_allergy', lines);
  assert.equal(out.sim.outcome, 'completed');
  assert.equal(out.sim.summary.criticalMet, false);
  await app.stop();
});

test('una respuesta equivocada pero real conserva el habito; un disparate no', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { session } = (await api('POST', '/api/daily/brief')).data;
  const ex = session.brief.exercises;
  for (let i = 0; i < 3; i++) await api('POST', '/api/daily/answer', { step: 'brief', index: i, answer: ex[i].options[0] });
  const nonsense = (await api('POST', '/api/daily/answer', { step: 'brief', index: 3, answer: 'banana banana banana' })).data;
  assert.equal(nonsense.stats.current, 0, 'un disparate no es practica');
  const retry = (await api('POST', '/api/daily/answer', { step: 'brief', index: 3, answer: 'I think the fries are good tonight.', retry: true })).data;
  assert.equal(retry.stats.current, 1, 'equivocarse con una respuesta real si cuenta');
  await app.stop();
});

test('reintento real: exige una respuesta nueva; escuchar no da el logro', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const lines = models('dinner_for_two');
  lines[0] = 'The fries are good tonight';
  const out = await finishWith(api, 'dinner_for_two', lines);
  assert.ok(out.sim.summary.improvements.length > 0);
  assert.ok(!hasAchievement(app, 'retried_phrase'), 'terminar no da el logro');
  const empty = await api('POST', `/api/sim/${out.id}/retry`, { index: 0, text: '' });
  assert.equal(empty.status, 400);
  assert.ok(!hasAchievement(app, 'retried_phrase'), 'sin intento no hay logro');
  const nonsense = await api('POST', `/api/sim/${out.id}/retry`, { index: 0, text: 'banana banana banana' });
  assert.equal(nonsense.data.ok, false);
  assert.ok(!hasAchievement(app, 'retried_phrase'), 'un disparate no es un intento');
  const real = await api('POST', `/api/sim/${out.id}/retry`, { index: 0, text: out.sim.summary.improvements[0].corrected });
  assert.equal(real.data.status, 'correct');
  assert.ok(hasAchievement(app, 'retried_phrase'));
  await app.stop();
});

test('reintento en ejercicios: reemplaza el resultado, no duplica fallos ni recompensas', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('POST', '/api/daily/cards-seen');
  const { session } = (await api('GET', '/api/daily')).data;
  const idx = session.steps.learn.exercises.findIndex((e) => e.type === 'recall');
  const ex = session.steps.learn.exercises[idx];
  const first = (await api('POST', '/api/daily/answer', { step: 'learn', index: idx, answer: 'something else entirely' })).data;
  assert.equal(first.result.correct, false);
  assert.equal(first.result.canRetry, true);
  assert.equal(first.result.reviewScheduled, true);
  const dup = (await api('POST', '/api/daily/answer', { step: 'learn', index: idx, answer: VOCAB_BY_ID.get(ex.vocabId).en })).data;
  assert.equal(dup.duplicate, true, 'sin retry es una peticion duplicada');
  await api('POST', '/api/daily/answer', { step: 'learn', index: idx, answer: 'wrong again please', retry: true });
  const row = () => app.db.prepare('SELECT lapses, used_count FROM vocab_progress WHERE vocab_id=?').get(ex.vocabId);
  assert.equal(row().lapses, 1, 'un reintento fallido no suma otro fallo');
  const fixed = (await api('POST', '/api/daily/answer', { step: 'learn', index: idx, answer: VOCAB_BY_ID.get(ex.vocabId).en, retry: true })).data;
  assert.equal(fixed.result.correct, true);
  assert.equal(row().used_count, 1);
  assert.ok(hasAchievement(app, 'retried_phrase'));
  await app.stop();
});

test('calentamiento: el error entra al repaso, como se promete; el acierto no se agenda', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { session } = (await api('GET', '/api/daily')).data;
  const warm = session.steps.review.exercises.map((e, i) => ({ e, i })).filter(({ e }) => e.warmup && e.options);
  assert.ok(warm.length >= 2);
  const [good, bad] = warm;
  await api('POST', '/api/daily/answer', { step: 'review', index: good.i, answer: correctAnswer(good.e, VOCAB_BY_ID) });
  const failing = good.e.options.find((o) => o !== correctAnswer(bad.e, VOCAB_BY_ID)) ?? 'x';
  const out = (await api('POST', '/api/daily/answer', { step: 'review', index: bad.i, answer: bad.e.options.find((o) => o !== correctAnswer(bad.e, VOCAB_BY_ID)) ?? failing })).data;
  assert.equal(out.result.reviewScheduled, true);
  const rows = app.db.prepare('SELECT vocab_id FROM vocab_progress').all().map((r) => r.vocab_id);
  assert.ok(rows.includes(bad.e.vocabId), 'el error se agenda');
  assert.ok(!rows.includes(good.e.vocabId), 'el acierto del calentamiento no');
  await app.stop();
});

test('palabras: reconocida, usada y por consolidar se distinguen', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('POST', '/api/practice/answer', { exercise: { type: 'listen_choose', vocabId: 'refill' }, answer: VOCAB_BY_ID.get('refill').es });
  const a = (await api('GET', '/api/vocab/refill')).data.entry;
  assert.equal(a.recognized, true);
  assert.equal(a.used, false);
  assert.equal(a.pending, true);
  await api('POST', '/api/practice/answer', { exercise: { type: 'recall', vocabId: 'refill' }, answer: 'refill' });
  const b = (await api('GET', '/api/vocab/refill')).data.entry;
  assert.equal(b.used, true);
  await app.stop();
});

test('logros: «Confirmé una orden» no afirma que fue en voz alta', () => {
  assert.ok(!/voz alta/.test(ACHIEVEMENTS.confirmed_order.desc));
  assert.match(ACHIEVEMENTS.confirmed_order.desc, /por voz o por escrito/);
});

test('privacidad: sin permiso, ninguna cita queda guardada; se muestra solo al terminar', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const secret = 'Zebra salad secret words for table';
  const lines = models('dinner_for_two');
  lines[0] = `The fries ${secret}`;
  lines[2] = "It's good. What you want with that?";
  const out = await finishWith(api, 'dinner_for_two', lines, true);
  assert.ok(JSON.stringify(out.sim.summary).includes('fries'), 'la pantalla de resumen puede citar en ese momento');
  const later = (await api('GET', `/api/sim/${out.id}`)).data.sim;
  assert.ok(!JSON.stringify(later.summary).includes(secret));
  assert.equal(later.turns.length, 0);
  assert.ok(later.summary.improvements.length > 0, 'las recomendaciones se conservan');
  for (const row of [
    ...app.db.prepare('SELECT summary s, state t FROM sim_sessions').all(),
    ...app.db.prepare('SELECT state s, state t FROM daily_sessions').all(),
  ]) {
    assert.ok(!String(row.s).includes(secret), 'nada en la base');
    assert.ok(!String(row.t).includes(secret), 'nada en la base');
  }
  const daily = (await api('GET', '/api/daily')).data.session;
  assert.ok(daily.steps.improve.items.every((i) => !('yours' in i)));
  await app.stop();
});

test('privacidad: con permiso se guarda la cita, y se puede quitar sin perder resultados', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('POST', '/api/settings', { keepTranscripts: true });
  const secret = 'Zebra salad secret words for table';
  const lines = models('table_for_two');
  lines[0] = `The fries ${secret}`;
  const out = await finishWith(api, 'table_for_two', lines);
  assert.ok(JSON.stringify((await api('GET', `/api/sim/${out.id}`)).data.sim).includes(secret));
  assert.equal((await api('GET', '/api/profile')).data.storedQuotes, 1);
  await api('POST', '/api/settings', { keepTranscripts: false });
  assert.ok(!JSON.stringify((await api('GET', `/api/sim/${out.id}`)).data.sim.summary).includes(secret), 'al retirar el permiso deja de mostrarse');
  await api('POST', '/api/privacy/remove-quotes');
  assert.ok(!app.db.prepare('SELECT summary s FROM sim_sessions').get().s.includes(secret));
  assert.equal((await api('GET', `/api/sim/${out.id}`)).data.sim.outcome, 'completed', 'el resultado sigue');
  await app.stop();
});

test('simulacion abandonada: se cierra y sus turnos no se quedan', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { sim } = (await api('POST', '/api/sim', { scenarioId: 'table_for_two', mode: 'demo' })).data;
  await api('POST', `/api/sim/${sim.id}/turn`, { text: 'Zebra salad secret words', source: 'text' });
  app.clockBox.now += 2 * 24 * 60 * 60 * 1000;
  await api('GET', '/api/today');
  const row = app.db.prepare('SELECT status, outcome, state FROM sim_sessions WHERE id=?').get(sim.id);
  assert.equal(row.status, 'finished');
  assert.equal(row.outcome, 'attempted');
  assert.ok(!row.state.includes('Zebra'));
  await app.stop();
});

test('catalogo paginado: busca en ingles y espanol, filtra, y no envia todo de golpe', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const all = (await api('GET', '/api/vocab?view=todas')).data;
  assert.ok(all.total >= 600);
  assert.equal(all.entries.length, 30);
  assert.ok(!('phrase' in all.entries[0]), 'la lista viaja ligera');
  assert.ok((await api('GET', '/api/vocab?view=todas&q=camaron')).data.entries.some((e) => e.id === 'sd_shrimp'), 'sin acentos');
  assert.ok((await api('GET', '/api/vocab?view=todas&q=shrimp')).data.total >= 1);
  const cat = encodeURIComponent('Desayuno y brunch');
  const filtered = (await api('GET', `/api/vocab?view=todas&category=${cat}&difficulty=2`)).data;
  assert.ok(filtered.total > 0);
  assert.ok(filtered.entries.every((e) => e.difficulty === 2 && e.category === 'Desayuno y brunch'));
  assert.equal((await api('GET', '/api/vocab?view=hoy')).data.total, 5, 'cinco nuevas por defecto');
  await api('POST', '/api/settings', { dailyNew: 7 });
  app.clockBox.now += 86400000;
  assert.equal((await api('GET', '/api/vocab?view=hoy')).data.total, 7, 'ajustable');
  assert.equal((await api('POST', '/api/settings', { dailyNew: 99 })).status, 400);
  await app.stop();
});

test('la sesion diaria no revela respuestas y conserva su duracion', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { session } = (await api('GET', '/api/daily')).data;
  const text = JSON.stringify(session.steps);
  for (const f of ['"accept"', '"answer"', '"reply"', '"intents"', '"required"', '"details"']) assert.ok(!text.includes(f), f);
  assert.equal(session.steps.review.exercises.length, 5);
  assert.equal(session.steps.learn.exercises.length, 5);
  await app.stop();
});

test('diagnostico por API: segunda ronda, explicacion y punto de partida ajustable', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const r2 = await api('POST', '/api/diagnostic', { round: 2, answers: {} });
  assert.equal(r2.status, 400, 'no se salta la primera ronda');
  const { DIAGNOSTIC } = await import('../content/diagnostic.js');
  const answers = (round) => Object.fromEntries(DIAGNOSTIC.filter((q) => q.round === round).map((q) => [q.id, q.answer ?? q.spec.reply]));
  const one = (await api('POST', '/api/diagnostic', { round: 1, answers: answers(1), meta: { c1: 'read' } })).data.result;
  assert.equal(one.needsRound2, true);
  assert.equal(one.comprehensionBasis, 'read');
  assert.equal((await api('GET', '/api/diagnostic?round=2')).data.questions.length, 6);
  const two = (await api('POST', '/api/diagnostic', { round: 2, answers: answers(2) })).data.result;
  assert.notEqual(two.placementUnit, 1);
  const moved = (await api('POST', '/api/placement', { unit: 3 })).data.user;
  assert.equal(moved.placementUnit, 3);
  assert.equal(moved.placementSource, 'manual');
  assert.equal((await api('POST', '/api/placement', { unit: 99 })).status, 400);
  await app.stop();
});

test('migracion: la base v1 conserva progreso, respalda antes y es idempotente', () => {
  const dir = mkdtempSync(join(tmpdir(), 'e47-mig-'));
  const path = join(dir, 'old.db');
  const summary = { didWell: 'Bien: dijiste «hello there».', improvements: [{ yours: 'hello there', corrected: 'x', alternative: 'y', why: 'z' }], criteria: [{ id: 'a', es: 'A', met: true }, { id: 'b', es: 'B', met: true }, { id: 'c', es: 'C', met: false }] };
  const old = new DatabaseSync(path);
  old.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, timezone TEXT NOT NULL DEFAULT 'America/New_York', help_mode TEXT NOT NULL DEFAULT 'help', sound_on INTEGER NOT NULL DEFAULT 1, keep_transcripts INTEGER NOT NULL DEFAULT 0, shields INTEGER NOT NULL DEFAULT 0, equipped TEXT NOT NULL DEFAULT '{}', placement_unit INTEGER NOT NULL DEFAULT 1, diagnostic_status TEXT NOT NULL DEFAULT 'pending', diagnostic_result TEXT, created_at TEXT NOT NULL);
    CREATE TABLE sim_sessions (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, scenario_id TEXT NOT NULL, mode TEXT NOT NULL, help_mode TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', state TEXT NOT NULL, summary TEXT, comfort INTEGER, created_at TEXT NOT NULL, finished_at TEXT);
    CREATE TABLE lesson_progress (user_id INTEGER NOT NULL, lesson_id TEXT NOT NULL, completed_at TEXT NOT NULL, times INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (user_id, lesson_id));
    CREATE TABLE reward_events (user_id INTEGER NOT NULL, key TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, coins INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY (user_id, key));
    CREATE TABLE streak_days (user_id INTEGER NOT NULL, local_date TEXT NOT NULL, status TEXT NOT NULL, full_done INTEGER NOT NULL DEFAULT 0, brief_done INTEGER NOT NULL DEFAULT 0, completed_at TEXT NOT NULL, PRIMARY KEY (user_id, local_date));
    INSERT INTO users (id, username, display_name, password_hash, role, shields, created_at) VALUES (1, 'ana', 'Ana', 'x', 'student', 2, '2026-11-01');
    INSERT INTO reward_events VALUES (1, 'sim:table_for_two:2026-11-01', 20, 0, '2026-11-01'), (1, 'day:2026-11-01', 0, 20, '2026-11-01');
    INSERT INTO streak_days VALUES (1, '2026-11-01', 'practiced', 1, 0, '2026-11-01');
    INSERT INTO lesson_progress VALUES (1, 'u1l1', '2026-11-01', 2);
  `);
  old.prepare(`INSERT INTO sim_sessions (user_id, scenario_id, mode, help_mode, status, state, summary, created_at) VALUES (1, 'table_for_two', 'demo', 'help', 'finished', '{"turns":[],"met":[],"beat":0,"done":true}', ?, '2026-11-01')`).run(JSON.stringify(summary));
  old.close();

  const db = openDb(path);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  assert.equal(db.prepare('SELECT SUM(xp) x FROM reward_events').get().x, 20, 'XP intacta');
  assert.equal(db.prepare('SELECT SUM(coins) x FROM reward_events').get().x, 20, 'monedas intactas');
  assert.equal(db.prepare('SELECT shields FROM users').get().shields, 2);
  assert.equal(db.prepare('SELECT daily_new d FROM users').get().d, 5);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM streak_days').get().n, 1);
  assert.equal(db.prepare('SELECT times FROM lesson_progress').get().times, 2);
  const sim = db.prepare('SELECT outcome, has_quotes, summary FROM sim_sessions').get();
  assert.equal(sim.outcome, 'completed', '2 de 3 criterios no alcanzan para resuelto');
  assert.equal(sim.has_quotes, 1, 'marca las citas antiguas sin borrarlas');
  assert.ok(sim.summary.includes('hello there'), 'no se borra nada sin que el alumno lo pida');
  db.close();
  assert.ok(readdirSync(dir).some((f) => f.includes('respaldo-v0')), 'copia previa');
  const again = openDb(path);
  assert.equal(again.prepare('SELECT COUNT(*) n FROM sim_sessions').get().n, 1, 'reabrir no cambia nada');
  assert.equal(readdirSync(dir).filter((f) => f.includes('respaldo')).length, 1, 'no crea otra copia');
  again.close();
  assert.ok(existsSync(path));
  rmSync(dir, { recursive: true, force: true });
});
