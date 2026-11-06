// Fallos reproducidos en la revision y sus causas: coincidencias por subcadena y palabras clave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, publicExercise } from '../server/exercises.js';
import { assessConfirm, assessFix, assessOpen, assessRephrase, looksLikeNonsense } from '../server/evaluate.js';
import { DIAGNOSTIC, publicDiagnostic, scoreDiagnostic } from '../content/diagnostic.js';

const recall = (vocabId, text) => checkAnswer({ type: 'recall', vocabId }, text);
const respond = (vocabId, text) => checkAnswer({ type: 'respond', vocabId }, text);

test('«side plate» no equivale a «side dish»', () => {
  const r = recall('side_dish', 'side plate');
  assert.equal(r.correct, false);
  assert.equal(r.status, 'review');
  assert.equal(recall('side_dish', 'side dish').correct, true);
  assert.equal(recall('side_dish', 'side').correct, true, 'la variante exacta vale');
  assert.equal(recall('side_dish', 'side salad').correct, false);
});

test('negaciones: decir lo contrario nunca es correcto', () => {
  assert.equal(recall('grilled', 'not grilled').correct, false);
  assert.equal(recall('grilled', 'not grilled').dims.meaning, 'contradiction');
  assert.equal(recall('grilled', 'grilled').correct, true);
  assert.equal(recall('grilled', 'it is grilled').correct, true);
  assert.equal(recall('take_your_time', "don't take your time").correct, false);
  assert.equal(recall('let_me_double_check', 'never let me double check').correct, false);
});

test('una errata pequena se acepta y se avisa; otra palabra no', () => {
  const typo = recall('grilled', 'grilld');
  assert.equal(typo.correct, true);
  assert.match(typo.feedback.change, /Ortografía/);
  assert.equal(recall('grilled', 'fried').correct, false);
});

test('palabras clave dentro de respuestas inadecuadas no cuentan', () => {
  const spec = { reply: 'Let me check with the kitchen.', required: ['check_kitchen'] };
  for (const bad of ['Do not ask the kitchen, it is safe', 'No need to check with the kitchen', 'It is totally safe, I promise']) {
    const r = assessOpen(bad, spec);
    assert.equal(r.correct, false, bad);
    assert.equal(r.status, 'review', bad);
    assert.equal(r.dims.goal, 'violated', bad);
  }
  const hedged = assessOpen("I can't guarantee it is safe, so let me check with the kitchen.", spec);
  assert.equal(hedged.correct, true, 'reconocer que no se puede garantizar es lo correcto');
});

test('respuestas absurdas: no cuentan como practica', () => {
  assert.ok(looksLikeNonsense('banana banana banana'));
  assert.ok(looksLikeNonsense('asdf qwer zxcv'));
  const r = respond('how_many', 'banana banana banana');
  assert.equal(r.correct, false);
  assert.equal(r.meaningful, false);
  assert.equal(looksLikeNonsense('Of course, let me check with the kitchen.'), false);
});

test('una palabra suelta no demuestra comprension', () => {
  const r = assessOpen('kitchen', { reply: 'Let me check with the kitchen.', intents: ['check_kitchen'], targets: ['kitchen'] });
  assert.equal(r.correct, false);
});

test('variantes profesionales validas se aceptan sin exigir la frase exacta', () => {
  const spec = { reply: 'Let me check with the kitchen.', required: ['check_kitchen'] };
  for (const good of ['Let me double-check with the chef and come right back.', 'I will ask the kitchen for you.', "I'm not sure, so I'll check with the cooks."]) {
    assert.equal(assessOpen(good, spec).correct, true, good);
  }
  const order = { reply: 'What would you like to order?', intents: ['offer_help', 'take_time'], targets: ['ready to order', 'like to order'] };
  assert.equal(assessOpen('Are you ready to order?', order).correct, true);
  assert.equal(assessOpen('What would you like to order?', order).correct, true);
});

test('cortesia y gramatica se separan del significado', () => {
  const spec = { reply: 'What would you like to order?', targets: ['want', 'like to order'], intents: ['offer_help'] };
  const blunt = assessOpen('What you want?', spec);
  assert.equal(blunt.correct, false);
  assert.equal(blunt.status, 'close');
  assert.equal(blunt.dims.courtesy, 'blunt');
  assert.equal(blunt.dims.meaning, 'ok');
  assert.ok(blunt.feedback.corrected);
  assert.ok(blunt.canRetry);
  const grammar = assessOpen('It come with one side, would you like fries?', { reply: 'It comes with one side.', intents: ['offer_help'] });
  assert.equal(grammar.dims.grammar, 'issue');
  assert.equal(grammar.status, 'close');
});

test('si las reglas no alcanzan dice «necesita revision», sin afirmar que esta mal', () => {
  const r = assessOpen('We have a lovely table near the window for your party tonight.', { reply: 'Do you have a reservation?', intents: ['ask_reservation'] });
  assert.equal(r.status, 'needs_review');
  assert.equal(r.correct, false);
  assert.equal(r.srs, 'none', 'no cuenta como fallo en el repaso');
  assert.equal(r.evaluated, 'local_rules');
});

test('retroalimentacion: comunica, cambia, corrige, alternativa y reintento', () => {
  const r = respond('how_many', 'How many people you are?');
  assert.ok(r.feedback.communicated);
  assert.ok(r.feedback.change);
  assert.ok(r.feedback.corrected);
  assert.ok(r.feedback.natural);
  assert.equal(r.canRetry, true);
});

test('nunca se informa una evaluacion de pronunciacion', () => {
  const r = checkAnswer({ type: 'repeat', text: 'Right this way, please.' }, { recordedMs: 2000 });
  assert.equal(r.evaluated, 'none');
  assert.match(r.note, /No evaluamos pronunciación/);
  assert.ok(!('pronunciationScore' in r));
});

test('confirmar una orden exige cada detalle, sin negarlo', () => {
  const spec = { reply: 'One ribeye, medium rare.', alt: 'x', details: [{ label: 'ribeye', any: ['ribeye'] }, { label: 'el término', any: ['medium rare'] }, { label: 'el aderezo aparte', any: ['on the side'] }] };
  assert.equal(assessConfirm('One ribeye medium rare with dressing on the side', spec).correct, true);
  const partial = assessConfirm('One ribeye medium rare', spec);
  assert.equal(partial.status, 'close');
  assert.match(partial.feedback.change, /aderezo/);
  assert.equal(assessConfirm('One ribeye, not medium rare, dressing on the side', spec).correct, false);
});

test('corregir un error: el error no puede seguir, y otra formulacion se revisa', () => {
  const spec = { accept: ['It comes with one side.'], bad: ['it come with'], why: 'Con it, el verbo lleva -s.' };
  assert.equal(assessFix('It comes with one side', spec).correct, true);
  assert.equal(assessFix('It come with one side', spec).status, 'review');
  assert.equal(assessFix('You get one side with it', spec).status, 'needs_review');
});

test('reformular: la misma frase brusca no vale', () => {
  const spec = { text: 'What you want?', reply: 'What would you like?', alt: 'x', intents: ['offer_help'] };
  assert.equal(assessRephrase('What you want', spec).correct, false);
  assert.equal(assessRephrase('What would you like tonight?', spec).correct, true);
});

test('el ejercicio publico nunca revela la respuesta', () => {
  const ex = { type: 'best_choice', prompt: 'x', options: ['a', 'b'], reasons: ['r1', 'r2'], answer: 'a', reason: 'r1', why: 'porque' };
  const pub = publicExercise(ex);
  for (const f of ['answer', 'reason', 'why']) assert.ok(!(f in pub), f);
  const rec = publicExercise({ type: 'respond', guest: 'x', reply: 'y', alt: 'z', required: ['confirm'] });
  for (const f of ['reply', 'alt', 'required']) assert.ok(!(f in rec), f);
});

const perfect = (round) => Object.fromEntries(DIAGNOSTIC.filter((q) => q.round === round).map((q) => [q.id, q.answer ?? q.spec.reply]));

test('diagnostico: todo correcto no recomienda la unidad 1 y abre la segunda ronda', () => {
  const r1 = scoreDiagnostic(perfect(1), { round: 1 });
  assert.equal(r1.needsRound2, true);
  assert.notEqual(r1.placementUnit, 1);
  const r2 = scoreDiagnostic(perfect(2), { round: 2, previous: r1 });
  assert.equal(r2.needsRound2, false);
  assert.equal(r2.confident, true);
  assert.notEqual(r2.placementUnit, 1);
  assert.equal(r2.skills.expression.correct, 5);
  assert.ok(r2.recommended.every((x) => x.why.length > 20));
});

test('diagnostico: recomienda por tema fallado y explica por que', () => {
  const answers = { ...perfect(1), c1: 'La cuenta', v2: 'come' };
  const r = scoreDiagnostic(answers, { round: 1 });
  assert.equal(r.needsRound2, false);
  assert.equal(r.placementUnit, 3);
  assert.deepEqual(r.recommended.map((x) => x.unit), [3, 4]);
  assert.equal(r.skills.comprehension.correct, 2);
  assert.equal(r.skills.vocabulary.correct, 2);
});

test('diagnostico de alergias: no puntua por palabra clave ni acepta garantias', () => {
  for (const bad of ['Do not ask the kitchen, it is safe', 'It is safe, kitchen check not needed', 'kitchen']) {
    const r = scoreDiagnostic({ ...perfect(1), e2: bad }, { round: 1 });
    assert.equal(r.skills.expression.correct, 2, bad);
    assert.ok(r.recommended.some((x) => x.unit === 5), bad);
  }
  const good = scoreDiagnostic({ ...perfect(1), e2: "I'm not sure. Let me check with the kitchen." }, { round: 1 });
  assert.equal(good.skills.expression.correct, 3);
});

test('diagnostico: identifica si la comprension se respondio leyendo', () => {
  const heard = scoreDiagnostic(perfect(1), { round: 1, meta: { c1: 'audio', c2: 'audio', c3: 'audio' } });
  assert.equal(heard.comprehensionBasis, 'audio');
  const read = scoreDiagnostic(perfect(1), { round: 1, meta: { c1: 'audio', c2: 'read', c3: 'audio' } });
  assert.equal(read.comprehensionBasis, 'read');
  assert.equal(scoreDiagnostic(perfect(1), { round: 1 }).comprehensionBasis, 'unknown');
});

test('el diagnostico publico no expone respuestas', () => {
  for (const round of [1, 2]) {
    for (const q of publicDiagnostic(round)) {
      assert.ok(!('answer' in q) && !('spec' in q), q.id);
    }
  }
});
