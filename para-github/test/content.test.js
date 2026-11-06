import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VOCAB, VOCAB_BY_ID } from '../content/vocab.js';
import { LESSONS, UNITS, CATEGORIES } from '../content/units.js';
import { SCENARIOS, SCENARIO_BY_ID } from '../content/scenarios.js';
import { MENU } from '../content/menu.js';
import { DIAGNOSTIC } from '../content/diagnostic.js';
import { INTENTS, politenessNote } from '../server/evaluate.js';
import { checkAnswer, prepareAuthored, publicExercise, seededRng } from '../server/exercises.js';
import { lessonExercises } from '../server/lessons.js';
import { normalize, tokens, findPhrase } from '../server/text.js';

test('catalogo: objetivos minimos frente a la base registrada', () => {
  assert.equal(UNITS.length, 8);
  for (const u of UNITS) assert.ok(u.lessons.length >= 6, u.title);
  assert.ok(LESSONS.length >= 48);
  assert.ok(VOCAB.length >= 600, `hay ${VOCAB.length}`);
  const exercises = LESSONS.reduce((n, l) => n + lessonExercises(1, l).length, 0);
  assert.ok(exercises >= 240, `base 120, hay ${exercises}`);
  assert.ok(SCENARIOS.length >= 16);
});

test('vocabulario: identificadores unicos, campos completos, sin duplicados triviales', () => {
  assert.equal(new Set(VOCAB.map((v) => v.id)).size, VOCAB.length);
  const seen = new Map();
  for (const v of VOCAB) {
    for (const f of ['id', 'en', 'es', 'category', 'phrase', 'guest', 'reply']) assert.ok(v[f], `${v.id} sin ${f}`);
    assert.ok([1, 2, 3].includes(v.difficulty), `${v.id} dificultad`);
    assert.ok(Array.isArray(v.alts), v.id);
    assert.ok(v.phrase.toLowerCase().includes(v.en.toLowerCase()), `${v.id}: «${v.en}» no esta en «${v.phrase}»`);
    const key = normalize(v.en);
    assert.ok(!seen.has(key), `duplicado: ${v.id} y ${seen.get(key)}: ${key}`);
    seen.set(key, v.id);
    assert.ok(!v.alts.some((a) => a.toLowerCase() === v.en.toLowerCase()), `${v.id}: alternativa igual a la expresion`);
    assert.ok(/[.!?\]]$/.test(v.phrase.trim()), `${v.id}: frase sin puntuacion final`);
  }
});

test('vocabulario: las 22 categorias tienen contenido suficiente', () => {
  assert.equal(CATEGORIES.length, 22);
  for (const cat of CATEGORIES) {
    const n = VOCAB.filter((v) => v.category === cat).length;
    assert.ok(n >= 20, `${cat}: ${n}`);
  }
  for (const v of VOCAB) assert.ok(CATEGORIES.includes(v.category), `${v.id}: ${v.category}`);
});

test('vocabulario: ninguna frase modelo promete seguridad ni compensaciones', () => {
  const allergy = VOCAB.filter((v) => v.category === 'Alergias y restricciones alimentarias');
  for (const v of allergy) {
    for (const text of [v.reply]) {
      assert.ok(!/\b(i guarantee|i promise|it is safe|totally safe|100%)\b/i.test(text), `${v.id}: ${text}`);
    }
  }
  for (const v of VOCAB) {
    assert.ok(!/\b(it is free|on the house for you|you must tip|you have to tip)\b/i.test(v.reply), `${v.id}: ${v.reply}`);
  }
});

test('expresiones pedidas por el proyecto estan en el catalogo', () => {
  for (const en of ['side dish', 'dressing on the side', 'refill', 'still water', 'sparkling water', 'medium rare', 'split the check', 'take your time', 'let me double-check', "I'll be right back"]) {
    assert.ok(VOCAB.some((v) => v.en === en), en);
  }
});

test('cada expresion se reconoce a si misma y cada alternativa exacta tambien', () => {
  for (const v of VOCAB) {
    const r = checkAnswer({ type: 'recall', vocabId: v.id }, v.en);
    assert.equal(r.correct, true, `${v.id}: ${v.en} -> ${r.status}`);
    for (const a of v.alts) {
      const alt = checkAnswer({ type: 'recall', vocabId: v.id }, a);
      assert.equal(alt.correct, true, `${v.id}: alternativa ${a} -> ${alt.status}`);
    }
  }
});

test('cada respuesta del catalogo se acepta o queda en revision, nunca como error', () => {
  for (const v of VOCAB) {
    const r = checkAnswer({ type: 'respond', vocabId: v.id }, v.reply);
    assert.notEqual(r.status, 'review', `${v.id}: «${v.reply}» -> ${r.feedback.change}`);
  }
});

test('lecciones: cada una tiene objetivo, explicacion breve y referencias validas', () => {
  const ids = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), l.id);
    ids.add(l.id);
    assert.ok(l.grammar?.text, l.id);
    assert.ok(l.grammar.text.split(/\s+/).length <= 60, `${l.id}: explicacion demasiado larga`);
    for (const id of l.vocab) assert.ok(VOCAB_BY_ID.has(id), `${l.id}: ${id}`);
  }
});

test('lecciones nuevas: seis ejercicios propios y variedad real, sin repetir enunciados', () => {
  const extra = LESSONS.filter((l) => l.exercises);
  assert.equal(extra.length, 24);
  const prompts = new Set();
  for (const l of extra) {
    assert.equal(l.exercises.length, 6, l.id);
    assert.ok(l.goal, l.id);
    assert.ok(new Set(l.exercises.map((e) => e.type)).size >= 3, `${l.id}: poca variedad`);
    for (const e of l.exercises) {
      const key = normalize(e.text ?? e.guest ?? e.answer ?? e.prompt) + e.type;
      assert.ok(!prompts.has(key), `${l.id}: repetido ${key}`);
      prompts.add(key);
    }
  }
  const allTypes = new Set(extra.flatMap((l) => l.exercises.map((e) => e.type)));
  for (const t of ['choice', 'distinguish', 'best_choice', 'order', 'fix_error', 'rephrase', 'respond', 'confirm']) assert.ok(allTypes.has(t), t);
});

test('ejercicios: la respuesta modelo pasa y la publica no revela nada', () => {
  const extra = LESSONS.filter((l) => l.exercises);
  for (const l of extra) {
    for (const raw of l.exercises) {
      const ex = prepareAuthored(raw, seededRng('x'));
      const label = `${l.id} ${ex.type}: ${ex.text ?? ex.guest ?? ex.answer}`;
      let answer;
      if (ex.type === 'choice' || ex.type === 'distinguish') answer = ex.answer;
      else if (ex.type === 'best_choice') answer = { option: ex.answer, reason: ex.reason };
      else if (ex.type === 'order') answer = { tokens: ex.answer.split(' ') };
      else if (ex.type === 'fix_error') answer = ex.accept[0];
      else answer = ex.reply;
      const r = checkAnswer(ex, answer);
      assert.equal(r.correct, true, `${label} -> ${r.status}: ${r.feedback?.change}`);
      if (ex.alt && ['respond', 'rephrase', 'confirm'].includes(ex.type)) {
        const altResult = checkAnswer(ex, ex.alt);
        assert.notEqual(altResult.status, 'review', `${label} alternativa -> ${altResult.feedback.change}`);
      }
      const pub = JSON.stringify(publicExercise(ex));
      if (ex.reply) assert.ok(!pub.includes(ex.reply), `${label}: revela la respuesta`);
    }
  }
});

test('ejercicios cerrados: la respuesta esta entre las opciones; las intenciones existen', () => {
  for (const l of LESSONS.filter((x) => x.exercises)) {
    for (const e of l.exercises) {
      if (e.options) assert.ok(e.options.includes(e.answer), `${l.id}: ${e.answer}`);
      if (e.options) assert.equal(new Set(e.options).size, e.options.length, `${l.id}: opciones repetidas`);
      if (e.reasons) assert.ok(e.reasons.includes(e.reason), `${l.id}: ${e.reason}`);
      for (const id of [...(e.intents ?? []), ...(e.required ?? [])]) assert.ok(INTENTS[id], `${l.id}: intencion ${id}`);
    }
  }
});

test('escenarios: definen todo y las respuestas modelo superan sus propios criterios', () => {
  const dishes = new Set(MENU.dishes.map((d) => d.id));
  const ok = (text, groups) => groups.some((g) => g.every((k) => findPhrase(tokens(text), tokens(k)) >= 0));
  for (const s of SCENARIOS) {
    for (const f of ['objective', 'guestFacts', 'closing', 'closingLine', 'difficulty']) assert.ok(s[f], `${s.id}.${f}`);
    assert.ok(s.surprises.length, s.id);
    for (const id of s.menu) assert.ok(dishes.has(id), `${s.id}: plato ${id}`);
    assert.ok(UNITS.some((u) => u.id === s.unit), s.id);
    if (!s.variantOf) assert.equal(UNITS.find((u) => u.id === s.unit).scenario, s.id);
    else assert.ok(SCENARIO_BY_ID.get(s.variantOf), `${s.id}: variante de`);
    const covered = new Set(s.beats.flatMap((b) => [b.criterion, ...(b.also ?? [])]));
    for (const c of s.criteria) assert.ok(covered.has(c.id), `${s.id}: criterio ${c.id} sin momento en la demo`);
    if (s.critical) assert.ok(s.criteria.some((c) => c.id === s.critical), `${s.id}: critico`);
    for (const b of s.beats) {
      assert.ok(ok(b.model, b.accept), `${s.id}: el modelo no pasa «${b.model}»`);
      assert.ok(ok(b.options[0], b.accept), `${s.id}: la opcion buena no pasa «${b.options[0]}»`);
      assert.ok(ok(b.alt, b.accept), `${s.id}: la alternativa no pasa «${b.alt}»`);
      // Las opciones flojas pueden comunicar la intencion; las que inventan algo nunca pasan.
      if (b.reject && !/\b(no money|fine|free)\b/.test(b.options[1])) assert.ok(ok(b.options[1], b.reject), `${s.id}: la opcion prohibida no se rechaza «${b.options[1]}»`);
      for (const id of b.vocab) assert.ok(VOCAB_BY_ID.has(id), `${s.id}: ${id}`);
    }
  }
  assert.ok(SCENARIO_BY_ID.get('dinner_for_two').featured);
  assert.ok(SCENARIO_BY_ID.get('order_not_right'));
});

test('diagnostico: ronda 1 con tres preguntas por area y ronda 2 mas exigente', () => {
  for (const skill of ['comprehension', 'vocabulary', 'expression']) {
    assert.equal(DIAGNOSTIC.filter((q) => q.skill === skill && q.round === 1).length, 3);
    assert.ok(DIAGNOSTIC.some((q) => q.skill === skill && q.round === 2), skill);
  }
});

test('el ejemplo del proyecto: «What you want?» no pasa como cortes', () => {
  assert.ok(politenessNote('What you want?'));
  assert.equal(politenessNote('What would you like to order?'), null);
  assert.equal(politenessNote('Are you ready to order?'), null);
});
