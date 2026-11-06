// Fallos reproducidos por la revision externa antes del piloto, y sus causas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login, correctAnswer } from './helpers.js';
import { checkAnswer } from '../server/exercises.js';
import { assessOpen, findViolation, isSubstantive, looksLikeNonsense } from '../server/evaluate.js';
import { checkOrder } from '../server/order.js';
import { VOCAB, VOCAB_BY_ID } from '../content/vocab.js';
import { SCENARIOS, SCENARIO_BY_ID } from '../content/scenarios.js';
import { CATEGORIES } from '../content/categories.js';
import { DIAGNOSTIC, scoreDiagnostic } from '../content/diagnostic.js';
import { ALT_AUDIT } from '../content/vocab/audit.js';

const recall = (id, text) => checkAnswer({ type: 'recall', vocabId: id }, text);
const models = (id) => SCENARIO_BY_ID.get(id).beats.map((b) => b.model);
const perfect = (round) => Object.fromEntries(DIAGNOSTIC.filter((q) => q.round === round).map((q) => [q.id, q.answer ?? q.spec.reply]));

async function play(api, scenarioId, lines, helpMode = 'work') {
  const { sim } = (await api('POST', '/api/sim', { scenarioId, mode: 'demo', helpMode })).data;
  for (let i = 0; i < lines.length; i++) {
    await api('POST', `/api/sim/${sim.id}/turn`, { text: lines[i], source: 'text', requestId: `q${i}` });
  }
  return { id: sim.id, ...(await api('POST', `/api/sim/${sim.id}/finish`)).data };
}

test('A. una duda sobre otra cosa no excusa una garantia', () => {
  const spec = { reply: 'x', required: ['check_kitchen'] };
  const bad = 'I am not sure about the price. It is totally safe; let me check with the kitchen.';
  const r = assessOpen(bad, spec);
  assert.equal(r.correct, false);
  assert.equal(r.dims.goal, 'violated');
  assert.ok(findViolation(bad));
  assert.ok(findViolation("I'm not sure about the wine, but it is safe for you."));
  assert.equal(findViolation("I'm not sure it is safe, so I will ask the chef."), null);
  assert.equal(findViolation("I can't guarantee it is safe."), null);
  assert.equal(findViolation('That sauce is not safe for you, let me ask.'), null);
});

test('A. una garantia no resuelve la simulacion de alergias', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const lines = models('nut_allergy');
  lines[2] = 'I am not sure about the price. It is totally safe; let me check with the kitchen.';
  const out = await play(api, 'nut_allergy', lines);
  assert.equal(out.sim.summary.criticalMet, false);
  assert.notEqual(out.sim.outcome, 'resolved');
  await app.stop();
});

test('B. una orden equivocada no se resuelve por nombrar los platos', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const out = await play(api, 'table_of_three', [
    'Please bring a salad.',
    'Just to confirm, medium.',
    'Let me confirm: a burger with onions and fries, a ribeye well done, and linguine with shrimp.',
  ]);
  assert.notEqual(out.sim.outcome, 'resolved');
  const c = Object.fromEntries(out.sim.summary.criteria.map((x) => [x.id, x.met]));
  assert.equal(c.mods, false);
  assert.equal(c.confirm, false);
  const right = await play(api, 'table_of_three', models('table_of_three'));
  assert.equal(right.sim.outcome, 'resolved');
  await app.stop();
});

const THREE = SCENARIO_BY_ID.get('table_of_three').beats[2].check;

test('B. orden estructurada: cada dato con su plato y el estado final', () => {
  const ok = (text) => checkOrder(text, THREE).ok;
  assert.ok(ok('Let me confirm: a burger with no onions and a salad, a ribeye medium, and the linguine with chicken instead of shrimp.'));
  assert.ok(ok('One burger without onions, salad instead of fries. One ribeye, medium. One chicken linguine.'), 'otra redaccion valida');
  assert.ok(!ok('A burger with onions and a salad, a ribeye medium, and the linguine with chicken.'), 'lleva cebolla');
  assert.ok(!ok('A burger with no onions and fries, a ribeye medium, and the linguine with chicken.'), 'lleva papas');
  assert.ok(!ok('A burger with no onions and a salad, a ribeye medium well, and the linguine with chicken.'), 'termino');
  assert.ok(!ok('A burger with no onions and a salad, a ribeye medium, and the linguine with shrimp.'), 'camarones');
  assert.ok(!ok('A burger and a salad, a ribeye medium with no onions, and the linguine with chicken.'), 'modificacion en el plato equivocado');
  assert.ok(!ok('A ribeye medium and the linguine with chicken.'), 'falta un plato');
  assert.ok(ok('A burger with no onions and a salad, a ribeye medium well, no wait, medium, and the linguine with chicken.'), 'cambio de opinion: manda lo ultimo');
  assert.ok(!ok('A burger with no onions and a salad, a ribeye medium, actually well done, and the linguine with chicken.'));
  const two = { items: [{ label: 'los tacos', names: ['tacos'], qty: 2 }] };
  assert.ok(checkOrder('two tacos', two).ok);
  assert.ok(!checkOrder('three tacos', two).ok, 'cantidad');
});

test('B. diagnostico: una contradiccion del termino no es correcta', () => {
  const r1 = scoreDiagnostic(perfect(1), { round: 1 });
  const good = scoreDiagnostic(perfect(2), { round: 2, previous: r1 });
  assert.equal(good.skills.expression.correct, 5);
  const bad = scoreDiagnostic({ ...perfect(2), e5: 'Let me confirm: one ribeye medium rare, actually well done, with asparagus, and Caesar with dressing on the side.' }, { round: 2, previous: r1 });
  assert.equal(bad.skills.expression.correct, 4);
  assert.ok(bad.recommended.some((x) => x.unit === 4));
});

test('C. equivalencias falsas: no se aceptan y se explican', () => {
  for (const [id, wrong] of [['ch_merchant', 'customer copy'], ['br_hash_browns', 'home fries'], ['si_broccoli', 'broccoli'], ['dairy', 'lactose'], ['shellfish', 'shrimp'], ['tree_nuts', 'peanuts'], ['mt_t_bone', 'porterhouse']]) {
    const r = recall(id, wrong);
    assert.equal(r.correct, false, `${id}: ${wrong}`);
    assert.ok(r.feedback.change, `${id}: sin explicacion`);
  }
  assert.equal(recall('shellfish', 'shrimp').status, 'close', 'un ejemplo no se trata como error grave');
  assert.equal(recall('dairy', 'lactose').status, 'close');
  assert.equal(recall('ch_merchant', 'customer copy').status, 'review');
});

test('C. datos del catalogo: alternativas, relacionados y contrastes no se mezclan', () => {
  for (const v of VOCAB) {
    const alts = new Set(v.alts.map((a) => a.toLowerCase()));
    for (const other of [...v.related, ...v.examples, ...v.contrasts.map((c) => c.wrong)]) {
      assert.ok(!alts.has(other.toLowerCase()), `${v.id}: ${other} sigue como alternativa`);
    }
    for (const c of v.contrasts) assert.ok(c.why?.length > 10, `${v.id}: contraste sin explicacion`);
    for (const a of v.alts) assert.equal(recall(v.id, a).correct, true, `${v.id}: ${a}`);
  }
  assert.ok(Object.keys(ALT_AUDIT).length > 80);
  assert.ok(!VOCAB.some((v) => 'confusions' in v));
});

test('D. erratas: una palabra distinta no se premia; un error de tecleo si', () => {
  assert.equal(recall('fried', 'dried').correct, false);
  assert.equal(recall('still_water', 'spill water').correct, false);
  assert.equal(recall('grilled', 'not really actually ever grilled').correct, false);
  assert.equal(recall('grilled', 'grilld').correct, true);
  assert.equal(recall('grilled', 'grillde').correct, true, 'letras cambiadas de lugar');
  assert.equal(recall('still_water', 'stil water').status, 'correct', 'stil no es una palabra; still pierde una letra');
  assert.notEqual(recall('still_water', 'steel water').status, 'correct');
});

test('D. no se confunde una pregunta directa con una subordinada', () => {
  const spec = { reply: 'What would you like to drink?', intents: ['offer_help'] };
  const good = assessOpen('Please let me know what you want to drink.', spec);
  assert.equal(good.dims.grammar, 'none_detected');
  assert.equal(good.dims.courtesy, 'ok');
  assert.equal(good.correct, true);
  const direct = assessOpen('What you want to drink?', { ...spec, targets: ['to drink'] });
  assert.equal(direct.dims.grammar, 'issue');
  assert.equal(direct.correct, false);
  assert.equal(assessOpen('If you want, I can bring more water.', { reply: 'x', intents: ['bring_soon', 'offer_help'], targets: ['bring more water'] }).dims.courtesy, 'ok');
});

test('E. leccion: repetir la misma peticion no agrega evidencia, errores ni logros', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const l = (await api('GET', '/api/lesson/u1l1')).data;
  const idx = l.exercises.findIndex((e) => e.type === 'recall');
  const ex = l.exercises[idx];
  const answer = VOCAB_BY_ID.get(ex.vocabId).en;
  const send = (a, extra = {}) => api('POST', '/api/lesson/u1l1/answer', { index: idx, answer: a, ...extra });
  const first = (await send(answer)).data;
  assert.equal(first.result.correct, true);
  for (let i = 0; i < 3; i++) {
    const again = (await send(answer)).data;
    assert.equal(again.duplicate, true);
    assert.equal(again.result.correct, true);
  }
  const row = () => app.db.prepare('SELECT used_count, lapses FROM vocab_progress WHERE vocab_id=?').get(ex.vocabId);
  assert.equal(row().used_count, 1);
  const ach = () => Boolean(app.db.prepare(`SELECT 1 FROM achievements WHERE key='retried_phrase'`).get());
  assert.equal(ach(), false);
  await send(answer, { retry: true });
  assert.equal(row().used_count, 1, 'una respuesta ya correcta no admite reintento');
  assert.equal(ach(), false);
  await app.stop();
});

test('E. leccion: el reintento explicito cuenta una vez; reenviarlo no', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const l = (await api('GET', '/api/lesson/u1l2')).data;
  const idx = l.exercises.findIndex((e) => e.type === 'recall');
  const ex = l.exercises[idx];
  const send = (a, extra = {}) => api('POST', '/api/lesson/u1l2/answer', { index: idx, answer: a, ...extra });
  await send('the fries are good');
  await send('the fries are good');
  const row = () => app.db.prepare('SELECT used_count, lapses FROM vocab_progress WHERE vocab_id=?').get(ex.vocabId);
  assert.equal(row().lapses, 1);
  await send('the fries are good', { retry: true });
  assert.equal(row().lapses, 1, 'reintento identico: es un reenvio');
  const fixed = (await send(VOCAB_BY_ID.get(ex.vocabId).en, { retry: true })).data;
  assert.equal(fixed.result.correct, true);
  await send(VOCAB_BY_ID.get(ex.vocabId).en, { retry: true });
  assert.equal(row().used_count, 1);
  assert.equal(row().lapses, 1);
  await app.stop();
});

test('E. terminar dos veces una leccion no suma otra vuelta ni XP', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const l = (await api('GET', '/api/lesson/u1l4')).data;
  for (let i = 0; i < l.exercises.length; i++) await api('POST', '/api/lesson/u1l4/answer', { index: i, answer: correctAnswer(l.exercises[i], VOCAB_BY_ID) });
  const a = (await api('POST', '/api/lesson/u1l4/complete')).data;
  const b = (await api('POST', '/api/lesson/u1l4/complete')).data;
  assert.equal(a.xp, 10);
  assert.equal(b.xp, 0);
  assert.equal(b.duplicate, true);
  assert.equal(app.db.prepare('SELECT times FROM lesson_progress').get().times, 1);
  await app.stop();
});

test('E. diagnostico: reenviar una ronda no infla las puntuaciones', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('POST', '/api/diagnostic', { round: 1, answers: perfect(1) });
  const first = (await api('POST', '/api/diagnostic', { round: 2, answers: perfect(2) })).data.result;
  assert.equal(first.skills.vocabulary.total, 5);
  for (let i = 0; i < 2; i++) {
    const again = (await api('POST', '/api/diagnostic', { round: 2, answers: perfect(2) })).data.result;
    assert.equal(again.skills.vocabulary.total, 5);
    assert.equal(again.skills.comprehension.correct, 5);
    assert.equal(again.graded.length, 15);
  }
  await app.stop();
});

test('E. repaso libre y sesion diaria: doble toque y reenvio tras un corte', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const body = { exercise: { type: 'recall', vocabId: 'refill' }, answer: { text: 'refill' } };
  await api('POST', '/api/practice/answer', body);
  const dup = (await api('POST', '/api/practice/answer', body)).data;
  assert.equal(dup.duplicate, true);
  assert.equal(app.db.prepare(`SELECT used_count FROM vocab_progress WHERE vocab_id='refill'`).get().used_count, 1);

  const { session } = (await api('GET', '/api/daily')).data;
  const ex = session.steps.review.exercises;
  const req = () => api('POST', '/api/daily/answer', { step: 'review', index: 0, answer: correctAnswer(ex[0], VOCAB_BY_ID) });
  const [x, y] = await Promise.all([req(), req()]);
  assert.equal(x.status, 200);
  assert.equal(y.status, 200);
  assert.equal(Object.keys((await api('GET', '/api/daily')).data.session.steps.review.answers).length, 1);
  await api('POST', '/api/phrases', { en: 'Same phrase', es: 'x' });
  await api('POST', '/api/phrases', { en: 'Same phrase', es: 'x' });
  assert.equal((await api('GET', '/api/vocab')).data.phrases.length, 1);
  await app.stop();
});

test('F. repetir palabras no completa, aunque existan en el vocabulario', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  assert.ok(looksLikeNonsense('water water water'));
  assert.ok(looksLikeNonsense('water water'));
  assert.ok(!isSubstantive('water'));
  assert.ok(isSubstantive('Would you like water?'));
  const out = await play(api, 'table_for_two', ['water water water', 'water water water', 'water water water']);
  assert.equal(out.rewards.xp, 0);
  assert.equal(out.sim.outcome, 'attempted');
  const related = await play(api, 'drinks_first', ['The water is good here', 'We have fresh water today', 'The tea is good too', 'It comes in a glass']);
  assert.equal(related.sim.outcome, 'completed', 'equivocarse con respuestas relacionadas si cuenta');
  assert.equal(related.rewards.xp, 20);
  await app.stop();
});

test('Palabras: se recorre todo el catalogo sin huecos ni duplicados', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const seen = [];
  for (let offset = 0; ; offset += 50) {
    const page = (await api('GET', `/api/vocab?view=todas&limit=50&offset=${offset}`)).data;
    assert.equal(page.total, VOCAB.length);
    seen.push(...page.entries.map((e) => e.id));
    if (page.entries.length < 50) break;
  }
  assert.equal(seen.length, VOCAB.length);
  assert.equal(new Set(seen).size, VOCAB.length);
  assert.deepEqual(new Set(seen), new Set(VOCAB.map((v) => v.id)));
  await app.stop();
});

test('Palabras: una entrada de cada categoria se encuentra en ingles y espanol', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const search = async (q) => (await api('GET', `/api/vocab?view=todas&limit=50&q=${encodeURIComponent(q)}`)).data;
  for (const cat of CATEGORIES) {
    const v = VOCAB.find((x) => x.category === cat && x.en.length > 3 && x.difficulty >= 1);
    for (const q of [v.en, v.es]) {
      const r = await search(q);
      assert.ok(r.entries.some((e) => e.id === v.id), `${cat}: ${q}`);
    }
  }
  const last = VOCAB[VOCAB.length - 1];
  assert.ok((await search(last.en)).entries.some((e) => e.id === last.id), 'las ultimas tambien');
  const a = await search('camaron');
  const b = await search('camarón');
  const c = await search('CAMARÓN');
  assert.ok(a.total >= 1);
  assert.deepEqual(a.entries.map((e) => e.id), b.entries.map((e) => e.id));
  assert.deepEqual(b.entries.map((e) => e.id), c.entries.map((e) => e.id));
  assert.equal((await search('zzzzznada')).total, 0);
  await app.stop();
});

test('Palabras: filtros combinados, contadores y paginacion con filtros', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const cat = CATEGORIES[3];
  const expected = VOCAB.filter((v) => v.category === cat && v.difficulty === 1);
  const url = (o) => `/api/vocab?view=todas&limit=5&offset=${o}&difficulty=1&category=${encodeURIComponent(cat)}`;
  const ids = [];
  for (let o = 0; o < expected.length; o += 5) {
    const page = (await api('GET', url(o))).data;
    assert.equal(page.total, expected.length);
    ids.push(...page.entries.map((e) => e.id));
  }
  assert.deepEqual(ids, expected.map((v) => v.id));
  const withQ = (await api('GET', `/api/vocab?view=todas&q=water&category=${encodeURIComponent(cat)}`)).data;
  assert.ok(withQ.entries.every((e) => e.category === cat));
  await api('POST', '/api/vocab/refill/favorite', { favorite: true });
  const fav = (await api('GET', '/api/vocab?view=favoritas&q=refill')).data;
  assert.equal(fav.total, 1);
  assert.equal((await api('GET', '/api/vocab?view=favoritas&q=zzz')).data.total, 0);
  await app.stop();
});

test('Palabras: favoritas persisten tras cerrar sesion y son de cada alumno', async () => {
  const app = await startApp();
  const ana = await login(app, 'ana');
  const beto = await login(app, 'beto');
  await ana('POST', '/api/vocab/sd_shrimp/favorite', { favorite: true });
  await ana('POST', '/api/auth/logout');
  await ana('POST', '/api/auth/login', { username: 'ana', password: 'password123' });
  assert.equal((await ana('GET', '/api/vocab/sd_shrimp')).data.entry.favorite, true);
  assert.equal((await beto('GET', '/api/vocab/sd_shrimp')).data.entry.favorite, false);
  await ana('POST', '/api/practice/answer', { exercise: { type: 'recall', vocabId: 'sd_shrimp' }, answer: 'wrong answer here' });
  assert.equal((await beto('GET', '/api/vocab/sd_shrimp')).data.entry.dueDate, null);
  await app.stop();
});

test('Palabras: abrir, escuchar o guardar no marca «la usé»; un fallo se programa', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('GET', '/api/vocab/refill');
  await api('POST', '/api/vocab/refill/favorite', { favorite: true });
  const a = (await api('GET', '/api/vocab/refill')).data.entry;
  assert.equal(a.used, false);
  assert.equal(a.recognized, false);
  assert.equal(a.dueDate, null, 'una palabra nueva no aparece como aprendida');
  const failed = (await api('POST', '/api/practice/answer', { exercise: { type: 'recall', vocabId: 'refill' }, answer: 'the fries are good' })).data;
  assert.equal(failed.result.reviewScheduled, true);
  const b = (await api('GET', '/api/vocab/refill')).data.entry;
  assert.ok(b.dueDate);
  assert.equal(b.pending, true);
  assert.match(b.pendingReason, /no salió/);
  await app.stop();
});

test('Palabras: una entrada inexistente responde 404 y la ficha trae todo lo necesario', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  assert.equal((await api('GET', '/api/vocab/no_existe')).status, 404);
  assert.equal((await api('GET', '/api/practice?vocab=no_existe')).status, 404);
  const e = (await api('GET', '/api/vocab/shellfish')).data.entry;
  for (const f of ['en', 'es', 'category', 'difficulty', 'guest', 'reply', 'phrase']) assert.ok(e[f], f);
  assert.deepEqual(e.examples, ['shrimp']);
  const practice = (await api('GET', '/api/practice?vocab=shellfish')).data.exercises;
  assert.equal(practice.length, 3);
  assert.ok(practice.every((x) => x.vocabId === 'shellfish' && !('expected' in x)));
  await app.stop();
});

test('Palabras: responde rapido con todo el catalogo', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const start = performance.now();
  for (const q of ['water', 'a', 'camarón', 'the']) await api('GET', `/api/vocab?view=todas&q=${encodeURIComponent(q)}`);
  assert.ok(performance.now() - start < 1500, 'cuatro busquedas en menos de 1,5 s');
  await app.stop();
});

test('catalogo corregido: una sesion en curso conserva su respuesta congelada', () => {
  const entry = VOCAB_BY_ID.get('refill');
  const ex = { type: 'listen_choose', vocabId: 'refill', options: ['texto anterior', 'otra'], expected: 'texto anterior' };
  assert.equal(checkAnswer(ex, 'texto anterior').correct, true);
  assert.notEqual(entry.es, 'texto anterior');
});

test('comentarios: se guardan, los ve la administracion y un reenvio no duplica', async () => {
  const app = await startApp();
  const ana = await login(app, 'ana');
  assert.equal((await ana('POST', '/api/feedback', { section: 'Palabras', trying: '', problem: '' })).status, 400);
  const body = { section: 'Palabras', trying: 'Buscar camarón', problem: 'No lo encontré', comment: 'nada urgente', requestId: 'r1' };
  assert.equal((await ana('POST', '/api/feedback', body)).status, 200);
  await ana('POST', '/api/feedback', body);
  assert.equal(app.db.prepare('SELECT COUNT(*) n FROM feedback').get().n, 1);
  assert.equal((await ana('GET', '/api/admin/overview')).status, 403);
  const { createInvitation } = await import('../server/auth.js');
  const { code } = await createInvitation(app.db, { role: 'admin' }, app.clockBox.now);
  const admin = app.client();
  await admin('POST', '/api/auth/redeem', { code, username: 'jefe', displayName: 'Jefe', password: 'password123' });
  const inbox = (await admin('GET', '/api/admin/overview')).data.feedback;
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].problem, 'No lo encontré');
  assert.equal(inbox[0].displayName, 'ana');
  await admin('POST', `/api/admin/feedback/${inbox[0].id}/status`, { status: 'done' });
  assert.equal((await admin('GET', '/api/admin/overview')).data.feedback[0].status, 'done');
  await app.stop();
});

test('Hoy: responde que hacer, cuanto llevo y que gane', async () => {
  const app = await startApp({ now: Date.parse('2026-11-05T17:00:00Z') });
  const api = await login(app, 'ana');
  const before = (await api('GET', '/api/today')).data;
  assert.deepEqual(before.stats.earnedToday, { xp: 0, coins: 0 });
  assert.equal(before.session.minimumMet, false);
  const { session } = (await api('POST', '/api/daily/brief')).data;
  for (let i = 0; i < session.brief.exercises.length; i++) {
    await api('POST', '/api/daily/answer', { step: 'brief', index: i, answer: correctAnswer(session.brief.exercises[i], VOCAB_BY_ID) });
  }
  const after = (await api('GET', '/api/today')).data;
  assert.equal(after.session.minimumMet, true);
  assert.equal(after.session.briefOnly, true);
  assert.equal(after.stats.earnedToday.coins, 20);
  assert.equal(after.stats.earnedToday.xp, 10);
  app.clockBox.now += 86400000;
  const tomorrow = (await api('GET', '/api/today')).data;
  assert.equal(tomorrow.stats.current, 1, 'la racha sigue al dia siguiente');
  assert.equal(tomorrow.session.minimumMet, false, 'el minimo de hoy vuelve a estar pendiente');
  assert.deepEqual(tomorrow.stats.earnedToday, { xp: 0, coins: 0 });
  await app.stop();
});

test('las simulaciones con orden exigen sus datos en la opcion modelo', () => {
  for (const s of SCENARIOS) {
    for (const b of s.beats.filter((x) => x.check)) {
      for (const text of [b.model, b.alt, b.options[0]]) {
        const r = checkOrder(text, b.check);
        assert.ok(r.ok, `${s.id}: «${text}» -> ${r.problems.join(' ')}`);
      }
      assert.ok(!checkOrder(b.options[1], b.check).ok, `${s.id}: la opcion floja pasa`);
    }
  }
});
