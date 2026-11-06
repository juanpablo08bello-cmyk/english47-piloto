// Práctica diaria: Aprender (texto), Mesas (voz) y Mejorar (voz). Se guarda dentro de la jornada,
// sin tablas nuevas. La voz se compara con la frase guía: mide qué palabras se entendieron,
// no el acento ni la fonética. El audio nunca se guarda y el texto oído no se conserva.
import { localDate } from './dates.js';
import { award, grantAchievement, RULES, validatePracticeDay } from './progress.js';
import { getSession } from './daily.js';
import { normalize, tokens, typoKind } from './text.js';
import { checkLimit, logUsage } from './voice/index.js';
import { FRASES, FRASE_BY_ID, PACK_SIZE, TOPICS } from '../content/frases.js';
import { ACCENTS, AZURE_VOICES, MOODS, VOICES, buildMesa, levelFor, mesaKey, recentFrom } from '../content/mesas.js';

const IMPROVE_SIZE = 4;
const NUMBER_WORDS = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten' };

function speechTokens(text) {
  return tokens(normalize(text).replace(/\bokay\b/g, 'ok')).map((w) => NUMBER_WORDS[w] ?? w);
}

// Consejos breves para hispanohablantes. Son orientación, no un diagnóstico fonético.
const TIPS = [
  [/^th|th$/, 'Th: pon la lengua entre los dientes.'],
  [/^s[ptkmnl]/, 'No digas «es»: empieza directo con S.'],
  [/^h/, 'H: suena como una J suave.'],
  [/sh/, 'Sh: como pidiendo silencio.'],
  [/v/, 'V: dientes sobre el labio de abajo.'],
  [/ed$/, 'Termina la palabra sin añadir sílabas.'],
  [/ing$/, 'Ing: la G casi no suena.'],
  [/ee|ea/, 'I larga, como una sonrisa.'],
];

function tipFor(word) {
  const w = normalize(word);
  return TIPS.find(([re]) => re.test(w))?.[1] ?? 'Escúchala lento y repítela.';
}

/** Marca palabra por palabra lo que se entendió, respetando el orden de la frase guía. */
export function compareSpeech(target, heard) {
  const said = speechTokens(heard);
  const display = String(target).split(/\s+/).filter(Boolean);
  let cursor = 0;
  let hit = 0;
  let total = 0;
  const words = display.map((word) => {
    const wanted = speechTokens(word);
    if (!wanted.length) return { w: word, ok: true };
    let allFound = true;
    for (const token of wanted) {
      total += 1;
      let at = -1;
      for (let i = cursor; i < said.length; i++) {
        if (said[i] === token || typoKind(said[i], token) === 'safe') { at = i; break; }
      }
      if (at >= 0) { hit += 1; cursor = at + 1; } else allFound = false;
    }
    return { w: word, ok: allFound };
  });
  const ratio = total ? hit / total : 0;
  const stars = ratio >= 0.9 ? 3 : ratio >= 0.65 ? 2 : ratio >= 0.3 ? 1 : 0;
  const missed = words.filter((x) => !x.ok);
  // Con casi nada entendido, un consejo sobre una palabra no ayuda: conviene volver a escuchar.
  const specific = missed.find((x) => TIPS.some(([re]) => re.test(normalize(x.w)))) ?? missed[0];
  const tip = !missed.length ? null
    : stars === 0 ? { word: '', text: 'Escucha el ejemplo y repítelo.' }
      : { word: specific.w, text: tipFor(specific.w) };
  return { words, ratio, stars, understood: ratio >= 0.65, tip };
}

/**
 * Convierte la evaluación de pronunciación en el mismo resultado que ve el alumno.
 * Cada palabra de la frase guía se empareja en orden con la evaluada; lo omitido queda sin marcar.
 */
export function assessedResult(target, assessment) {
  // «I'm» puede llegar como una palabra evaluada y se compara como «i am»: cada parte hereda su nota.
  const spoken = (assessment.words ?? []).filter((w) => w.error !== 'Insertion')
    .flatMap((w) => speechTokens(w.word).map((token) => ({ token, accuracy: w.accuracy, error: w.error })));
  let cursor = 0;
  const words = String(target).split(/\s+/).filter(Boolean).map((word) => {
    const wanted = speechTokens(word);
    if (!wanted.length) return { w: word, ok: true };
    let ok = true;
    let lowest = 100;
    for (const token of wanted) {
      let at = -1;
      for (let i = cursor; i < spoken.length; i++) {
        if (spoken[i].token === token) { at = i; break; }
      }
      if (at < 0) { ok = false; lowest = 0; continue; }
      cursor = at + 1;
      lowest = Math.min(lowest, spoken[at].accuracy);
      if (spoken[at].error !== 'None' || spoken[at].accuracy < 60) ok = false;
    }
    return { w: word, ok, accuracy: Math.round(lowest) };
  });
  const score = assessment.score ?? 0;
  const stars = score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;
  const missed = words.filter((x) => !x.ok).sort((a, b) => a.accuracy - b.accuracy);
  const specific = missed.find((x) => x.accuracy > 0 && TIPS.some(([re]) => re.test(normalize(x.w)))) ?? missed[0];
  const tip = !missed.length ? null
    : stars === 0 ? { word: '', text: 'Escucha el ejemplo y repítelo.' }
      : { word: specific.w, text: tipFor(specific.w) };
  return { words, ratio: score / 100, stars, understood: score >= 60, tip, assessed: true, score: Math.round(score) };
}

/** La frase guía la decide el servidor: el alumno no puede cambiar contra qué se le evalúa. */
export async function speechTarget(db, user, { tipo, id, index }, now) {
  const { practice } = (await load(db, user, now)).state;
  if (tipo === 'mesa') {
    const mesa = practice.tables.current;
    return mesa && mesa.id === id && !mesa.finished ? mesa.steps[index]?.say.en ?? null : null;
  }
  if (tipo === 'mejorar') return practice.improve.items[index]?.en ?? null;
  return null;
}

function freshPractice() {
  return {
    learn: { pack: [], topic: null, done: false },
    tables: { nextId: 1, count: 0, current: null, recent: [], weak: [] },
    improve: { items: [], attempts: 0, done: false },
  };
}

async function load(db, user, now) {
  const session = await getSession(db, user, now);
  session.state.practice ??= freshPractice();
  return session;
}

async function save(db, user, session, now) {
  await db.prepare('UPDATE daily_sessions SET state=?, last_action_at=? WHERE user_id=? AND local_date=?')
    .run(JSON.stringify(session.state), now, user.id, session.sessionDate);
}

function planOf(p) {
  const steps = {
    learn: p.learn.done,
    tables: p.tables.count > 0,
    improve: p.improve.done,
  };
  return {
    learn: { done: steps.learn },
    tables: { done: steps.tables, count: p.tables.count, open: Boolean(p.tables.current && !p.tables.current.finished) },
    improve: { done: steps.improve },
    doneCount: Object.values(steps).filter(Boolean).length,
    total: 3,
    allDone: Object.values(steps).every(Boolean),
    next: !steps.learn ? 'learn' : !steps.tables ? 'tables' : !steps.improve ? 'improve' : null,
  };
}

export async function getPlan(db, user, now) {
  return planOf((await load(db, user, now)).state.practice);
}

/** Paga una sola vez por día. Cualquier sección completa cuenta para la racha. */
async function settle(db, user, session, key, xp, now) {
  const today = localDate(now, user.timezone);
  const rewards = { xp: 0, coins: 0, bonus: 0, newDay: false, achievements: [] };
  if (await award(db, user.id, `${key}:${today}`, { xp }, now)) rewards.xp = xp;
  const plan = planOf(session.state.practice);
  const r = await validatePracticeDay(db, user, plan.allDone ? 'full' : 'minimum', now);
  rewards.coins = r.coins;
  rewards.bonus = r.bonus;
  rewards.newDay = r.newDay;
  return { rewards, plan };
}

// --- Aprender ---
async function seenPhrases(db, user) {
  const rows = await db.prepare("SELECT key FROM reward_events WHERE user_id=? AND key LIKE 'frase:%' ORDER BY created_at").all(user.id);
  return rows.map((r) => r.key.slice(6)).filter((id) => FRASE_BY_ID.has(id));
}

function choosePack(seen, topic) {
  const pool = topic ? FRASES.filter((x) => x.topic === topic) : FRASES;
  const known = new Set(seen);
  const fresh = pool.filter((x) => !known.has(x.id));
  // Cuando se terminan, vuelven primero las vistas hace más tiempo.
  const again = seen.map((id) => FRASE_BY_ID.get(id)).filter((x) => x && (!topic || x.topic === topic));
  return [...fresh, ...again].slice(0, PACK_SIZE);
}

export async function learnHome(db, user, now, topic = null) {
  const session = await load(db, user, now);
  const seen = await seenPhrases(db, user);
  const known = new Set(seen);
  const validTopic = TOPICS.some((t) => t.id === topic) ? topic : null;
  const { learn } = session.state.practice;
  let pack = learn.pack.map((id) => FRASE_BY_ID.get(id)).filter(Boolean);
  if (!pack.length || learn.done || learn.topic !== validTopic) {
    pack = choosePack(seen, validTopic);
    learn.pack = pack.map((x) => x.id);
    learn.topic = validTopic;
    await save(db, user, session, now);
  }
  return {
    pack,
    done: learn.done,
    seen: seen.length,
    total: FRASES.length,
    topics: TOPICS.map((t) => {
      const list = FRASES.filter((x) => x.topic === t.id);
      return { ...t, total: list.length, seen: list.filter((x) => known.has(x.id)).length };
    }),
    distractors: FRASES.map((x) => x.es),
  };
}

export async function finishLearn(db, user, now) {
  const session = await load(db, user, now);
  const { learn } = session.state.practice;
  if (!learn.pack.length) return { error: 'not_found', message: 'Primero abre tus frases.' };
  for (const id of learn.pack) await award(db, user.id, `frase:${id}`, {}, now);
  learn.done = true;
  const out = await settle(db, user, session, 'p_learn', RULES.XP_LESSON, now);
  await save(db, user, session, now);
  return out;
}

// --- Mesas ---
const PERFECT_BONUS = 5;

/** Nivel y propinas valen para todos los días. La propina va en la clave: mesa_done:fecha:id:propina. */
async function mesaStats(db, user) {
  const rows = await db.prepare("SELECT key FROM reward_events WHERE user_id=? AND key LIKE 'mesa_done:%'").all(user.id);
  return { done: rows.length, tips: rows.reduce((n, r) => n + (Number(r.key.split(':')[3]) || 0), 0) };
}
const progressOf = ({ done, tips }) => ({ ...levelFor(done), tips });
const tipOf = (attempt) => (!attempt ? 0 : attempt.selfCheck ? 1 : attempt.stars);

function publicMesa(mesa) {
  const { steps, ...rest } = mesa;
  return { ...rest, steps: steps.map(({ keep, linked, ...s }) => s) };
}

export async function generateMesa(db, user, now, rng = Math.random) {
  const session = await load(db, user, now);
  const { tables } = session.state.practice;
  const mesa = buildMesa(rng, { done: (await mesaStats(db, user)).done, ...recentFrom(tables.recent) });
  tables.recent = [mesaKey(mesa), ...tables.recent].slice(0, 10);
  tables.current = { id: tables.nextId, ...mesa, attempts: {}, finished: false };
  tables.nextId += 1;
  await save(db, user, session, now);
  return { mesa: publicMesa(tables.current) };
}

export async function currentMesa(db, user, now) {
  const { tables } = (await load(db, user, now)).state.practice;
  const mesa = tables.current;
  return { mesa: mesa && !mesa.finished ? publicMesa(mesa) : null, count: tables.count, progress: progressOf(await mesaStats(db, user)) };
}

function bestAttempt(attempts, index, result) {
  const prev = attempts[index];
  attempts[index] = { stars: Math.max(prev?.stars ?? 0, result.stars), tries: (prev?.tries ?? 0) + 1, selfCheck: result.selfCheck || prev?.selfCheck || false };
}

export async function mesaTurn(db, user, mesaId, { index, heard, selfCheck, assessment }, now) {
  const session = await load(db, user, now);
  const mesa = session.state.practice.tables.current;
  if (!mesa || mesa.id !== mesaId || mesa.finished) return { error: 'not_found', message: 'Esa mesa ya terminó. Genera otra.' };
  const step = mesa.steps[index];
  if (!step) return { error: 'not_found', message: 'Ese turno no existe.' };
  const result = assessment ? assessedResult(step.say.en, assessment)
    : selfCheck
      ? { words: step.say.en.split(/\s+/).map((w) => ({ w, ok: true })), ratio: null, stars: 0, understood: true, tip: null, selfCheck: true }
      : compareSpeech(step.say.en, heard);
  bestAttempt(mesa.attempts, index, result);
  await save(db, user, session, now);
  return { result };
}

export async function finishMesa(db, user, mesaId, now) {
  const session = await load(db, user, now);
  const { tables } = session.state.practice;
  const mesa = tables.current;
  if (!mesa || mesa.id !== mesaId) return { error: 'not_found', message: 'Esa mesa ya terminó. Genera otra.' };
  if (mesa.finished) return { duplicate: true, rewards: { xp: 0, coins: 0, bonus: 0, newDay: false, achievements: [] }, plan: planOf(session.state.practice), summary: mesa.summary };
  const answered = mesa.steps.filter((_, i) => mesa.attempts[i]).length;
  if (answered < Math.ceil(mesa.steps.length / 2)) return { error: 'too_short', message: 'Atiende un poco más la mesa para terminarla.' };
  const graded = Object.values(mesa.attempts).filter((a) => !a.selfCheck);
  const stars = graded.length ? Math.round(graded.reduce((n, a) => n + a.stars, 0) / graded.length) : null;
  const weak = mesa.steps.filter((_, i) => mesa.attempts[i] && !mesa.attempts[i].selfCheck && mesa.attempts[i].stars < 3).map((s) => s.say);
  tables.weak = [...weak, ...tables.weak].filter((x, i, all) => all.findIndex((o) => o.en === x.en) === i).slice(0, 12);
  mesa.finished = true;
  const perfect = mesa.steps.every((_, i) => mesa.attempts[i]?.stars === 3 && !mesa.attempts[i].selfCheck);
  const tip = mesa.steps.reduce((n, _, i) => n + tipOf(mesa.attempts[i]), 0) + (perfect ? PERFECT_BONUS : 0);
  mesa.summary = { stars, answered, total: mesa.steps.length, weak: weak.slice(0, 3), selfCheck: stars === null, tip, perfect };
  tables.count += 1;
  const before = levelFor((await mesaStats(db, user)).done).level;
  await award(db, user.id, `mesa_done:${session.sessionDate}:${mesa.id}:${tip}`, {}, now);
  const progress = progressOf(await mesaStats(db, user));
  const out = await settle(db, user, session, 'p_mesa', RULES.XP_SIMULATION, now);
  out.progress = progress;
  out.levelUp = progress.level > before;
  if (await grantAchievement(db, user.id, 'first_conversation', now)) out.rewards.achievements.push('first_conversation');
  const confirmIndex = mesa.steps.findIndex((s) => s.kind === 'confirm');
  if ((mesa.attempts[confirmIndex]?.stars ?? 0) >= 2 && await grantAchievement(db, user.id, 'confirmed_order', now)) out.rewards.achievements.push('confirmed_order');
  await save(db, user, session, now);
  return { ...out, summary: mesa.summary };
}

// --- Mejorar ---
function improveList(practice) {
  const fromLearn = practice.learn.pack.map((id) => FRASE_BY_ID.get(id)).filter(Boolean).map((x) => ({ en: x.en, es: x.es }));
  const fallback = FRASES.slice(0, IMPROVE_SIZE).map((x) => ({ en: x.en, es: x.es }));
  const seen = new Set();
  return [...practice.tables.weak, ...fromLearn, ...fallback].filter((x) => {
    if (seen.has(x.en)) return false;
    seen.add(x.en);
    return true;
  }).slice(0, IMPROVE_SIZE);
}

export async function improveHome(db, user, now) {
  const session = await load(db, user, now);
  const { improve } = session.state.practice;
  if (!improve.items.length || improve.done) {
    improve.items = improveList(session.state.practice);
    improve.attempts = 0;
    await save(db, user, session, now);
  }
  return { items: improve.items, done: improve.done };
}

export async function improveAttempt(db, user, { index, heard, selfCheck, assessment }, now) {
  const session = await load(db, user, now);
  const { improve } = session.state.practice;
  const item = improve.items[index];
  if (!item) return { error: 'not_found', message: 'Esa frase no existe.' };
  improve.attempts += 1;
  await save(db, user, session, now);
  if (assessment) return { result: assessedResult(item.en, assessment) };
  if (selfCheck) return { result: { words: item.en.split(/\s+/).map((w) => ({ w, ok: true })), ratio: null, stars: 0, understood: true, tip: null, selfCheck: true } };
  return { result: compareSpeech(item.en, heard) };
}

export async function finishImprove(db, user, now) {
  const session = await load(db, user, now);
  const { improve } = session.state.practice;
  if (improve.attempts < 1) return { error: 'too_short', message: 'Di al menos una frase.' };
  improve.done = true;
  const out = await settle(db, user, session, 'p_improve', RULES.XP_REVIEW, now);
  if (await grantAchievement(db, user.id, 'retried_phrase', now)) out.rewards.achievements.push('retried_phrase');
  await save(db, user, session, now);
  return out;
}

/** Instrucción de voz según el personaje. Solo admite valores de las listas del catálogo. */
export function speechPersona(persona) {
  if (!persona) return null;
  const accent = ACCENTS[persona.accent];
  const mood = MOODS[persona.mood];
  return {
    voice: VOICES.has(persona.voice) ? persona.voice : null,
    azure: AZURE_VOICES.has(persona.azure) ? persona.azure : null,
    style: accent && mood ? `${accent.prompt}, sounding ${mood.prompt}` : null,
    rate: mood?.rate ?? null,
  };
}
