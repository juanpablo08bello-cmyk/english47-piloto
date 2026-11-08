import test from 'node:test';
import assert from 'node:assert/strict';
import { constructionScore, grammarIssues } from '../server/construccion.js';
import { assessedResult, gameSentences, openTurnResult, pronunciationScore, replyResult, starsFor } from '../server/practice.js';
import { VIP_BY_ID } from '../content/diccionario.js';

test('Ordena la frase: frases reales, cortas, bien armadas y con palabras del tema cuando se puede', () => {
  const table = VIP_BY_ID.get('desayuno');
  for (let i = 0; i < 30; i++) {
    const s = gameSentences(table, table.rows.slice(i % 20, (i % 20) + 6));
    assert.equal(s.length, 2);
    for (const x of s) {
      const n = x.en.split(/\s+/).length;
      assert.ok(n >= 4 && n <= 8 && x.es, x.en);
      assert.deepEqual(grammarIssues(x.en), [], x.en);
    }
  }
  assert.ok(['armar-frases', 'quejas', 'desayuno', 'servicio'].every((id) => VIP_BY_ID.get(id).rows.length >= 20), 'tablas nuevas completas');
});

const word = (w, accuracy = 95, error = 'None') => ({ word: w, accuracy, error });
const words = (text, acc = 95) => text.toLowerCase().replace(/[^a-z' ]/g, '').split(' ').filter(Boolean).map((w) => word(w, acc));

test('construcción: las frases correctas no reciben errores inventados', () => {
  const good = [
    'Of course. Here is your check.', 'Would you like something to drink?', 'What would you like to order?', 'Does it come with fries?',
    'I will bring it right away.', 'Let me check with the kitchen.', 'It is like a soup.', 'Is my table ready?', 'Is everything okay?',
    'Can I get you anything else?', 'He has a reservation.', 'She does not eat meat.', 'Do you have any allergies?', 'Did you enjoy your meal?',
    'We are ready to order.', 'You are welcome.', 'Here are your drinks.', 'Make it work.', 'Is a table available for two?',
    'An appetizer for the table?', 'It depends on the size.', 'How much is it?', 'I want you to try this.', 'What I recommend is the steak.',
    'Can I bring you the check?', 'Let me check.', 'Should I call the manager?', 'Do you need a box?', 'I need to check that.', 'Right here your table.',
  ];
  for (const s of good) assert.deepEqual(grammarIssues(s), [], s);
});

test('construcción: detecta los errores típicos de quien habla español y explica cada uno', () => {
  const bad = {
    'Here your check.': 'here-is', 'What you want to drink?': 'question-do', 'I am agree.': 'be-base', 'He have a reservation.': 'has',
    "She don't eat meat.": 'doesnt', 'Can I to help you?': 'modal-to', 'Did you liked the food?': 'did-base', 'I no have that.': 'no-not',
    'Is ready.': 'no-subject', 'People is waiting.': 'people', 'This is more cheap.': 'comparative', 'Explain me the menu.': 'to-me',
    'I want that you try this.': 'want-that', 'Do you want something for drink?': 'for-to', 'A appetizer?': 'a-an', 'The your table is ready.': 'the-poss',
    'What you would like?': 'question-order', 'He want a coffee.': 'third-s', 'They has a table.': 'no-s', 'Here is check.': 'article', 'I bring the check.': 'future',
  };
  for (const [s, id] of Object.entries(bad)) {
    const found = grammarIssues(s);
    assert.ok(found.some((x) => x.id === id), `${s}: esperaba ${id}, vio ${found.map((x) => x.id)}`);
    assert.ok(found.every((x) => x.es.length > 8), 'cada error se explica en español');
  }
});

test('construcción: cerca de un modelo se revisa pieza por pieza; una frase propia bien armada también vale', () => {
  const models = ['Of course. Here is your check.', 'Sure. Here you go. No rush.'];
  assert.equal(constructionScore('Of course. Here is your check.', models).score, 100);
  const missing = constructionScore('Of course. Here your check.', models);
  assert.ok(missing.score < 90 && missing.issues.length);
  const order = constructionScore('Of course here check your.', models);
  assert.ok(order.issues.some((x) => x.id === 'order'));
  const own = constructionScore('No problem, I will bring the check.', models);
  assert.ok(own.own && own.score >= 90, 'otra frase correcta no se castiga');
  const short = constructionScore('Check.', models);
  assert.ok(short.score <= 70, 'una sola palabra no es una frase');
});

test('pronunciación: usa cada dimensión y una palabra muy mal dicha pone techo', () => {
  const clean = pronunciationScore({ accuracy: 96, fluency: 95, prosody: 92, completeness: 100, words: words('here is your check') }, { scripted: true });
  assert.ok(clean >= 90);
  const flat = pronunciationScore({ accuracy: 96, fluency: 95, prosody: 60, completeness: 100, words: words('here is your check') }, { scripted: true });
  assert.ok(flat < clean - 8, 'sin entonación natural baja la nota');
  const oneBad = pronunciationScore({ accuracy: 92, fluency: 95, prosody: 90, words: [word('here'), word('is'), word('your'), word('check', 35, 'Mispronunciation')] }, { scripted: true });
  assert.ok(oneBad <= 70);
  const incomplete = pronunciationScore({ accuracy: 95, fluency: 95, prosody: 90, completeness: 60, words: words('here is') }, { scripted: true });
  assert.ok(incomplete < 80, 'leer la mitad no es leerla bien');
});

test('estrellas: las 5 piden frase bien armada Y buena voz', () => {
  assert.equal(starsFor(95, { build: 100, pron: 95 }), 5);
  assert.equal(starsFor(95, { build: 100, pron: 86 }), 4, 'voz floja: no hay 5');
  assert.equal(starsFor(95, { build: 88, pron: 100 }), 4, 'frase floja: no hay 5');
  assert.equal(starsFor(95, { build: 100, pron: 100, grammar: 1 }), 4, 'con un error de gramática no hay 5');
  assert.equal(starsFor(95, { build: 100, pron: 0, measured: false }), 4, 'sin medir la voz no hay 5');
});

test('turno libre: la gramática pesa tanto como la pronunciación', () => {
  const step = { say: { en: 'Of course. Here is your check.', alts: ['Of course. Here is your check.', 'Sure. Here you go. No rush.', 'Absolutely. I have your check right here.'] } };
  const azure = (text, acc = 95, prosody = 92) => ({ text, lexical: text.toLowerCase().replace(/[.,!?]/g, ''), score: acc, accuracy: acc, fluency: 95, prosody, words: words(text, acc) });
  const perfect = openTurnResult(step, { assessment: azure('Of course, here is your check.') });
  assert.equal(perfect.stars, 5);
  assert.ok(perfect.parts.frase >= 90 && perfect.parts.voz >= 88);
  const broken = openTurnResult(step, { assessment: azure('Of course, here your check.') });
  assert.ok(broken.stars <= 4, 'bien pronunciada pero mal armada no llega a 5');
  assert.ok(broken.issues.length, 'y dice por qué');
  // Caso real de la calibración con Azure: frase propia, correcta y sobre el tema → vale las 5.
  const withGuest = { ...step, guest: { en: 'Excuse me, can we get the check?' } };
  const own = openTurnResult(withGuest, { assessment: azure('No problem, I will bring the check right away.') });
  assert.equal(own.matched, true);
  assert.equal(own.stars, 5, 'con sus palabras, bien armada y bien dicha');
  const spanglish = openTurnResult(step, { assessment: azure('Yes, I bring the check now.') });
  assert.ok(spanglish.stars <= 4 && spanglish.issues.some((x) => x.id === 'future'));
  const accent = openTurnResult(step, { assessment: azure('Of course, here is your check.', 72, 55) });
  assert.ok(accent.stars <= 3, 'bien armada pero difícil de entender: tampoco');
});

test('lectura guiada y Pronunciar usan el mismo criterio', () => {
  const r = assessedResult('Here is your check.', { text: 'Here is your check.', lexical: 'here is your check', score: 96, accuracy: 96, fluency: 96, prosody: 93, completeness: 100, words: words('here is your check', 96) });
  assert.equal(r.stars, 5);
  const half = assessedResult('Here is your check.', { text: 'Here is', lexical: 'here is', score: 60, accuracy: 95, fluency: 90, prosody: 85, completeness: 50, words: [...words('here is'), word('your', 0, 'Omission'), word('check', 0, 'Omission')] });
  assert.ok(half.stars <= 3);
  const current = { sample: 'Yes, I am. How are you doing tonight?', need: [['yes']] };
  const off = replyResult(current, { assessment: { text: 'I like pizza.', lexical: 'i like pizza', score: 96, accuracy: 96, fluency: 96, prosody: 93, words: words('i like pizza') } });
  assert.ok(off.stars <= 2, 'si no responde lo que se pidió, la buena voz no basta');
});
