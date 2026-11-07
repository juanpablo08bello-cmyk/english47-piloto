// Práctica diaria: Aprender por texto, Mesas y Mejorar por voz.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, login } from './helpers.js';
import { assessedResult, compareSpeech, speechPersona } from '../server/practice.js';
import { azureSpeech } from '../server/voice/azure.js';
import { tokens } from '../server/text.js';
import { FRASES, TOPICS } from '../content/frases.js';
import { goalFor } from '../content/objetivos.js';
import { missingWords, pronounce } from '../content/pronunciacion.js';
import { SCENARIOS } from '../content/scenarios.js';
import { ACCENTS, buildMesa, LEVELS, levelFor, mesaKey, MOODS, recentFrom, SCENE_IDS, VOICES } from '../content/mesas.js';
import { loadConfig } from '../server/config.js';

test('cada frase se explica entera y en orden, palabra por palabra', () => {
  const ids = new Set();
  for (const f of FRASES) {
    assert.ok(!ids.has(f.id), `repetida: ${f.id}`);
    ids.add(f.id);
    assert.ok(TOPICS.some((t) => t.id === f.topic), f.id);
    assert.ok(f.en.trim() && f.es.trim(), f.id);
    assert.deepEqual(f.words.flatMap(([en]) => tokens(en)), tokens(f.en), `${f.id}: las palabras no forman la frase`);
    for (const [en, es] of f.words) assert.ok(en && es, `${f.id}: falta significado`);
  }
  assert.ok(FRASES.length >= 200, `solo ${FRASES.length} frases`);
  assert.equal(new Set(FRASES.map((f) => f.en)).size, FRASES.length, 'hay frases repetidas');
  for (const t of TOPICS) assert.ok(FRASES.some((f) => f.topic === t.id), `tema vacío: ${t.id}`);
});

test('ninguna frase promete seguridad ni compensaciones', () => {
  for (const f of FRASES) assert.doesNotMatch(f.en, /guarantee|100%|free of charge|on the house|totally safe/i, f.en);
});

test('la comparación marca lo que se entendió y tolera contracciones y números', () => {
  const full = compareSpeech("I'll be right back.", 'I will be right back');
  assert.equal(full.stars, 3);
  assert.ok(full.words.every((w) => w.ok));
  assert.equal(compareSpeech('One ribeye, two fries.', '1 ribeye 2 fries').stars, 3);
  const half = compareSpeech('Let me check with the kitchen.', 'let me chek the chicken');
  assert.ok(half.stars < 3);
  assert.equal(half.words.at(-1).ok, false);
  assert.ok(half.tip.text.length > 0);
  assert.equal(compareSpeech('Good evening.', 'banana').stars, 0);
  assert.equal(compareSpeech('Good evening.', '').stars, 0);
  assert.equal(compareSpeech('Good evening.', 'evening good').words.filter((w) => w.ok).length, 1, 'respeta el orden');
});

test('el generador varía mucho y siempre guía con frases seguras', () => {
  let rng = 1;
  const random = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };
  const scripts = new Set();
  const scenes = new Set();
  for (const { level, from, min, max } of LEVELS) {
    for (let i = 0; i < 1500; i++) {
      const mesa = buildMesa(random, { done: from });
      scenes.add(mesa.scene);
      scripts.add(JSON.stringify(mesa.steps.map((s) => [s.guest.en, s.say.en])));
      assert.equal(mesa.level, level);
      assert.ok(VOICES.has(mesa.persona.voice));
      assert.ok(mesa.steps.length >= min && mesa.steps.length <= max, `${mesa.scene} nivel ${level}: ${mesa.steps.length} turnos`);
      assert.ok(mesa.party >= 2, mesa.scene);
      assert.doesNotMatch(JSON.stringify(mesa), /undefined|null,"es"|\[object/, mesa.scene);
      for (const [n, step] of mesa.steps.entries()) {
        assert.ok(step.guest.en && step.guest.es && step.say.en && step.say.es, `${mesa.scene}: ${step.kind}`);
        assert.ok(tokens(step.say.en).length <= 14, `larga para principiante: ${step.say.en}`);
        assert.doesNotMatch(step.say.en, /guarantee|safe|free/i);
        for (const word of step.keep) assert.ok(tokens(step.guest.en).includes(word.toLowerCase()), `${mesa.scene}: falta ${word} en ${step.guest.en}`);
        // Si el alumno pregunta algo, lo siguiente no puede ser un imprevisto que ignore la pregunta.
        if (step.say.en.endsWith('?')) assert.notEqual(mesa.steps[n + 1]?.kind, 'extra', `${mesa.scene}: ${step.say.en}`);
        if (step.linked) assert.notEqual(mesa.steps[n - 1]?.kind, 'extra', `${mesa.scene}: se cortó ${step.guest.en}`);
        if (n > 0 || step.kind !== 'greet') for (const m of Object.values(MOODS)) if (m.open[0]) assert.ok(!step.guest.en.includes(m.open[0].trim()), `${mesa.scene}: ánimo fuera de lugar`);
      }
      const confirm = mesa.steps.find((s) => s.kind === 'confirm');
      if (confirm && mesa.scene !== 'agotado') assert.ok(confirm.say.en.includes(mesa.menuFacts.main), 'confirma el plato pedido');
      if (mesa.scene === 'alergia') assert.ok(mesa.steps.some((s) => /check with the kitchen/.test(s.say.en)), 'una alergia siempre se consulta');
    }
  }
  assert.deepEqual([...scenes].sort(), [...SCENE_IDS].sort(), 'todas las situaciones aparecen');
  assert.ok(SCENE_IDS.length >= 20);
  assert.ok(scripts.size >= 3000, `solo ${scripts.size} guiones distintos`);
});

test('las mesas evitan repetir situación y persona, y se suben de nivel', () => {
  for (let i = 0; i < 200; i++) {
    const a = buildMesa(Math.random);
    const b = buildMesa(Math.random, recentFrom([mesaKey(a)]));
    assert.notEqual(b.scene, a.scene);
    assert.notEqual(b.persona.name, a.persona.name);
  }
  assert.deepEqual([0, 3, 4, 9, 10, 19, 20, 500].map((n) => levelFor(n).level), [1, 1, 2, 2, 3, 3, 4, 4]);
  assert.equal(levelFor(3).toNext, 1);
  assert.equal(levelFor(500).toNext, 0);
});

test('toda frase que se dice tiene su pronunciación escrita en español', () => {
  const missing = new Set();
  let rng = 3;
  const random = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };
  for (const f of FRASES) missingWords(f.en).forEach((w) => missing.add(w));
  for (const scene of SCENE_IDS) for (const { from } of LEVELS) for (let i = 0; i < 150; i++) {
    for (const s of buildMesa(random, { done: from, scene }).steps) missingWords(s.say.en).forEach((w) => missing.add(w));
  }
  for (const s of SCENARIOS) for (const b of s.beats) for (const o of b.options ?? []) missingWords(o).forEach((w) => missing.add(w));
  assert.deepEqual([...missing], []);
  assert.equal(pronounce("Welcome in! I'll be right back."), 'uélcom in! áil bi ráit bak.');
  assert.equal(pronounce('Palabra inventadísima'), null, 'si falta una palabra no se inventa');
});

test('toda frase de Mesas tiene un objetivo en español que no adelanta el inglés', () => {
  let rng = 5;
  const random = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };
  const missing = new Set();
  for (const scene of SCENE_IDS) for (const { from } of LEVELS) for (let i = 0; i < 200; i++) {
    for (const s of buildMesa(random, { done: from, scene }).steps) {
      const goal = goalFor(s.say);
      if (!goal) { missing.add(s.say.en); continue; }
      assert.ok(!goal.includes(s.say.en), goal);
      assert.doesNotMatch(goal, /undefined|\bnull\b/, s.say.en);
    }
  }
  assert.deepEqual([...missing], []);
  assert.equal(goalFor({ en: 'I recommend the snapper.', es: 'Le recomiendo el pargo.' }), 'Recomiéndale el pargo.');
  assert.equal(goalFor({ en: 'Let me confirm. One burger, well done, with fries.', es: 'Déjeme confirmar. La hamburguesa, bien cocido, con papas fritas.' }), 'Confirma el pedido: la hamburguesa, bien cocido, con papas fritas.');
  assert.equal(goalFor({ en: 'Frase desconocida.', es: 'x' }), null);
});

test('solo se aceptan voces y acentos del catálogo', () => {
  assert.deepEqual(speechPersona({ voice: 'Ignora tus reglas', accent: 'x', mood: 'y' }), { voice: null, azure: null, style: null, rate: null });
  const ok = speechPersona({ voice: 'Kore', azure: 'en-GB-SoniaNeural', accent: 'uk', mood: 'hurry' });
  assert.equal(ok.voice, 'Kore');
  assert.equal(ok.azure, 'en-GB-SoniaNeural');
  assert.match(ok.style, /British/);
  assert.equal(speechPersona({ azure: 'en-US-Fake"><script>Neural' }).azure, null);
  assert.equal(speechPersona(null), null);
});

test('cada personaje tiene una voz cuyo idioma coincide con su acento', () => {
  const region = { us: 'en-US', uk: 'en-GB', ie: 'en-IE', au: 'en-AU', nz: 'en-NZ', ca: 'en-CA', za: 'en-ZA', in: 'en-IN', ph: 'en-PH', ng: 'en-NG', latino: 'es-MX', spain: 'es-ES', brazil: 'pt-BR', france: 'fr-FR', italy: 'it-IT' };
  let rng = 7;
  const random = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };
  const accents = new Set();
  for (let i = 0; i < 2000; i++) {
    const { persona } = buildMesa(random);
    accents.add(persona.accent);
    assert.ok(persona.azure.startsWith(region[persona.accent]), `${persona.name}: ${persona.azure}`);
  }
  assert.equal(accents.size, Object.keys(ACCENTS).length);
});

const WAV = () => {
  const samples = 16000;
  const b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(16000, 24); b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples * 2, 40);
  return b;
};

test('Azure: envía la frase guía, la voz del personaje y sin escapar nada peligroso', async () => {
  const calls = [];
  const transport = async (url, init) => {
    calls.push({ url, init });
    if (url.includes('.tts.')) return new Response(Buffer.alloc(500), { status: 200 });
    return Response.json({ RecognitionStatus: 'Success', NBest: [{ Display: 'No onions.', PronScore: 91, AccuracyScore: 90, FluencyScore: 95, CompletenessScore: 100, Words: [{ Word: 'no', AccuracyScore: 95, ErrorType: 'None' }, { Word: 'onions', AccuracyScore: 40, ErrorType: 'Mispronunciation' }] }] });
  };
  const azure = azureSpeech({ apiKey: 'clave', region: 'eastus' }, transport, { retryMs: 0 });
  const { audio } = await azure.tts.speak({ text: 'Fish & <chips>', azure: 'en-GB-SoniaNeural' });
  assert.equal(audio.length, 500);
  assert.match(calls[0].url, /^https:\/\/eastus\.tts\.speech\.microsoft\.com/);
  assert.match(calls[0].init.body, /en-GB-SoniaNeural/);
  assert.match(calls[0].init.body, /Fish &amp; &lt;chips&gt;/);
  assert.equal(calls[0].init.headers['Ocp-Apim-Subscription-Key'], 'clave');
  await azure.tts.speak({ text: 'hi', azure: 'mal"><voice' });
  assert.match(calls[1].init.body, /en-US-AvaNeural/, 'una voz inválida no entra al SSML');
  const a = await azure.pronunciation.assess({ audio: WAV(), reference: 'No onions.' });
  const header = JSON.parse(Buffer.from(calls[2].init.headers['Pronunciation-Assessment'], 'base64').toString());
  assert.equal(header.ReferenceText, 'No onions.');
  assert.equal(a.score, 91);
  assert.equal(a.words[1].error, 'Mispronunciation');
  assert.equal(azureSpeech({ apiKey: 'clave', region: 'mal.ejemplo.com/x' }, transport), null, 'región inválida no se usa');
});

test('Azure: reintenta un 503, no repite un 429 y lo silencioso no es un error', async () => {
  let sent = 0;
  const flaky = async () => { sent += 1; return sent === 1 ? new Response(null, { status: 503 }) : Response.json({ RecognitionStatus: 'InitialSilenceTimeout' }); };
  const azure = azureSpeech({ apiKey: 'k', region: 'eastus' }, flaky, { retryMs: 0 });
  assert.deepEqual(await azure.pronunciation.assess({ audio: WAV(), reference: 'Hi.' }), { status: 'silence', text: '' });
  assert.equal(sent, 2);
  sent = 0;
  const limited = azureSpeech({ apiKey: 'k', region: 'eastus' }, async () => { sent += 1; return new Response(null, { status: 429 }); }, { retryMs: 0 });
  await assert.rejects(limited.tts.speak({ text: 'Hi' }), (e) => e.code === 'rate_limited');
  assert.equal(sent, 1);
});

test('la evaluación marca palabra por palabra: omitidas, mal dichas y palabras de más', () => {
  const r = assessedResult("I'll have no onions, please.", { score: 72, words: [
    { word: 'i', accuracy: 90, error: 'None' }, { word: 'will', accuracy: 88, error: 'None' }, { word: 'um', accuracy: 0, error: 'Insertion' },
    { word: 'have', accuracy: 91, error: 'None' }, { word: 'no', accuracy: 30, error: 'Mispronunciation' }, { word: 'onions', accuracy: 85, error: 'None' },
    { word: 'please', accuracy: 0, error: 'Omission' },
  ] });
  assert.deepEqual(r.words.map((w) => w.ok), [true, true, false, true, false]);
  assert.equal(r.stars, 2);
  assert.equal(r.assessed, true);
  const joined = assessedResult("I'm so sorry. I'll fix that.", { score: 95, words: [
    { word: "i'm", accuracy: 95, error: 'None' }, { word: 'so', accuracy: 96, error: 'None' }, { word: 'sorry', accuracy: 94, error: 'None' },
    { word: "i'll", accuracy: 90, error: 'None' }, { word: 'fix', accuracy: 92, error: 'None' }, { word: 'that', accuracy: 93, error: 'None' },
  ] });
  assert.ok(joined.words.every((w) => w.ok), 'una contracción bien dicha no se marca');
  assert.equal(joined.tip, null);
  assert.equal(assessedResult('Hi.', { score: 90, words: [{ word: 'hi', accuracy: 95, error: 'None' }] }).stars, 3);
  assert.equal(assessedResult('Hi there.', { score: 10, words: [] }).stars, 0);
});

test('Evaluar: el servidor impone la frase, guarda el intento y limita su uso', async () => {
  const seen = [];
  const pronunciation = { name: 'prueba', assess: async ({ reference }) => { seen.push(reference); return { status: 'ok', text: reference, score: 90, words: tokens(reference).map((w) => ({ word: w, accuracy: 95, error: 'None' })) }; } };
  const app = await startApp({ services: { llm: null, stt: null, tts: null, pronunciation } });
  const api = await login(app, 'ana');
  const { mesa } = (await api('POST', '/api/mesas/generar')).data;
  const post = (query, body = WAV(), type = 'audio/wav') => fetch(`${app.base}/api/voz/evaluar?${query}`, { method: 'POST', headers: { 'Content-Type': type, cookie: api.cookie() }, body });
  const ok = await post(`tipo=mesa&id=${mesa.id}&index=0&reference=otra+frase`);
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.result.stars, 3);
  assert.deepEqual(seen, [mesa.steps[0].say.en], 'ignora cualquier frase enviada por el cliente');
  assert.equal((await api('GET', '/api/mesas')).data.mesa.attempts[0].stars, 3);
  assert.equal((await post(`tipo=mesa&id=${mesa.id + 5}&index=0`)).status, 404);
  assert.equal((await post(`tipo=mesa&id=${mesa.id}&index=0`, Buffer.alloc(50))).status, 400);
  assert.equal((await post(`tipo=mesa&id=${mesa.id}&index=0`, WAV(), 'audio/mpeg')).status, 415);
  const beto = await login(app, 'beto');
  assert.equal((await fetch(`${app.base}/api/voz/evaluar?tipo=mesa&id=${mesa.id}&index=0`, { method: 'POST', headers: { 'Content-Type': 'audio/wav', cookie: beto.cookie() }, body: WAV() })).status, 404, 'otra cuenta no llega a esa mesa');
  await app.stop();
});

test('Azure en la configuración: ajusta los límites al plan gratuito y exige clave y región', () => {
  const on = loadConfig({ AZURE_SPEECH_KEY: 'k', AZURE_SPEECH_REGION: 'EastUS ' });
  assert.equal(on.azure.region, 'eastus');
  assert.equal(on.limits.stt, 18000);
  assert.equal(on.limits.tts, 500000);
  assert.equal(loadConfig({ AZURE_SPEECH_KEY: 'k' }).azure, null);
  assert.equal(loadConfig({ AZURE_SPEECH_KEY: 'k', AZURE_SPEECH_REGION: 'eastus', LIMIT_TTS_CHARS_MONTH: '1000' }).limits.tts, 1000);
});

test('Aprender: paga una vez, cuenta para la racha y avanza a frases nuevas', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const first = (await api('GET', '/api/aprender')).data;
  assert.equal(first.pack.length, 5);
  assert.equal(first.seen, 0);
  assert.ok(first.pack[0].words.length > 0);
  const done = await api('POST', '/api/aprender/terminar');
  assert.equal(done.status, 200);
  assert.equal(done.data.rewards.xp, 10);
  assert.equal(done.data.rewards.coins, 20);
  assert.equal(done.data.rewards.newDay, true);
  assert.equal(done.data.stats.current, 1);
  const again = await api('POST', '/api/aprender/terminar');
  assert.equal(again.data.rewards.xp, 0, 'no paga dos veces');
  assert.equal(again.data.rewards.coins, 0);
  const next = (await api('GET', '/api/aprender')).data;
  assert.equal(next.seen, 5);
  assert.notEqual(next.pack[0].id, first.pack[0].id, 'trae frases nuevas');
  assert.equal(first.pack.some((p) => next.pack.some((q) => q.id === p.id)), false);
  const topic = (await api('GET', '/api/aprender?tema=cuenta')).data;
  assert.ok(topic.pack.every((p) => p.topic === 'cuenta'));
  await app.stop();
});

test('Mesas: guía, compara, paga una sola vez y no guarda lo oído', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  assert.equal((await api('GET', '/api/mesas')).data.mesa, null);
  const { mesa } = (await api('POST', '/api/mesas/generar')).data;
  assert.equal((await api('POST', `/api/mesas/${mesa.id}/terminar`)).status, 400, 'no se termina sin hablar');
  assert.ok(mesa.steps.every((s) => s.say.pron), 'cada turno muestra cómo suena');
  assert.ok(mesa.steps.every((s) => s.say.goal), 'cada turno trae su objetivo');
  let confirmResult;
  for (const [index, step] of mesa.steps.entries()) {
    const r = await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: `${step.say.en} secreto-oido` });
    assert.equal(r.status, 200);
    confirmResult = r.data.result;
  }
  assert.equal(confirmResult.stars, 3);
  const row = app.db.prepare('SELECT state FROM daily_sessions').get();
  assert.ok(!row.state.includes('secreto-oido'), 'lo oído no se guarda');
  const end = await api('POST', `/api/mesas/${mesa.id}/terminar`);
  assert.equal(end.status, 200);
  assert.equal(end.data.rewards.xp, 20);
  assert.ok(end.data.rewards.achievements.includes('first_conversation'));
  assert.equal(end.data.rewards.achievements.includes('confirmed_order'), mesa.steps.some((s) => s.kind === 'confirm'), 'el logro solo existe si hubo que confirmar');
  assert.equal(end.data.progress.done, 1, 'la mesa cuenta para subir de nivel');
  assert.equal(end.data.levelUp, false);
  assert.equal(end.data.summary.stars, 3);
  assert.equal((await api('POST', `/api/mesas/${mesa.id}/terminar`)).data.rewards.xp, 0, 'repetir no paga');
  assert.equal((await api('POST', `/api/mesas/${mesa.id}/turno`, { index: 0, heard: 'x' })).status, 404);
  const other = (await api('POST', '/api/mesas/generar')).data.mesa;
  assert.notEqual(other.id, mesa.id);
  for (const [index] of other.steps.entries()) await api('POST', `/api/mesas/${other.id}/turno`, { index, heard: 'hello' });
  const second = await api('POST', `/api/mesas/${other.id}/terminar`);
  assert.equal(second.data.rewards.xp, 0, 'otra mesa el mismo día practica, pero no paga de nuevo');
  assert.ok(second.data.summary.stars < 3);
  await app.stop();
});

test('una cuenta no puede usar la mesa de otra', async () => {
  const app = await startApp();
  const ana = await login(app, 'ana');
  const beto = await login(app, 'beto');
  const { mesa } = (await ana('POST', '/api/mesas/generar')).data;
  assert.equal((await beto('POST', `/api/mesas/${mesa.id}/turno`, { index: 0, heard: 'hi' })).status, 404);
  assert.equal((await beto('GET', '/api/mesas')).data.mesa, null);
  await app.stop();
});

test('sin transcripción, el alumno se evalúa a sí mismo y no se inventan estrellas', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  const { mesa } = (await api('POST', '/api/mesas/generar')).data;
  for (const [index] of mesa.steps.entries()) {
    const { result } = (await api('POST', `/api/mesas/${mesa.id}/turno`, { index, selfCheck: true })).data;
    assert.equal(result.selfCheck, true);
    assert.equal(result.ratio, null);
  }
  const end = (await api('POST', `/api/mesas/${mesa.id}/terminar`)).data;
  assert.equal(end.summary.selfCheck, true);
  assert.equal(end.summary.stars, null);
  await app.stop();
});

test('Mejorar: usa lo que costó en la mesa y al completar las tres secciones el día queda completo', async () => {
  const app = await startApp();
  const api = await login(app, 'ana');
  await api('GET', '/api/aprender');
  await api('POST', '/api/aprender/terminar');
  const { mesa } = (await api('POST', '/api/mesas/generar')).data;
  for (const [index] of mesa.steps.entries()) await api('POST', `/api/mesas/${mesa.id}/turno`, { index, heard: 'hello there' });
  await api('POST', `/api/mesas/${mesa.id}/terminar`);
  assert.equal((await api('POST', '/api/mejorar/terminar')).status, 400, 'hay que decir algo');
  const { items } = (await api('GET', '/api/mejorar')).data;
  assert.equal(items.length, 4);
  assert.ok(items.every((x) => x.pron), 'Mejorar también muestra cómo suena');
  assert.equal(items[0].en, mesa.steps[0].say.en, 'empieza por lo que costó');
  const attempt = (await api('POST', '/api/mejorar/intento', { index: 0, heard: items[0].en })).data;
  assert.equal(attempt.result.stars, 3);
  const end = (await api('POST', '/api/mejorar/terminar')).data;
  assert.equal(end.rewards.xp, 10);
  assert.equal(end.plan.allDone, true);
  const today = (await api('GET', '/api/today')).data;
  assert.equal(today.plan.doneCount, 3);
  assert.equal(today.stats.xp, 40);
  assert.equal(today.stats.coins, 20, 'las monedas son por día, no por sección');
  assert.equal(app.db.prepare('SELECT full_done f FROM streak_days').get().f, 1);
  await app.stop();
});

