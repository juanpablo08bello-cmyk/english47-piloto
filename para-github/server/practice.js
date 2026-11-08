// Práctica diaria: Aprender palabras (texto), Mesas (voz), Pronunciar y escuchar (voz). Se guarda dentro de la jornada,
// sin tablas nuevas. La voz se compara con la frase guía: mide qué palabras se entendieron,
// no el acento ni la fonética. El audio nunca se guarda y el texto oído no se conserva.
import { localDate } from './dates.js';
import { award, grantAchievement, readEquipped, RULES, streakStats, validatePracticeDay } from './progress.js';
import { getSession } from './daily.js';
import { normalize, tokens, typoKind } from './text.js';
import { constructionScore, sense, speechTokens } from './construccion.js';
import { checkLimit, logUsage } from './voice/index.js';
import { season, seasonKey, seasonStart } from './season.js';
import { FRASES, FRASE_BY_ID, PACK_SIZE, TOPICS } from '../content/frases.js';
import { VIP_BY_ID, VIP_TABLES, vipWord } from '../content/diccionario.js';
import { goalFor } from '../content/objetivos.js';
import { pronounce } from '../content/pronunciacion.js';
import { buildReply, clientLine } from '../content/pronunciar.js';
import { ACCENTS, AZURE_VOICES, CAST, MOODS, VOICES, buildMesa, levelFor, mesaKey, recentFrom } from '../content/mesas.js';

const RECENT_PHRASES = 60;
// Para sumar a la racha hay que hacer esto en cada sección: tandas, mesas, y audios o situaciones.
export const GOALS = { learn: 2, tables: 2, improve: 2 };
// Cinco estrellas por turno. Cada estrella es $2 de propina y la propina se guarda en las monedas.
export const MAX_STARS = 5;
export const TIP_PER_STAR = 2;
export const PERFECT_BONUS = 5;
// Sin revisión de pronunciación no se puede saber si salió perfecta: así, como mucho, 4 estrellas.
const starsFromRatio = (ratio) => (ratio >= 0.95 ? 4 : ratio >= 0.8 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.35 ? 2 : ratio >= 0.15 ? 1 : 0);

/**
 * Pronunciación (0 a 100) con todo lo que mide Azure: cada sonido, fluidez, entonación y ritmo (prosodia)
 * y, si leía una frase, que la dijera completa. Una palabra muy mal dicha pone techo aunque el resto salga bien.
 */
export function pronunciationScore(a, { scripted }) {
  const acc = a.accuracy ?? a.score ?? 0;
  const flu = a.fluency ?? acc;
  const pros = a.prosody ?? 0;
  let s = pros > 0 ? 0.5 * acc + 0.2 * flu + 0.3 * pros : 0.7 * acc + 0.3 * flu;
  if (a.accuracy === undefined) s = a.score ?? 0; // Formato antiguo: solo la nota global.
  if (scripted && a.completeness !== undefined) s *= 0.4 + 0.6 * (a.completeness / 100);
  const words = (a.words ?? []).filter((w) => w.error !== 'Insertion' && w.error !== 'Omission');
  const low = words.length ? Math.min(...words.map((w) => w.accuracy)) : 100;
  // Sin frase de referencia Azure es más duro con las palabras átonas: el techo se aplica un poco más abajo.
  const [hard, soft] = scripted ? [40, 60] : [30, 50];
  if (low < hard) s = Math.min(s, 70);
  else if (low < soft) s = Math.min(s, 84);
  if (words.some((w) => w.error === 'Mispronunciation')) s = Math.min(s, 88);
  return Math.round(Math.max(0, Math.min(100, s)));
}

/** Estrellas: las 5 piden frase bien armada Y buena pronunciación, no solo un promedio alto. */
export function starsFor(total, { build, pron, grammar = 0, measured = true, judge = null }) {
  let stars = total >= 92 ? 5 : total >= 80 ? 4 : total >= 66 ? 3 : total >= 48 ? 2 : total >= 20 ? 1 : 0;
  if (stars === 5 && (build < 90 || pron < 88 || grammar > 0)) stars = 4;
  // Escala del jurado: un detalle pequeño (85-94) deja 4; un error claro (<85), 3; dos errores o uno grave (<70), 2.
  if (judge !== null) stars = Math.min(stars, judge < 70 ? 2 : judge < 85 ? 3 : 5);
  // Una parte floja no se compensa con la otra: cada una pone su techo.
  const parts = measured ? [build, pron] : [build];
  const weakest = Math.min(...parts);
  if (weakest < 60) stars = Math.min(stars, 2);
  else if (weakest < 76) stars = Math.min(stars, 3);
  if (!measured) stars = Math.min(stars, 4);
  return stars;
}
// Parte de los turnos muestran la frase en inglés; en los demás se responde solo, con pista opcional.
const GUIDED_MESAS = 2;
const SHOW_ENGLISH = { 1: 0.75, 2: 0.6, 3: 0.45, 4: 0.3 };

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
  const stars = starsFromRatio(ratio);
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
  // Leyendo la frase, lo que más pesa es la pronunciación; la construcción revisa que no falte ni sobre nada.
  const pron = pronunciationScore(assessment, { scripted: true });
  const build = constructionScore(saidText(assessment), [target], { guided: true });
  const score = Math.round(0.75 * pron + 0.25 * build.score);
  const stars = (assessment.score ?? 0) < 10 && !words.some((x) => x.ok) ? 0 : starsFor(score, { build: build.score, pron, grammar: 0 });
  const missed = words.filter((x) => !x.ok).sort((a, b) => a.accuracy - b.accuracy);
  const specific = missed.find((x) => x.accuracy > 0 && TIPS.some(([re]) => re.test(normalize(x.w)))) ?? missed[0];
  const tip = !missed.length ? null
    : stars === 0 ? { word: '', text: 'Escucha el ejemplo y repítelo.' }
      : { word: specific.w, text: tipFor(specific.w) };
  return { words, ratio: score / 100, stars, understood: score >= 60, tip, assessed: true, score, parts: { frase: build.score, voz: pron }, issues: build.issues };
}

/** Lo que dijo, tal cual: el texto sin formato de Azure o, si no viene, sus palabras evaluadas. */
function saidText(assessment) {
  // El texto con puntuación permite revisar oración por oración; el léxico queda de respaldo.
  return assessment.text || assessment.lexical
    || (assessment.words ?? []).filter((w) => w.error !== 'Insertion' && w.error !== 'Omission').map((w) => w.word).join(' ');
}

/**
 * Con juez (Azure OpenAI): su nota pesa 65 % y la de las reglas 35 %. Los errores que explica el juez van primero;
 * los de las reglas completan. Si cualquiera de los dos ve un error de gramática, no hay 5 estrellas.
 */
function withJudge(build, judgment) {
  if (!judgment) return build;
  const issues = [...judgment.errors.map((e) => ({ id: 'juez', es: e.es })), ...build.issues.filter((x) => x.id !== 'empty')]
    .filter((x, i, all) => all.findIndex((o) => o.es === x.es) === i).slice(0, 2);
  const ruleGrammar = build.issues.filter((x) => !['missing', 'order', 'short', 'no-verb', 'empty'].includes(x.id)).length;
  return { ...build, score: Math.round(0.65 * judgment.score + 0.35 * build.score), issues, judged: true, judgeErrors: judgment.errors.length, ruleGrammar, corrected: judgment.corrected };
}

/** Une construcción y pronunciación en una nota de respuesta libre (mitad y mitad). */
function freeAnswer(text, models, assessment, judgment = null) {
  const build = withJudge(constructionScore(assessment ? saidText(assessment) || text : text, models), judgment);
  const grammar = build.judged ? Math.max(build.ruleGrammar, build.judgeErrors)
    : build.issues.filter((x) => !['missing', 'order', 'short', 'no-verb', 'empty'].includes(x.id)).length;
  if (!assessment) {
    return { build, stars: starsFor(build.score, { build: build.score, pron: 0, grammar, measured: false, judge: judgment?.score ?? null }), score: build.score, parts: { frase: build.score } };
  }
  const pron = pronunciationScore(assessment, { scripted: false });
  const score = Math.round(0.5 * pron + 0.5 * build.score);
  return { build, stars: starsFor(score, { build: build.score, pron, grammar, judge: judgment?.score ?? null }), score, parts: { frase: build.score, voz: pron } };
}

const isOpenTurn = (step) => step.show === 'free' && Boolean(step.say.alts?.length);
const CONTENT_STOP = new Set(['a', 'an', 'the', 'i', 'you', 'we', 'it', 'is', 'am', 'are', 'to', 'of', 'for', 'and', 'in', 'on', 'at', 'that', 'this', 'please', 'will', 'can', 'me', 'my', 'your', 'be']);
const contentWords = (text) => sense(text).filter((w) => !CONTENT_STOP.has(w));
const GENERIC = new Set(['tonight', 'today', 'now', 'good', 'great', 'nice', 'ok', 'yes', 'no', 'right', 'time', 'here', 'there', 'sure', 'thank', 'so', 'very', 'really', 'just', 'some', 'all', 'one', 'like']);
const spokenWords = (assessment, okFrom) => (assessment.words ?? []).filter((w) => w.error !== 'Insertion')
  .map((w) => ({ w: String(w.word).replace(/^i(?=$|')/, 'I'), ok: w.accuracy >= okFrom, accuracy: Math.round(w.accuracy) }));

/**
 * Turno sin frase a la vista: vale cualquier frase bien armada que responda a la situación, con sus palabras.
 * Lo que se califica es CÓMO la arma (orden, piezas, gramática) y cómo la pronuncia; no que repita un modelo.
 * Si no responde a lo que pide el turno, no se regaña: se muestra una forma de decirlo y no pasa de 2 estrellas.
 */
export function openTurnResult(step, { heard, assessment, judgment = null }) {
  const text = assessment?.text ?? heard ?? '';
  const options = step.say.alts;
  const best = options.map((option) => ({ option, cmp: compareSpeech(option, text) })).sort((a, b) => b.cmp.ratio - a.cmp.ratio)[0];
  const said = new Set(sense(text));
  const overlap = Math.max(...options.map((option) => {
    // «tonight», «good»… no prueban que hable del tema: no cuentan para parecerse a un modelo.
    const wanted = contentWords(option);
    return wanted.length ? wanted.filter((w) => said.has(w) && !GENERIC.has(w)).length / wanted.length : 0;
  }));
  // Responde al tema si usa las palabras de la situación (las del cliente o las de cualquier forma correcta),
  // aunque arme su propia frase: lo que se califica después es cómo la arma.
  const topic = new Set([...options, step.guest?.en ?? ''].flatMap(contentWords));
  // Palabras de relleno («tonight», «yes», «good»…) no prueban que hable del tema.
  const mine = [...new Set(contentWords(text))].filter((w) => !GENERIC.has(w));
  const hits = mine.filter((w) => topic.has(w)).length;
  const close = best.cmp.ratio >= 0.5 || overlap >= 0.5;
  // El juez entiende el sentido: acepta otras palabras y descarta coincidencias sueltas. Lo muy parecido a un modelo vale siempre.
  const byWords = hits >= 2 || (hits >= 1 && hits / Math.max(mine.length, 1) >= 0.5);
  // Si el jurado empata (null), desempatan las palabras de la situación.
  const matched = close || (judgment && judgment.onTopic !== null ? judgment.onTopic : byWords);
  const graded = freeAnswer(text, options, assessment, judgment);
  if (!matched) return { words: [], ratio: best.cmp.ratio, stars: Math.min(graded.stars, 1), understood: false, tip: null, matched: false, model: step.say.en, heard: text, issues: graded.build.issues, judged: Boolean(judgment) };
  const words = assessment ? spokenWords(assessment, 40) : best.cmp.words;
  const weakest = words.filter((x) => !x.ok).sort((a, b) => a.accuracy - b.accuracy)[0];
  return { words, ratio: graded.score / 100, stars: Math.max(graded.stars, 1), understood: graded.score >= 60, tip: weakest ? { word: weakest.w, text: tipFor(weakest.w) } : null, assessed: Boolean(assessment), score: graded.score, parts: graded.parts, issues: graded.build.issues, matched: true, model: graded.build.model ?? best.option, ...betterWay(graded.build, text) };
}

/** «Mejor así»: la frase del alumno con lo mínimo corregido, solo si el juez la cambió. */
function betterWay(build, text) {
  if (!build.judged) return { judged: false };
  const same = sense(build.corrected).join(' ') === sense(text).join(' ');
  return { judged: true, corrected: build.corrected && !same ? build.corrected : null };
}

/** Contexto para el juez: solo turnos donde el alumno arma su propia frase. La lectura guiada no lo necesita. */
export async function judgeContext(db, user, { tipo, id, index }, now) {
  const { practice } = (await load(db, user, now)).state;
  if (tipo === 'mesa') {
    const step = practice.tables.current?.id === id ? practice.tables.current.steps[index] : null;
    return step && isOpenTurn(step) ? { guest: step.guest.en, goal: step.say.goal ?? null, models: step.say.alts } : null;
  }
  const current = practice.improve.current;
  if (tipo === 'mejorar' && current?.id === id && current.mode === 'pronunciar') return { guest: current.text ?? null, goal: current.guide ?? null, models: [current.sample] };
  return null;
}

/** La frase guía la decide el servidor: el alumno no puede cambiar contra qué se le evalúa. */
export async function speechTarget(db, user, { tipo, id, index }, now) {
  const { practice } = (await load(db, user, now)).state;
  if (tipo === 'mesa') {
    const mesa = practice.tables.current;
    if (!mesa || mesa.id !== id || mesa.finished) return null;
    const step = mesa.steps[index];
    if (!step) return null;
    // Sin la frase a la vista, cualquier forma correcta vale: se evalúa lo que dijo, sin frase de referencia.
    return isOpenTurn(step) ? '' : step.say.en;
  }
  if (tipo === 'mejorar') {
    const current = practice.improve.current;
    if (!current || current.id !== id) return null;
    return current.mode === 'pronunciar' ? '' : current.en; // '' = respuesta libre, sin frase de referencia
  }
  return null;
}

function freshPractice() {
  return {
    season: season().id,
    learn: { pack: [], topic: null, count: 0, counted: false, recent: [] },
    tables: { nextId: 1, count: 0, current: null, recent: [], weak: [] },
    improve: { attempts: 0, paid: false, current: null, nextId: 1, recent: [], replies: [] },
  };
}

function withMemory(before) {
  const practice = freshPractice();
  if (!before) return practice;
  practice.learn.recent = before.learn?.recent ?? [];
  practice.tables.recent = before.tables?.recent ?? [];
  practice.improve.recent = before.improve?.recent ?? [];
  practice.improve.replies = before.improve?.replies ?? [];
  if ((before.season ?? 0) === season().id) practice.tables.weak = before.tables?.weak ?? [];
  return practice;
}

async function load(db, user, now) {
  const session = await getSession(db, user, now);
  // Día nuevo: el progreso empieza en cero, pero sigue la memoria de lo visto para no repetir ejercicios.
  if (!session.state.practice) {
    const row = await db.prepare('SELECT state FROM daily_sessions WHERE user_id=? AND local_date<? ORDER BY local_date DESC LIMIT 1').get(user.id, session.sessionDate);
    let before = null;
    try { before = row ? JSON.parse(row.state).practice ?? null : null; } catch { before = null; }
    session.state.practice = withMemory(before);
  }
  // Temporada nueva a mitad del día: igual, y solo sigue el contador que identifica las mesas.
  if ((session.state.practice.season ?? 0) !== season().id) {
    const nextId = session.state.practice.tables?.nextId ?? 1;
    session.state.practice = withMemory(session.state.practice);
    session.state.practice.tables.nextId = nextId;
  }
  // Jornadas empezadas con una versión anterior.
  const { learn, improve } = session.state.practice;
  learn.recent ??= [];
  learn.count ??= 0;
  improve.paid ??= Boolean(improve.done);
  improve.current ??= null;
  improve.nextId ??= 1;
  improve.recent ??= [];
  improve.replies ??= [];
  return session;
}

async function save(db, user, session, now) {
  await db.prepare('UPDATE daily_sessions SET state=?, last_action_at=? WHERE user_id=? AND local_date=?')
    .run(JSON.stringify(session.state), now, user.id, session.sessionDate);
}

function planOf(p) {
  const steps = {
    learn: p.learn.count >= GOALS.learn,
    tables: p.tables.count >= GOALS.tables,
    improve: p.improve.attempts >= GOALS.improve,
  };
  return {
    learn: { done: steps.learn, count: p.learn.count, goal: GOALS.learn, xp: RULES.XP_LESSON },
    tables: { done: steps.tables, count: p.tables.count, goal: GOALS.tables, xp: RULES.XP_SIMULATION, open: Boolean(p.tables.current && !p.tables.current.finished) },
    improve: { done: steps.improve, count: p.improve.attempts, goal: GOALS.improve, xp: RULES.XP_REVIEW },
    doneCount: Object.values(steps).filter(Boolean).length,
    total: 3,
    allDone: Object.values(steps).every(Boolean),
    next: !steps.learn ? 'learn' : !steps.tables ? 'tables' : !steps.improve ? 'improve' : null,
  };
}

export async function getPlan(db, user, now) {
  const session = await load(db, user, now);
  const { improve } = session.state.practice;
  // Quien ya pasó la meta nueva con la anterior a medias no se queda sin su día.
  if (!improve.paid && improve.attempts >= GOALS.improve) {
    improve.paid = true;
    await settle(db, user, session, 'p_improve', RULES.XP_REVIEW, now);
    await save(db, user, session, now);
  }
  return planOf(session.state.practice);
}

const noRewards = () => ({ xp: 0, coins: 0, bonus: 0, newDay: false, achievements: [] });

/** Paga una sola vez por día, al llegar a la meta de la sección. La racha pide las tres secciones completas. */
async function settle(db, user, session, key, xp, now) {
  const today = localDate(now, user.timezone);
  const rewards = noRewards();
  if (await award(db, user.id, seasonKey(`${key}:${today}`), { xp }, now)) rewards.xp = xp;
  const plan = planOf(session.state.practice);
  if (plan.allDone) {
    const r = await validatePracticeDay(db, user, 'full', now);
    rewards.coins = r.coins;
    rewards.bonus = r.bonus;
    rewards.newDay = r.newDay;
  }
  return { rewards, plan };
}

// --- Aprender ---
async function seenPhrases(db, user) {
  const prefix = seasonKey('frase:');
  const rows = await db.prepare('SELECT key FROM reward_events WHERE user_id=? AND key LIKE ? ORDER BY created_at').all(user.id, `${prefix}%`);
  return rows.map((r) => r.key.slice(prefix.length)).filter((id) => FRASE_BY_ID.has(id));
}

const wordKey = (en) => tokens(en).join(' ');
const FILLER = new Set(['the', 'a', 'an', 'your', 'you', 'i', 'is', 'are', 'it', 'to', 'for', 'of', 'and', 'or', 'with', 'in', 'on', 'at', 'this', 'that', 'please', 'my', 'we']);
const realWords = (frase) => frase.words.map(([en]) => wordKey(en)).filter((w) => !FILLER.has(w));

/** Las palabras que ya vio no se repiten: cada frase muestra solo las nuevas. */
function withFreshWords(pack, known) {
  const seen = new Set(known);
  return pack.map((frase) => {
    const fresh = frase.words.filter(([en]) => {
      const key = wordKey(en);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { ...frase, fresh };
  });
}

/** Arma la tanda al azar evitando que dos frases compartan palabras importantes y prefiriendo las que enseñan algo nuevo. */
function diversePack(candidates, knownWords, size) {
  const picked = [];
  const used = new Set();
  const teachesNew = (x) => x.words.some(([en]) => !knownWords.has(wordKey(en)) && !FILLER.has(wordKey(en)));
  const add = (test) => {
    for (const x of candidates) {
      if (picked.length >= size) return;
      if (!picked.includes(x) && test(x)) { picked.push(x); realWords(x).forEach((w) => used.add(w)); }
    }
  };
  add((x) => teachesNew(x) && !realWords(x).some((w) => used.has(w)));
  add(teachesNew);
  add(() => true);
  return picked;
}

function samplePhrases(list, size, rng) {
  const pool = [...list];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}

// --- Temas: las palabras del Diccionario VIP en juegos ---
const GAME_WORDS = 8;
// Una palabra que se dice igual en los dos idiomas (mojito, pizza) no se juega: está en el diccionario y ya.
const plainWord = (text) => String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(el|la|los|las) /, '');
const playable = (table) => table.rows.filter((r) => plainWord(vipWord(table, r)) !== plainWord(r.es));
const publicRow = (table, row) => (table.kind === 'verbs'
  ? { en: row.present, es: row.es, pron: row.presentPron, past: row.past }
  : { en: row.en, es: row.es, pron: row.pron });

async function practicedVip(db, user) {
  const prefix = seasonKey('vip:');
  const rows = await db.prepare('SELECT key FROM reward_events WHERE user_id=? AND key LIKE ?').all(user.id, `${prefix}%`);
  return rows.map((r) => r.key.slice(prefix.length));
}

export const vipTables = () => ({ tables: VIP_TABLES });

// Frases para «Ordena la frase»: cortas, reales del contenido, y que usan las palabras del tema cuando se puede.
const ORDERABLE = FRASES.filter((f) => { const n = f.en.split(/\s+/).length; return n >= 4 && n <= 8 && !/[()]/.test(f.en); });
export function gameSentences(table, chosen, rng = Math.random, size = 2) {
  const wanted = new Set(chosen.flatMap((r) => tokens(table.kind === 'verbs' ? `${r.present} ${r.past} ${r.third}` : r.en)).filter((w) => !FILLER.has(w) && w.length > 2));
  const uses = ORDERABLE.filter((f) => tokens(f.en).some((w) => wanted.has(w)));
  const picked = samplePhrases(uses, size, rng);
  const rest = samplePhrases(ORDERABLE.filter((f) => !picked.includes(f)), size - picked.length, rng);
  return [...picked, ...rest].map((f) => ({ en: f.en, es: f.es }));
}

export async function generateGame(db, user, now, tema, rng = Math.random) {
  const table = VIP_BY_ID.get(tema);
  if (!table) return { error: 'not_found', message: 'Ese tema no existe.' };
  const session = await load(db, user, now);
  const seen = new Set((await practicedVip(db, user)).filter((k) => k.startsWith(`${tema}:`)).map((k) => k.slice(tema.length + 1)));
  // Primero las que todavía no ha practicado, al azar.
  const rows = playable(table);
  const fresh = samplePhrases(rows.filter((r) => !seen.has(vipWord(table, r))), GAME_WORDS, rng);
  const rest = samplePhrases(rows.filter((r) => !fresh.includes(r)), GAME_WORDS - fresh.length, rng);
  const chosen = samplePhrases([...fresh, ...rest], GAME_WORDS, rng);
  session.state.practice.learn.game = { tema, words: chosen.map((r) => vipWord(table, r)), counted: false };
  await save(db, user, session, now);
  return {
    theme: { id: table.id, title: table.title, kind: table.kind ?? 'words' },
    words: chosen.map((r) => publicRow(table, r)),
    pool: rows.map((r) => publicRow(table, r)),
    sentences: gameSentences(table, chosen, rng),
  };
}

export async function finishGame(db, user, now) {
  const session = await load(db, user, now);
  const { learn } = session.state.practice;
  const game = learn.game;
  if (!game) return { error: 'not_found', message: 'Primero abre un tema.' };
  for (const word of game.words) await award(db, user.id, seasonKey(`vip:${game.tema}:${word}`), {}, now);
  if (!game.counted) { game.counted = true; learn.count += 1; }
  const out = learn.count >= GOALS.learn
    ? await settle(db, user, session, 'p_learn', RULES.XP_LESSON, now)
    : { rewards: noRewards(), plan: planOf(session.state.practice) };
  await save(db, user, session, now);
  return out;
}

export async function learnHome(db, user, now) {
  const session = await load(db, user, now);
  const seen = await seenPhrases(db, user);
  const known = new Set(seen);
  // Las palabras que va aprendiendo quedan guardadas para repasarlas cuando quiera.
  const learned = new Map();
  for (const id of seen) for (const [en, es] of FRASE_BY_ID.get(id).words) {
    const key = wordKey(en);
    if (!FILLER.has(key) && !learned.has(key)) learned.set(key, [en, es]);
  }
  return {
    learned: [...learned.values()],
    count: session.state.practice.learn.count,
    goal: GOALS.learn,
    seen: seen.length,
    total: FRASES.length,
    themes: await (async () => {
      const seenVip = new Set(await practicedVip(db, user));
      return VIP_TABLES.map((t) => { const rows = playable(t); return { id: t.id, title: t.title, total: rows.length, seen: rows.filter((r) => seenVip.has(`${t.id}:${vipWord(t, r)}`)).length }; });
    })(),
    topics: TOPICS.map((t) => {
      const list = FRASES.filter((x) => x.topic === t.id);
      return { ...t, total: list.length, seen: list.filter((x) => known.has(x.id)).length };
    }),
  };
}

/** Cada toque arma una tanda al azar de todos los temas (o de uno), sin repetir lo reciente. */
export async function generateLearn(db, user, now, topic = null, rng = Math.random) {
  const session = await load(db, user, now);
  const { learn } = session.state.practice;
  const validTopic = TOPICS.some((t) => t.id === topic) ? topic : null;
  const all = validTopic ? FRASES.filter((x) => x.topic === validTopic) : FRASES;
  const recent = new Set(learn.recent);
  // Primero lo que nunca ha visto, al azar; cuando se acaba, lo que no vio hace poco.
  const known = new Set(await seenPhrases(db, user));
  const open = all.filter((x) => !recent.has(x.id));
  const unseen = open.filter((x) => !known.has(x.id));
  const knownWords = new Set([...known].flatMap((id) => FRASE_BY_ID.get(id)?.words.map(([en]) => wordKey(en)) ?? []));
  // Las frases practican lo que ya jugó en los Temas: primero las que usan esas palabras.
  const vipKnown = new Set((await practicedVip(db, user)).flatMap((k) => tokens(k.slice(k.indexOf(':') + 1))).filter((w) => !FILLER.has(w)));
  const usesPracticed = (x) => tokens(x.en).filter((w) => vipKnown.has(w));
  const shuffled = samplePhrases(unseen, unseen.length, rng);
  const ordered = [...shuffled.filter((x) => usesPracticed(x).length), ...shuffled.filter((x) => !usesPracticed(x).length)];
  const pick = diversePack(ordered, knownWords, PACK_SIZE);
  const rest = samplePhrases(open.filter((x) => !pick.includes(x)), PACK_SIZE - pick.length, rng);
  const filler = samplePhrases(all.filter((x) => !pick.includes(x) && !rest.includes(x)), PACK_SIZE - pick.length - rest.length, rng);
  const pack = withFreshWords(samplePhrases([...pick, ...rest, ...filler], PACK_SIZE, rng), knownWords).map((x) => ({ ...x, practiced: [...new Set(usesPracticed(x))].slice(0, 3) }));
  learn.pack = pack.map((x) => x.id);
  learn.topic = validTopic;
  learn.counted = false;
  learn.recent = [...learn.pack, ...learn.recent].slice(0, RECENT_PHRASES);
  await save(db, user, session, now);
  return { pack, topic: validTopic, distractors: samplePhrases(FRASES.filter((x) => !learn.pack.includes(x.id)), 20, rng).map((x) => x.es) };
}

export async function finishLearn(db, user, now) {
  const session = await load(db, user, now);
  const { learn } = session.state.practice;
  if (!learn.pack.length) return { error: 'not_found', message: 'Primero abre tus frases.' };
  for (const id of learn.pack) await award(db, user.id, seasonKey(`frase:${id}`), {}, now);
  if (!learn.counted) { learn.counted = true; learn.count += 1; }
  const out = learn.count >= GOALS.learn
    ? await settle(db, user, session, 'p_learn', RULES.XP_LESSON, now)
    : { rewards: noRewards(), plan: planOf(session.state.practice) };
  await save(db, user, session, now);
  return out;
}

// --- Mesas ---
/** Nivel y propinas valen para todos los días. La propina va en la clave: mesa_done:fecha:id:propina. */
async function mesaStats(db, user) {
  const rows = await db.prepare("SELECT key FROM reward_events WHERE user_id=? AND key LIKE 'mesa_done:%' AND created_at>=?").all(user.id, seasonStart());
  return { done: rows.length, tips: rows.reduce((n, r) => n + (Number(r.key.split(':')[3]) || 0), 0) };
}
const progressOf = ({ done, tips }) => ({ ...levelFor(done), tips });
export const mesaProgress = async (db, user) => progressOf(await mesaStats(db, user));
// Sin revisión automática, decidir "me salió bien" vale poco: la propina premia lo evaluado.
const tipOf = (attempt) => (!attempt ? 0 : attempt.selfCheck ? 1 : attempt.stars) * TIP_PER_STAR;

export function mesaTip(steps, attempts) {
  const earned = steps.reduce((n, _, i) => n + tipOf(attempts[i]), 0);
  const perfect = steps.every((_, i) => attempts[i]?.stars === MAX_STARS && !attempts[i].selfCheck);
  return { tip: earned + (perfect ? PERFECT_BONUS : 0), perfect };
}

export function assignHelp(steps, level, done, rng = Math.random) {
  if (done < GUIDED_MESAS) return steps.map(() => 'en');
  const chance = SHOW_ENGLISH[level] ?? SHOW_ENGLISH[1];
  const show = steps.map(() => (rng() < chance ? 'en' : 'free'));
  // Siempre hay de los dos tipos, y el primer turno nunca deja solo al alumno en los niveles bajos.
  if (!show.includes('free')) show[steps.length - 1] = 'free';
  if (!show.includes('en')) show[0] = 'en';
  if (level <= 2) show[0] = 'en';
  if (!show.includes('free') && steps.length > 1) show[steps.length - 1] = 'free';
  return show;
}

function publicMesa(mesa) {
  const { steps, ...rest } = mesa;
  return { ...rest, steps: steps.map(({ keep, linked, ...s }) => {
    const { alts, ...say } = s.say;
    return { ...s, say: { ...say, pron: pronounce(s.say.en), goal: goalFor(s.say) } };
  }) };
}

export async function generateMesa(db, user, now, rng = Math.random) {
  const session = await load(db, user, now);
  const { tables } = session.state.practice;
  const { done } = await mesaStats(db, user);
  const mesa = buildMesa(rng, { done, ...recentFrom(tables.recent) });
  assignHelp(mesa.steps, mesa.level, done, rng).forEach((show, i) => { mesa.steps[i].show = show; });
  tables.recent = [mesaKey(mesa), ...tables.recent].slice(0, 10);
  tables.current = { id: tables.nextId, ...mesa, attempts: {}, finished: false };
  tables.nextId += 1;
  await save(db, user, session, now);
  return { mesa: publicMesa(tables.current) };
}

export async function currentMesa(db, user, now) {
  const { tables } = (await load(db, user, now)).state.practice;
  const mesa = tables.current;
  return { mesa: mesa && !mesa.finished ? publicMesa(mesa) : null, count: tables.count, goal: GOALS.tables, progress: progressOf(await mesaStats(db, user)) };
}

function bestAttempt(attempts, index, result) {
  const prev = attempts[index];
  attempts[index] = { stars: Math.max(prev?.stars ?? 0, result.stars), tries: (prev?.tries ?? 0) + 1, selfCheck: result.selfCheck || prev?.selfCheck || false };
}

export async function mesaTurn(db, user, mesaId, { index, heard, selfCheck, assessment, judgment = null }, now) {
  const session = await load(db, user, now);
  const mesa = session.state.practice.tables.current;
  if (!mesa || mesa.id !== mesaId || mesa.finished) return { error: 'not_found', message: 'Esa mesa ya terminó. Genera otra.' };
  const step = mesa.steps[index];
  if (!step) return { error: 'not_found', message: 'Ese turno no existe.' };
  const result = isOpenTurn(step) && !selfCheck ? openTurnResult(step, { heard, assessment, judgment })
    : assessment ? assessedResult(step.say.en, assessment)
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
  if (mesa.finished) return { duplicate: true, rewards: noRewards(), plan: planOf(session.state.practice), summary: mesa.summary };
  const answered = mesa.steps.filter((_, i) => mesa.attempts[i]).length;
  if (answered < Math.ceil(mesa.steps.length / 2)) return { error: 'too_short', message: 'Atiende un poco más la mesa para terminarla.' };
  const graded = Object.values(mesa.attempts).filter((a) => !a.selfCheck);
  const stars = graded.length ? Math.round(graded.reduce((n, a) => n + a.stars, 0) / graded.length) : null;
  const weak = mesa.steps.filter((_, i) => mesa.attempts[i] && !mesa.attempts[i].selfCheck && mesa.attempts[i].stars < 4).map((s) => s.say);
  tables.weak = [...weak, ...tables.weak].filter((x, i, all) => all.findIndex((o) => o.en === x.en) === i).slice(0, 12);
  mesa.finished = true;
  const { tip, perfect } = mesaTip(mesa.steps, mesa.attempts);
  mesa.summary = { stars, answered, total: mesa.steps.length, weak: weak.slice(0, 3), selfCheck: stars === null, tip, perfect };
  tables.count += 1;
  const before = levelFor((await mesaStats(db, user)).done).level;
  await award(db, user.id, `mesa_done:${session.sessionDate}:${mesa.id}:${tip}`, { coins: tip }, now);
  const progress = progressOf(await mesaStats(db, user));
  const out = tables.count >= GOALS.tables
    ? await settle(db, user, session, 'p_mesa', RULES.XP_SIMULATION, now)
    : { rewards: noRewards(), plan: planOf(session.state.practice) };
  out.progress = progress;
  out.levelUp = progress.level > before;
  if (await grantAchievement(db, user.id, 'first_conversation', now)) out.rewards.achievements.push('first_conversation');
  const confirmIndex = mesa.steps.findIndex((s) => s.kind === 'confirm');
  if ((mesa.attempts[confirmIndex]?.stars ?? 0) >= 3 && await grantAchievement(db, user.id, 'confirmed_order', now)) out.rewards.achievements.push('confirmed_order');
  await save(db, user, session, now);
  return { ...out, summary: mesa.summary };
}

// --- Pronunciar y escuchar ---
// Infinito: cada toque genera algo nuevo. Cuenta cada audio o situación una vez, aunque se repita.
const RECENT_LINES = 150;
const RECENT_REPLIES = 25;

export function answerFits(heard, need) {
  const said = sense(heard);
  return need.every((group) => group.some((word) => {
    const [wanted] = sense(word);
    return wanted === undefined ? false : said.some((w) => w === wanted || typoKind(w, wanted) === 'safe');
  }));
}

/** Respuesta libre: la pronunciación se mide sobre lo que dijo; el contenido, por palabras clave. */
export function replyResult(current, { heard, selfCheck, assessment, judgment = null }) {
  const base = { sample: current.sample, samplePron: pronounce(current.sample) };
  if (selfCheck) return { ...base, words: [], ratio: null, stars: 0, understood: true, tip: null, selfCheck: true };
  const text = assessment?.text ?? heard ?? '';
  const answered = answerFits(text, current.need) || judgment?.onTopic === true;
  const graded = freeAnswer(text, [current.sample], assessment, judgment);
  // Si no responde a lo que se pidió, la pronunciación sola no da la propina completa.
  const stars = answered ? Math.max(graded.stars, 1) : graded.stars >= 4 ? 2 : 1;
  if (!assessment) return { ...base, words: [], ratio: graded.score / 100, stars, understood: answered, tip: null, answered, heard: text, parts: graded.parts, issues: graded.build.issues };
  // Sin frase de referencia, Azure es más severo con palabras átonas: solo se marca lo claramente flojo.
  const words = spokenWords(assessment, 40);
  const weakest = words.filter((x) => !x.ok).sort((a, b) => a.accuracy - b.accuracy)[0];
  return { ...base, words, ratio: graded.score / 100, stars, understood: graded.score >= 60, tip: weakest ? { word: weakest.w, text: tipFor(weakest.w) } : null, assessed: true, score: graded.score, parts: graded.parts, issues: graded.build.issues, answered, heard: text, ...betterWay(graded.build, text) };
}

export async function improveHome(db, user, now) {
  const { improve } = (await load(db, user, now)).state.practice;
  return { attempts: improve.attempts, goal: GOALS.improve, done: improve.attempts >= GOALS.improve };
}

/** Una línea de cliente de cualquier situación de Mesas: corta, y sin depender de lo anterior. */
function guestLine(rng) {
  const lines = buildMesa(rng, { done: 20 }).steps.map((s) => s.guest).filter((g) => tokens(g.en).length >= 3 && tokens(g.en).length <= 12);
  if (!lines.length) return null;
  const { en, es } = lines[Math.floor(rng() * lines.length)];
  return { en, es, who: 'cliente' };
}

function pickLine(practice, rng) {
  const { improve, tables } = practice;
  const recent = new Set(improve.recent);
  // De vez en cuando vuelve lo que costó en una mesa.
  const weak = tables.weak.filter((x) => !recent.has(x.en));
  if (weak.length && rng() < 0.2) return weak[Math.floor(rng() * weak.length)];
  // Al mesero le sirve sobre todo entender a sus clientes, y de vez en cuando oír sus propias frases.
  for (let i = 0; i < 10; i++) {
    const roll = rng();
    const line = roll < 0.6 ? guestLine(rng) : roll < 0.8 ? { ...clientLine(rng), who: 'cliente' } : { ...FRASES[Math.floor(rng() * FRASES.length)], who: 'mesero' };
    if (line && !recent.has(line.en)) return line;
  }
  return { ...FRASES[Math.floor(rng() * FRASES.length)], who: 'mesero' };
}

export async function generateImprove(db, user, mode, now, rng = Math.random) {
  const session = await load(db, user, now);
  const { improve } = session.state.practice;
  const id = improve.nextId;
  improve.nextId += 1;
  const { azure, voice, accent } = CAST[Math.floor(rng() * CAST.length)];
  const persona = { azure, voice, accent, mood: 'friendly' };
  let item;
  if (mode === 'escuchar') {
    const { en, es, who = 'mesero' } = pickLine(session.state.practice, rng);
    improve.current = { id, mode, en, es };
    improve.recent = [en, ...improve.recent].slice(0, RECENT_LINES);
    item = { id, mode, en, es, who, pron: pronounce(en), persona };
  } else {
    const reply = buildReply(rng, improve.replies);
    improve.current = { id, mode: 'pronunciar', sample: reply.sample, need: reply.need, text: reply.text, guide: reply.guide };
    improve.replies = [reply.index, ...improve.replies].slice(0, RECENT_REPLIES);
    item = { id, mode: 'pronunciar', kind: reply.kind, text: reply.text, es: reply.es, guide: reply.guide, hint: reply.hint, hintPron: pronounce(reply.hint), persona };
  }
  await save(db, user, session, now);
  return { item };
}

export async function improveAttempt(db, user, { id, heard, selfCheck, assessment, judgment = null }, now) {
  const session = await load(db, user, now);
  const { improve } = session.state.practice;
  const current = improve.current;
  if (!current || current.id !== id) return { error: 'not_found', message: 'Eso ya cambió. Genera otro.' };
  const result = current.mode === 'pronunciar' ? replyResult(current, { heard, selfCheck, assessment, judgment })
    : assessment ? assessedResult(current.en, assessment)
      : selfCheck ? { words: current.en.split(/\s+/).map((w) => ({ w, ok: true })), ratio: null, stars: 0, understood: true, tip: null, selfCheck: true }
        : compareSpeech(current.en, heard);
  if (!current.counted) { current.counted = true; improve.attempts += 1; }
  let daily = null;
  if (!improve.paid && improve.attempts >= GOALS.improve) {
    improve.paid = true;
    daily = await settle(db, user, session, 'p_improve', RULES.XP_REVIEW, now);
    if (await grantAchievement(db, user.id, 'retried_phrase', now)) daily.rewards.achievements.push('retried_phrase');
  }
  await save(db, user, session, now);
  return { result, attempts: improve.attempts, daily };
}

// --- Ranking ---
// La cuenta de pruebas no compite.
const RANKING_HIDDEN = new Set(['prueba.piloto']);

// Lo único que se muestra del aspecto: qué lleva puesto.
function safeLook(json) {
  const { animal, vest, hat, glasses, neck } = readEquipped(json);
  return { animal, vest, hat, glasses, neck };
}

/** Todas las cuentas activas compiten, también quien administra. Solo se expone nombre visible, racha y propinas. Los empates comparten puesto. */
export async function leaderboard(db, viewer, now) {
  const users = (await db.prepare('SELECT id, username, display_name, timezone, equipped FROM users WHERE active=1').all())
    .filter((u) => !RANKING_HIDDEN.has(u.username));
  const rows = [];
  for (const u of users) {
    const { current } = await streakStats(db, u.id, localDate(now, u.timezone));
    const { tips } = await mesaStats(db, u);
    rows.push({ id: u.id, name: u.display_name, streak: current, tips, look: safeLook(u.equipped) });
  }
  const rank = (field) => {
    const sorted = [...rows].sort((a, b) => b[field] - a[field] || a.name.localeCompare(b.name));
    let pos = 0;
    return sorted.map((r, i) => {
      if (i === 0 || r[field] !== sorted[i - 1][field]) pos = i + 1;
      return { pos, name: r.name, value: r[field], me: r.id === viewer.id, look: r.look };
    });
  };
  const streak = rank('streak');
  const tips = rank('tips');
  const mine = (list) => list.find((r) => r.me)?.pos ?? null;
  return { streak, tips, me: { streak: mine(streak), tips: mine(tips) }, total: rows.length };
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
