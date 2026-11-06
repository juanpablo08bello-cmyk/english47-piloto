// Sesion diaria de 22 minutos y modo breve. El avance depende de respuestas reales,
// nunca del tiempo que la pantalla permanezca abierta. Equivocarse no rompe el habito:
// la racha pide practica activa y relacionada, no aciertos.
import { tx } from './db.js';
import { addDays, diffDays, localDate } from './dates.js';
import { award, grantAchievement, reconcileShields, RULES, validatePracticeDay } from './progress.js';
import { dueVocab, recordResult } from './srs.js';
import { answerHash, buildExercise, checkAnswer, prepareAuthored, publicExercise, seededRng, shuffled } from './exercises.js';
import { VOCAB, VOCAB_BY_ID } from '../content/vocab.js';
import { SCENARIOS, SCENARIO_BY_ID } from '../content/scenarios.js';
import { LESSONS } from '../content/units.js';

const CARRY_OVER_MS = 2 * 60 * 60 * 1000;
const MAX_ACTIVE_GAP_S = 90;
const LEARN_EXERCISES = 5;
export const STEP_ORDER = ['review', 'learn', 'talk', 'improve'];
const CONTEXTUAL_TYPES = new Set(['respond', 'rephrase', 'confirm', 'fix_error']);

async function pickToday(db, user) {
  const count = Math.min(10, Math.max(3, user.daily_new ?? 5));
  const known = new Set((await db.prepare('SELECT vocab_id id FROM vocab_progress WHERE user_id=?').all(user.id)).map((r) => r.id));
  const byPriority = (a, b) => a.difficulty - b.difficulty;
  const fromUnit = VOCAB.filter((v) => v.unit >= user.placement_unit).sort((a, b) => a.unit - b.unit || byPriority(a, b));
  const before = VOCAB.filter((v) => v.unit < user.placement_unit).sort((a, b) => a.unit - b.unit || byPriority(a, b));
  const fresh = [...fromUnit, ...before].filter((v) => !known.has(v.id)).map((v) => v.id).slice(0, count);
  if (fresh.length === count) return fresh;
  const weakest = (await db.prepare('SELECT vocab_id id FROM vocab_progress WHERE user_id=? ORDER BY lapses DESC, used_count ASC, vocab_id LIMIT ?').all(user.id, count)).map((r) => r.id);
  return [...fresh, ...weakest.filter((id) => !fresh.includes(id))].slice(0, count);
}

/** Un ejercicio escrito a mano de la unidad, para variar la sesion sin alargarla. */
function authoredFrom(user, today, salt) {
  const rng = seededRng(`${user.id}:${today}:${salt}`);
  const units = [user.placement_unit, user.placement_unit + 1];
  const pool = LESSONS.filter((l) => units.includes(l.unit)).flatMap((l) => l.exercises ?? []);
  if (!pool.length) return null;
  return prepareAuthored(pool[Math.floor(rng() * pool.length)], rng);
}

async function reviewExercises(db, user, today, todayIds, count, seed, brief) {
  const rng = seededRng(seed);
  const due = (await dueVocab(db, user.id, today, count)).filter((id) => !todayIds.includes(id));
  const learned = (await db.prepare('SELECT vocab_id id FROM vocab_progress WHERE user_id=? ORDER BY COALESCE(last_review_date, introduced_date), vocab_id')
    .all(user.id)).map((r) => r.id).filter((id) => !todayIds.includes(id) && !due.includes(id));
  const chosen = [...due, ...learned].slice(0, count);
  // Sin expresiones aprendidas todavia, se calienta con el catalogo. Solo un error la agenda.
  const warmup = shuffled(VOCAB.filter((v) => v.unit === user.placement_unit && !todayIds.includes(v.id) && !chosen.includes(v.id)), rng).slice(0, count - chosen.length).map((v) => v.id);
  const types = brief ? ['listen_choose', 'complete', 'listen_choose'] : ['listen_choose', 'complete', 'recall', 'respond', 'listen_choose'];
  const items = [...chosen.map((id) => ({ id, warmup: false })), ...warmup.map((id) => ({ id, warmup: true }))];
  const out = items.map((item, i) => ({ ...buildExercise(types[i % types.length], item.id, rng), warmup: item.warmup }));
  return out;
}

async function nextScenario(db, user, today) {
  const best = new Map((await db.prepare(`SELECT scenario_id id, outcome FROM sim_sessions WHERE user_id=? AND status='finished'`).all(user.id)).map((r) => [r.id, r.outcome]));
  if (!best.size) return 'dinner_for_two';
  const resolved = new Set((await db.prepare(`SELECT DISTINCT scenario_id id FROM sim_sessions WHERE user_id=? AND outcome='resolved'`).all(user.id)).map((r) => r.id));
  const ordered = [...SCENARIOS.filter((s) => s.unit >= user.placement_unit), ...SCENARIOS.filter((s) => s.unit < user.placement_unit)];
  const base = ordered.filter((s) => !s.variantOf);
  const next = base.find((s) => !resolved.has(s.id)) ?? ordered.find((s) => !resolved.has(s.id));
  if (next) return next.id;
  const dayNumber = Math.abs(diffDays(today, '2026-01-01'));
  return SCENARIOS[dayNumber % SCENARIOS.length].id;
}

async function createState(db, user, today) {
  const vocabIds = await pickToday(db, user);
  const rng = seededRng(`${user.id}:${today}:learn`);
  const learnTypes = ['complete', 'recall', 'respond', 'repeat', 'listen_choose'];
  const learn = vocabIds.slice(0, LEARN_EXERCISES).map((id, i) => buildExercise(learnTypes[i % learnTypes.length], id, rng));
  const authored = authoredFrom(user, today, 'learn');
  if (authored && learn.length) learn[learn.length - 1] = authored;
  const review = await reviewExercises(db, user, today, vocabIds, 5, `${user.id}:${today}:review`, false);
  const authoredReview = authoredFrom(user, today, 'review');
  if (authoredReview && review.length) review[review.length - 1] = authoredReview;
  return {
    vocabIds,
    activeSeconds: 0,
    minimumMet: false,
    steps: {
      review: { exercises: review, answers: {}, done: false },
      learn: { cardsSeen: false, exercises: learn, answers: {}, done: false },
      talk: { scenarioId: await nextScenario(db, user, today), simId: null, turns: 0, attempts: 0, done: false },
      improve: { items: [], exercises: [], answers: {}, done: false },
    },
    brief: null,
  };
}

/** Sesion de hoy, o la de ayer si sigue en curso cerca de la medianoche. */
async function loadRow(db, user, nowMs) {
  const today = localDate(nowMs, user.timezone);
  const finishedToday = await db.prepare('SELECT * FROM daily_sessions WHERE user_id=? AND completed_date=?').get(user.id, today);
  if (finishedToday) return finishedToday;
  const own = await db.prepare('SELECT * FROM daily_sessions WHERE user_id=? AND local_date=?').get(user.id, today);
  if (own) return own;
  const previous = await db.prepare('SELECT * FROM daily_sessions WHERE user_id=? AND local_date=?').get(user.id, addDays(today, -1));
  if (previous && !previous.completed_date && previous.last_action_at && nowMs - previous.last_action_at < CARRY_OVER_MS) return previous;
  return null;
}

export async function getSession(db, user, nowMs) {
  return await tx(db, async () => {
    await reconcileShields(db, user, nowMs);
    let row = await loadRow(db, user, nowMs);
    if (!row) {
      const today = localDate(nowMs, user.timezone);
      const state = await createState(db, user, today);
      await db.prepare('INSERT INTO daily_sessions (user_id, local_date, state) VALUES (?,?,?)').run(user.id, today, JSON.stringify(state));
      row = await db.prepare('SELECT * FROM daily_sessions WHERE user_id=? AND local_date=?').get(user.id, today);
    }
    return { sessionDate: row.local_date, completedDate: row.completed_date, state: JSON.parse(row.state), lastActionAt: row.last_action_at };
  });
}

async function save(db, user, session, nowMs) {
  const prev = session.lastActionAt;
  if (prev) session.state.activeSeconds += Math.min(MAX_ACTIVE_GAP_S, Math.max(0, Math.round((nowMs - prev) / 1000)));
  else session.state.activeSeconds += 20;
  await db.prepare('UPDATE daily_sessions SET state=?, last_action_at=?, completed_date=? WHERE user_id=? AND local_date=?')
    .run(JSON.stringify(session.state), nowMs, session.completedDate, user.id, session.sessionDate);
  session.lastActionAt = nowMs;
}

const answered = (step) => Object.keys(step.answers).length;
const meaningfulAnswers = (step) => Object.values(step.answers).filter((r) => r.meaningful !== false).length;

/** Practica minima: tres repasos con respuesta real y una respuesta en contexto. Da igual si acierta. */
function meetsMinimum(state) {
  const contextual = (step) => (step?.exercises ?? []).some((e, i) => CONTEXTUAL_TYPES.has(e.type) && step.answers[i] && step.answers[i].meaningful !== false);
  if (state.brief?.done && meaningfulAnswers(state.brief) >= 3 && contextual(state.brief)) return true;
  const { review, learn, talk } = state.steps;
  return meaningfulAnswers(review) >= 3 && (talk.turns > 0 || contextual(review) || contextual(learn));
}

/** Tras cada accion: paga recompensas pendientes y valida la jornada. Todo es idempotente. */
async function settle(db, user, session, nowMs) {
  const { state } = session;
  const today = localDate(nowMs, user.timezone);
  const rewards = { xp: 0, coins: 0, bonus: 0, newDay: false };
  const pay = async (key, xp) => { if (await award(db, user.id, key, { xp }, nowMs)) rewards.xp += xp; };
  const { review, learn, talk, improve } = state.steps;

  review.done = review.done || answered(review) >= review.exercises.length;
  learn.done = learn.done || (learn.cardsSeen && answered(learn) >= learn.exercises.length);
  improve.done = improve.done || (improve.exercises.length > 0 && answered(improve) >= improve.exercises.length);

  const reviewedForReal = (review.done && meaningfulAnswers(review) >= 3) || (state.brief?.done && meaningfulAnswers(state.brief) >= 3);
  if (reviewedForReal) await pay(`review:${today}`, RULES.XP_REVIEW);
  if (learn.done && meaningfulAnswers(learn) >= 3) await pay(`learn:${session.sessionDate}`, RULES.XP_LESSON);

  const validate = async (kind) => {
    const r = await validatePracticeDay(db, user, kind, nowMs);
    rewards.coins += r.coins;
    rewards.bonus += r.bonus;
    rewards.newDay = rewards.newDay || r.newDay;
  };
  if (meetsMinimum(state)) {
    state.minimumMet = true;
    await validate(state.brief?.done && !(review.done && learn.done && talk.done && improve.done) ? 'brief' : 'minimum');
  }
  if (review.done && learn.done && talk.done && improve.done) {
    await validate('full');
    session.completedDate = today;
  }
  return rewards;
}

export async function publicSession(db, user, session, nowMs) {
  const { state } = session;
  const today = localDate(nowMs, user.timezone);
  const day = await db.prepare('SELECT status FROM streak_days WHERE user_id=? AND local_date=?').get(user.id, today);
  const strip = (step) => ({ ...step, exercises: step.exercises.map(publicExercise) });
  const fullDone = STEP_ORDER.every((s) => state.steps[s].done);
  const doneCount = STEP_ORDER.filter((s) => state.steps[s].done).length;
  const next = STEP_ORDER.find((s) => !state.steps[s].done) ?? null;
  const scenario = SCENARIO_BY_ID.get(state.steps.talk.scenarioId);
  const keep = Boolean(user.keep_transcripts);
  return {
    sessionDate: session.sessionDate,
    today,
    vocab: state.vocabIds.map((id) => VOCAB_BY_ID.get(id)).filter(Boolean),
    steps: {
      review: strip(state.steps.review),
      learn: strip(state.steps.learn),
      talk: { ...state.steps.talk, scenario: scenario?.title, scenarioEs: scenario?.titleEs },
      improve: {
        ...strip(state.steps.improve),
        items: state.steps.improve.items.map(({ yours, ...rest }) => (keep ? { yours, ...rest } : rest)),
      },
    },
    brief: state.brief ? strip(state.brief) : null,
    doneCount,
    total: STEP_ORDER.length,
    nextStep: next,
    fullDone,
    activeMinutes: Math.round(state.activeSeconds / 60),
    started: session.lastActionAt != null,
    minimumMet: Boolean(day),
    streakKept: day?.status === 'practiced',
    briefOnly: day?.status === 'practiced' && !fullDone,
  };
}

function stepFor(state, stepName) {
  if (stepName === 'brief') return state.brief;
  return state.steps[stepName] ?? null;
}

const NO_REWARDS = { xp: 0, coins: 0, bonus: 0, newDay: false };

/**
 * Un ejercicio puede repetirse tras una correccion: es la oportunidad de responder de nuevo.
 * Sin retry, una peticion duplicada devuelve el resultado guardado y no suma nada.
 */
export async function answerExercise(db, user, { step, index, answer, retry = false }, nowMs) {
  return await tx(db, async () => {
    const session = await getSession(db, user, nowMs);
    const target = stepFor(session.state, step);
    const ex = target?.exercises?.[index];
    if (!ex) return { error: 'not_found', message: 'Ese ejercicio no existe.' };
    const existing = target.answers[index];
    const hash = answerHash(answer);
    // Doble toque o reenvio tras un corte: se devuelve lo registrado y no se suma nada.
    if (existing && (!retry || existing.correct || existing.answerHash === hash)) {
      return { result: existing, duplicate: true, rewards: NO_REWARDS, session: await publicSession(db, user, session, nowMs) };
    }
    const result = checkAnswer(ex, answer);
    if (ex.type === 'repeat' && !result.correct) {
      return { result, retry: true, rewards: NO_REWARDS, session: await publicSession(db, user, session, nowMs) };
    }
    const today = localDate(nowMs, user.timezone);
    const vocabId = ex.vocabId ?? ex.vocabRef ?? null;
    // Lo acertado en el calentamiento no se agenda; lo fallado si, porque se promete que vuelve.
    // Un reintento fallido no cuenta como otro fallo.
    let scheduled = false;
    if (vocabId && result.srs !== 'none') {
      const isFail = result.srs === 'fail';
      if (!(ex.warmup && !isFail) && !(existing && isFail)) {
        await recordResult(db, user.id, vocabId, { level: result.level, correct: !isFail }, today);
      }
      scheduled = isFail;
    }
    const saved = { ...result, reviewScheduled: scheduled, retried: Boolean(existing), answerHash: hash };
    target.answers[index] = saved;

    // El logro exige una respuesta nueva, no escuchar el audio.
    const newAttempt = existing && retry && result.meaningful;
    if ((step === 'improve' || newAttempt) && await grantAchievement(db, user.id, 'retried_phrase', nowMs)) saved.earnedRetry = true;
    if (step === 'brief' && answered(target) >= target.exercises.length) target.done = true;
    const rewards = await settle(db, user, session, nowMs);
    await save(db, user, session, nowMs);
    return { result: saved, rewards, session: await publicSession(db, user, session, nowMs) };
  });
}

export async function markCardsSeen(db, user, nowMs) {
  return await tx(db, async () => {
    const session = await getSession(db, user, nowMs);
    const learn = session.state.steps.learn;
    if (!learn.cardsSeen) {
      learn.cardsSeen = true;
      const today = localDate(nowMs, user.timezone);
      for (const id of session.state.vocabIds) {
        await db.prepare(
          `INSERT INTO vocab_progress (user_id, vocab_id, stage, due_date, introduced_date) VALUES (?,?,0,?,?) ON CONFLICT DO NOTHING`,
        ).run(user.id, id, addDays(today, 1), today);
      }
      await save(db, user, session, nowMs);
    }
    return await publicSession(db, user, session, nowMs);
  });
}

export async function startBrief(db, user, nowMs) {
  return await tx(db, async () => {
    const session = await getSession(db, user, nowMs);
    if (!session.state.brief) {
      const today = localDate(nowMs, user.timezone);
      const rng = seededRng(`${user.id}:${today}:brief`);
      const exercises = await reviewExercises(db, user, today, [], 3, `${user.id}:${today}:brief-r`, true);
      const taken = new Set(exercises.map((e) => e.vocabId));
      const contextId = shuffled(session.state.vocabIds.filter((id) => !taken.has(id)), rng)[0] ?? session.state.vocabIds[0];
      session.state.brief = { exercises: [...exercises, buildExercise('respond', contextId, rng)], answers: {}, done: false };
      await db.prepare('UPDATE daily_sessions SET state=? WHERE user_id=? AND local_date=?').run(JSON.stringify(session.state), user.id, session.sessionDate);
    }
    return await publicSession(db, user, session, nowMs);
  });
}

export async function linkSimulation(db, user, simId, scenarioId, nowMs) {
  const session = await getSession(db, user, nowMs);
  session.state.steps.talk.simId = simId;
  session.state.steps.talk.scenarioId = scenarioId;
  await db.prepare('UPDATE daily_sessions SET state=? WHERE user_id=? AND local_date=?').run(JSON.stringify(session.state), user.id, session.sessionDate);
}

/** Solo una respuesta relacionada cuenta como practica en contexto. */
export async function noteTalkTurn(db, user, simId, meaningful, nowMs) {
  return await tx(db, async () => {
    const session = await getSession(db, user, nowMs);
    const talk = session.state.steps.talk;
    if (talk.simId !== simId || !meaningful) return null;
    talk.turns += 1;
    const rewards = await settle(db, user, session, nowMs);
    await save(db, user, session, nowMs);
    return rewards;
  });
}

/**
 * Cierra el paso de conversacion solo si la escena se recorrio. Terminar antes deja el paso
 * pendiente: el alumno puede volver a empezar sin perder lo que ya practico.
 * summary es la version guardada: sin citas, salvo que el alumno haya dado permiso.
 */
export async function finishTalkStep(db, user, simId, summary, outcome, nowMs) {
  return await tx(db, async () => {
    const session = await getSession(db, user, nowMs);
    const { talk, improve } = session.state.steps;
    if (talk.simId !== simId || talk.done) return null;
    talk.attempts = (talk.attempts ?? 0) + 1;
    talk.lastOutcome = outcome;
    if (outcome === 'attempted') {
      talk.simId = null;
      const rewards = await settle(db, user, session, nowMs);
      await save(db, user, session, nowMs);
      return rewards;
    }
    talk.done = true;
    improve.items = summary.improvements;
    const text = summary.improvements[0]?.corrected ?? summary.modelLine;
    improve.exercises = [{ type: 'repeat', vocabId: null, audio: text, prompt: 'Escucha la versión mejorada y repítela', text }];
    const rewards = await settle(db, user, session, nowMs);
    await save(db, user, session, nowMs);
    return rewards;
  });
}
