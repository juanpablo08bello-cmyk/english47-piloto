import { pilotWavSeconds } from './voice/wav.js';
// Servidor HTTP sin framework: rutas pequenas y explicitas, todas filtradas por usuario.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize as normalizePath, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  createInvitation, createLoginLimiter, createSession, destroySession, activeStudents,
  MAX_STUDENTS, pendingStudentInvites, redeemInvitation, userFromToken, verifyPassword, MIN_PASSWORD, setPassword, temporaryPassword,
} from './auth.js';
import { addDays, isValidTimeZone, localDate, localHour } from './dates.js';
import { tx } from './db.js';
import {
  ACHIEVEMENTS, award, balance, buyItem, calendar, grantAchievement, nextReward, ownedItems, readEquipped, reconcileShields, RULES, SHOP_ITEMS, streakStats, writeEquipped, xpLevel,
} from './progress.js';
import {
  answerExercise, finishTalkStep, getSession, linkSimulation, markCardsSeen, noteTalkTurn, publicSession, startBrief,
} from './daily.js';
import { isPendingConsolidation, recordResult } from './srs.js';
import { answerHash, buildExercise, checkAnswer, publicExercise, seededRng } from './exercises.js';
import { lessonExercises } from './lessons.js';
import {
  closeAbandoned, countStoredQuotes, createSim, finishSim, hintFor, publicSim, removeStoredQuotes, rephrase, retryAttempt, setComfort, takeTurn,
} from './sim/engine.js';
import { checkLimit, logUsage, usageReport, voiceStatus } from './voice/index.js';
import { currentMesa, finishLearn, finishMesa, generateImprove, generateLearn, generateMesa, getPlan, improveAttempt, finishGame, generateGame, improveHome, leaderboard, learnHome, mesaProgress, vipTables, mesaTurn, speechPersona, speechTarget } from './practice.js';
import { ProviderError } from './voice/providers.js';
import { seasonGift, seasonKey, seasonStart } from './season.js';
import { VOCAB, VOCAB_BY_ID } from '../content/vocab.js';
import { LESSON_BY_ID, UNITS, CATEGORIES } from '../content/units.js';
import { SCENARIOS, SCENARIO_BY_ID } from '../content/scenarios.js';
import { MENU } from '../content/menu.js';
import { publicDiagnostic, scoreDiagnostic } from '../content/diagnostic.js';
import { APP_VERSION } from '../content/version.js';

const COOKIE = 'e47_session';
const PUBLIC_DIR = resolve('public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const MAX_JSON = 64 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;
const JOB_CHALLENGES = [
  'Usa una expresión nueva en tu siguiente turno.',
  'Pide una aclaración en inglés cuando no entiendas algo.',
  'Confirma una orden en voz alta repitiéndola completa.',
  'Explica un plato con «It comes with...» o «It is made with...».',
];

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function readBody(req, limit) {
  return new Promise((ok, fail) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        fail(new HttpError(413, 'too_large', 'El contenido es demasiado grande.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => ok(Buffer.concat(chunks)));
    req.on('error', fail);
  });
}

async function readJson(req) {
  const raw = await readBody(req, MAX_JSON);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString('utf8'));
  } catch {
    throw new HttpError(400, 'bad_json', 'Petición no válida.');
  }
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((p) => p.trim().split('=')).filter((p) => p.length === 2));
}

export function createApp({ db, config, services, clock = Date.now }) {
  const limiter = createLoginLimiter();
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => {
    const keys = [];
    const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
    routes.push({ method, re, keys, handler, auth: opts.auth ?? 'user', raw: opts.raw ?? false });
  };
  const fail = (status, code, message) => { throw new HttpError(status, code, message); };
  const fromResult = (r, status = 400) => {
    if (r?.error) {
      const map = { not_found: 404, limit_reached: 429, ai_unavailable: 409, finished: 409, provider_auth: 502, provider_network: 502, provider_provider: 502, provider_rate_limited: config.pilotFree ? 429 : 502, provider_refused: 502 };
      fail(map[r.error] ?? status, r.error, r.message);
    }
    return r;
  };

  function userPublic(u) {
    return {
      id: u.id, username: u.username, displayName: u.display_name, role: u.role, timezone: u.timezone,
      helpMode: u.help_mode, soundOn: Boolean(u.sound_on), keepTranscripts: Boolean(u.keep_transcripts),
      equipped: readEquipped(u.equipped), placementUnit: u.placement_unit, placementSource: u.placement_source, dailyNew: u.daily_new, diagnosticStatus: u.diagnostic_status,
      diagnosticResult: u.diagnostic_result ? JSON.parse(u.diagnostic_result) : null,
    };
  }

  async function fresh(user) {
    return await db.prepare('SELECT * FROM users WHERE id=?').get(user.id);
  }

  async function statsFor(user, now) {
    const covered = await reconcileShields(db, user, now);
    const today = localDate(now, user.timezone);
    const stats = await streakStats(db, user.id, today);
    const { shields } = await db.prepare('SELECT shields FROM users WHERE id=?').get(user.id);
    let earnedXp = 0;
    let earnedCoins = 0;
    for (const e of await db.prepare('SELECT xp, coins, created_at FROM reward_events WHERE user_id=? AND created_at>=?').all(user.id, seasonStart())) {
      if (localDate(Date.parse(e.created_at), user.timezone) === today) {
        earnedXp += e.xp;
        if (e.coins > 0) earnedCoins += e.coins;
      }
    }
    const tomorrow = addDays(today, 1);
    const dueTomorrow = (await db.prepare('SELECT COUNT(*) n FROM vocab_progress WHERE user_id=? AND due_date<=?').get(user.id, tomorrow)).n;
    const gift = seasonGift(user);
    if (gift) await award(db, user.id, seasonKey('regalo'), { coins: gift }, now);
    const totals = await balance(db, user.id);
    return { ...stats, ...totals, xpLevel: xpLevel(totals.xp), shields, shieldsJustUsed: covered, today, nextReward: nextReward(stats), earnedToday: { xp: earnedXp, coins: earnedCoins }, dueTomorrow };
  }

  // --- Acceso ---
  route('POST', '/api/auth/login', async ({ req, body, res }) => {
    const name = String(body.username ?? '').trim().toLowerCase();
    const key = `${req.socket.remoteAddress}:${name}`;
    const now = clock();
    if (limiter.blocked(key, now)) fail(429, 'too_many', 'Demasiados intentos. Espera unos minutos.');
    const user = await db.prepare('SELECT * FROM users WHERE username=? AND active=1').get(name);
    if (!user || !verifyPassword(String(body.password ?? ''), user.password_hash)) {
      limiter.fail(key, now);
      fail(401, 'bad_login', 'Usuario o contraseña incorrectos.');
    }
    limiter.clear(key);
    setSession(req, res, await createSession(db, user.id, now));
    return { user: userPublic(user) };
  }, { auth: 'none' });

  route('POST', '/api/auth/redeem', async ({ req, body, res }) => {
    const now = clock();
    const r = await redeemInvitation(db, { code: body.code, username: body.username, displayName: body.displayName, password: body.password }, now);
    if (!r.ok) fail(400, r.code, r.message);
    setSession(req, res, await createSession(db, r.userId, now));
    return { user: userPublic(await db.prepare('SELECT * FROM users WHERE id=?').get(r.userId)) };
  }, { auth: 'none' });

  route('POST', '/api/auth/password', async ({ req, res, user, body }) => {
    const now = clock();
    const key = `${req.socket.remoteAddress}:password:${user.id}`;
    if (limiter.blocked(key, now)) fail(429, 'too_many', 'Demasiados intentos. Espera unos minutos.');
    if (!verifyPassword(String(body.current ?? ''), user.password_hash)) {
      limiter.fail(key, now);
      fail(400, 'bad_password', 'Tu contraseña actual no es esa.');
    }
    const next = String(body.next ?? '');
    if (next.length < MIN_PASSWORD) fail(400, 'short_password', 'La contraseña nueva necesita al menos 8 caracteres.');
    limiter.clear(key);
    await setPassword(db, user.id, next);
    setSession(req, res, await createSession(db, user.id, now));
    return { ok: true };
  });

  route('POST', '/api/auth/logout', async ({ req, res }) => {
    await destroySession(db, parseCookies(req.headers.cookie)[COOKIE]);
    res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    return { ok: true };
  }, { auth: 'none' });

  function setSession(req, res, token) {
    const secure = config.cookieSecure || req.headers['x-forwarded-proto'] === 'https';
    res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; Max-Age=${30 * 86400}; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`);
  }

  // --- Hoy ---
  route('GET', '/api/today', async ({ user }) => {
    const now = clock();
    await closeAbandoned(db, user, now);
    const stats = await statsFor(user, now);
    const u = await fresh(user);
    const session = await publicSession(db, u, await getSession(db, u, now), now);
    const hour = localHour(now, u.timezone);
    return {
      user: userPublic(u),
      stats,
      session,
      plan: await getPlan(db, u, now),
      mesas: await mesaProgress(db, u),
      greeting: hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches',
      weekly: { goal: RULES.WEEKLY_GOAL_DAYS, done: stats.practicedThisWeek },
      voice: voiceStatus(services, config),
    };
  });

  route('GET', '/api/daily', async ({ user }) => {
    const now = clock();
    return { session: await publicSession(db, user, await getSession(db, user, now), now), stats: await statsFor(user, now) };
  });
  route('POST', '/api/daily/answer', async ({ user, body }) => {
    const now = clock();
    const r = fromResult(await answerExercise(db, user, { step: body.step, index: Number(body.index), answer: body.answer, retry: Boolean(body.retry) }, now));
    return { ...r, stats: await statsFor(user, now) };
  });
  route('POST', '/api/daily/cards-seen', async ({ user }) => ({ session: await markCardsSeen(db, user, clock()) }));
  route('POST', '/api/daily/brief', async ({ user }) => ({ session: await startBrief(db, user, clock()) }));

  // --- Diagnostico ---
  route('GET', '/api/diagnostic', async ({ req }) => {
    const round = new URL(req.url, 'http://x').searchParams.get('round') === '2' ? 2 : 1;
    return { round, questions: publicDiagnostic(round) };
  });
  // Si hoy no habia actividad, la sesion se rehace con el punto de partida nuevo.
  const resetUntouchedSession = async (user) => {
    const today = localDate(clock(), user.timezone);
    await db.prepare('DELETE FROM daily_sessions WHERE user_id=? AND local_date=? AND last_action_at IS NULL').run(user.id, today);
  };
  route('POST', '/api/diagnostic', async ({ user, body }) => {
    const round = body.round === 2 ? 2 : 1;
    const stored = (await fresh(user)).diagnostic_result;
    const previous = round === 2 && stored ? JSON.parse(stored) : null;
    if (round === 2 && previous?.version !== 2) fail(400, 'bad_round', 'Primero responde la primera ronda.');
    const result = scoreDiagnostic(body.answers, { round, meta: body.meta, previous });
    const status = result.needsRound2 ? 'round2_pending' : 'done';
    await db.prepare(`UPDATE users SET diagnostic_status=?, diagnostic_result=?, placement_unit=?, placement_source='diagnostic' WHERE id=?`)
      .run(status, JSON.stringify(result), result.placementUnit, user.id);
    await resetUntouchedSession(user);
    return { result };
  });
  route('POST', '/api/diagnostic/skip', async ({ user }) => {
    const u = await fresh(user);
    await db.prepare('UPDATE users SET diagnostic_status=? WHERE id=?').run(u.diagnostic_status === 'round2_pending' ? 'done' : 'skipped', user.id);
    return { ok: true };
  });
  // Toda la ruta sigue abierta: esto solo cambia por donde sugerimos empezar.
  route('POST', '/api/placement', async ({ user, body }) => {
    const unit = Number(body.unit);
    if (!UNITS.some((u) => u.id === unit)) fail(400, 'bad_unit', 'Esa unidad no existe.');
    await db.prepare(`UPDATE users SET placement_unit=?, placement_source='manual' WHERE id=?`).run(unit, user.id);
    await resetUntouchedSession(user);
    return { user: userPublic(await fresh(user)) };
  });

  // --- Ruta ---
  route('GET', '/api/route', async ({ user }) => {
    const done = new Map((await db.prepare('SELECT lesson_id id, last_correct, last_total FROM lesson_progress WHERE user_id=?').all(user.id)).map((r) => [r.id, r]));
    const outcomes = await scenarioOutcomes(user);
    const units = UNITS.map((u) => ({
      id: u.id, title: u.title, goal: u.goal,
      lessons: u.lessons.map((l) => {
        const p = done.get(l.id);
        return { id: l.id, title: l.title, grammarTitle: l.grammar.title, difficulty: l.difficulty ?? 1, done: Boolean(p), reinforce: Boolean(p?.last_total && p.last_correct / p.last_total < 0.7) };
      }),
      challenge: { scenarioId: u.scenario, title: SCENARIO_BY_ID.get(u.scenario).title, titleEs: SCENARIO_BY_ID.get(u.scenario).titleEs, outcome: outcomes.get(u.scenario) ?? null, done: outcomes.get(u.scenario) === 'resolved' },
    }));
    const u = await fresh(user);
    const ordered = [...units.filter((x) => x.id >= u.placement_unit), ...units.filter((x) => x.id < u.placement_unit)];
    let next = null;
    for (const unit of ordered) {
      const lesson = unit.lessons.find((l) => !l.done);
      if (lesson) { next = lesson.id; break; }
      if (!unit.challenge.done) { next = `sim:${unit.challenge.scenarioId}`; break; }
    }
    return { units, next, placementUnit: u.placement_unit };
  });

  route('GET', '/api/lesson/:id', async ({ user, params }) => {
    const lesson = LESSON_BY_ID.get(params.id) ?? fail(404, 'not_found', 'Esa lección no existe.');
    const answers = await db.prepare('SELECT idx, correct FROM lesson_answers WHERE user_id=? AND lesson_id=?').all(user.id, lesson.id);
    return {
      lesson: { id: lesson.id, title: lesson.title, unit: lesson.unit, goal: lesson.goal ?? null, difficulty: lesson.difficulty ?? 1, grammar: lesson.grammar, vocab: lesson.vocab.map((id) => VOCAB_BY_ID.get(id)) },
      exercises: lessonExercises(user.id, lesson).map(publicExercise),
      answered: answers.map((a) => a.idx),
    };
  });

  route('POST', '/api/lesson/:id/answer', async ({ user, params, body }) => {
    const lesson = LESSON_BY_ID.get(params.id) ?? fail(404, 'not_found', 'Esa lección no existe.');
    const now = clock();
    const exercises = lessonExercises(user.id, lesson);
    const index = Number(body.index);
    const ex = exercises[index] ?? fail(404, 'not_found', 'Ese ejercicio no existe.');
    const result = checkAnswer(ex, body.answer);
    if (ex.type === 'repeat' && !result.correct) return { result, retry: true };
    const today = localDate(now, user.timezone);
    return await tx(db, async () => {
      const prev = await db.prepare('SELECT correct, result, answer_hash FROM lesson_answers WHERE user_id=? AND lesson_id=? AND idx=?').get(user.id, lesson.id, index);
      const hash = answerHash(body.answer);
      // Repetir una peticion devuelve lo registrado. Solo un reintento explicito y distinto cuenta.
      if (prev && (!body.retry || prev.correct || prev.answer_hash === hash)) {
        return { result: prev.result ? JSON.parse(prev.result) : result, duplicate: true };
      }
      const vocabId = ex.vocabId ?? ex.vocabRef ?? null;
      const isFail = result.srs === 'fail';
      if (vocabId && result.srs !== 'none' && !(prev && isFail)) await recordResult(db, user.id, vocabId, { level: result.level, correct: !isFail }, today);
      const saved = { ...result, reviewScheduled: Boolean(vocabId && isFail), retried: Boolean(prev) };
      await db.prepare(
        `INSERT INTO lesson_answers (user_id, lesson_id, idx, correct, result, answer_hash) VALUES (?,?,?,?,?,?)
         ON CONFLICT(user_id, lesson_id, idx) DO UPDATE SET correct = CASE WHEN lesson_answers.correct > excluded.correct THEN lesson_answers.correct ELSE excluded.correct END, result = excluded.result, answer_hash = excluded.answer_hash`,
      ).run(user.id, lesson.id, index, result.correct ? 1 : 0, JSON.stringify(saved), hash);
      if (prev && result.meaningful) await grantAchievement(db, user.id, 'retried_phrase', now);
      return { result: saved };
    });
  });

  // Se cierra aparte para que el ultimo ejercicio tambien admita un nuevo intento.
  route('POST', '/api/lesson/:id/complete', async ({ user, params }) => {
    const lesson = LESSON_BY_ID.get(params.id) ?? fail(404, 'not_found', 'Esa lección no existe.');
    const now = clock();
    const total = lessonExercises(user.id, lesson).length;
    return await tx(db, async () => {
      const rows = await db.prepare('SELECT correct FROM lesson_answers WHERE user_id=? AND lesson_id=?').all(user.id, lesson.id);
      // Un doble toque en «terminar» devuelve el ultimo resultado, sin sumar otra vuelta.
      const done = await db.prepare('SELECT last_correct, last_total FROM lesson_progress WHERE user_id=? AND lesson_id=?').get(user.id, lesson.id);
      if (!rows.length && done) return { completed: true, duplicate: true, correct: done.last_correct, total: done.last_total, xp: 0, stats: await statsFor(user, now) };
      if (rows.length < total) fail(409, 'incomplete', 'Todavía faltan ejercicios por responder.');
      const correct = rows.filter((r) => r.correct).length;
      await db.prepare(
        `INSERT INTO lesson_progress (user_id, lesson_id, completed_at, last_correct, last_total) VALUES (?,?,?,?,?)
         ON CONFLICT(user_id, lesson_id) DO UPDATE SET times = lesson_progress.times + 1, last_correct = excluded.last_correct, last_total = excluded.last_total`,
      ).run(user.id, lesson.id, new Date(now).toISOString(), correct, total);
      await db.prepare('DELETE FROM lesson_answers WHERE user_id=? AND lesson_id=?').run(user.id, lesson.id);
      const paid = await db.prepare('INSERT INTO reward_events (user_id, key, xp, coins, created_at) VALUES (?,?,?,0,?) ON CONFLICT DO NOTHING')
        .run(user.id, `lesson:${lesson.id}`, RULES.XP_LESSON, new Date(now).toISOString());
      return { completed: true, correct, total, xp: paid.changes === 1 ? RULES.XP_LESSON : 0, stats: await statsFor(user, now) };
    });
  });

  // --- Palabras ---
  const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const SEARCH_INDEX = new Map(VOCAB.map((v) => [v.id, fold(`${v.en} ${v.es} ${v.alts.join(' ')} ${v.related.join(' ')} ${v.examples.join(' ')} ${v.phrase}`)]));
  const searchRank = (v, q) => {
    const en = fold(v.en);
    const es = fold(v.es);
    if (en === q || es === q) return 0;
    if (en.startsWith(q) || es.startsWith(q)) return 1;
    if (en.includes(q) || es.includes(q)) return 2;
    return 3;
  };

  function pendingReason(p) {
    if (p.last_fail_date && (!p.last_review_date || p.last_fail_date >= p.last_review_date)) return 'La última vez que la practicaste no salió. Volverá pronto a tu repaso.';
    if (p.used_count === 0) return 'Todavía no la has usado tú sin opciones.';
    return 'Ya la usaste, pero le faltan un par de repasos para afianzarla.';
  }

  function vocabStatus(p, today) {
    const pending = p ? isPendingConsolidation(p) : false;
    return {
      recognized: p ? p.recognized_count > 0 : false,
      used: p ? p.used_count > 0 : false,
      pending,
      pendingReason: pending ? pendingReason(p) : null,
      dueDate: p?.due_date ?? null,
      due: p ? p.due_date <= today : false,
    };
  }

  // El catalogo se sirve por paginas: nunca viajan las 600 entradas de golpe al celular.
  route('GET', '/api/vocab', async ({ user, req }) => {
    const now = clock();
    const today = localDate(now, user.timezone);
    const url = new URL(req.url, 'http://x');
    const view = url.searchParams.get('view') ?? 'hoy';
    const q = fold(url.searchParams.get('q') ?? '').trim();
    const category = url.searchParams.get('category') ?? '';
    const difficulty = Number(url.searchParams.get('difficulty') ?? 0);
    const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 30)));
    const progress = new Map((await db.prepare('SELECT * FROM vocab_progress WHERE user_id=?').all(user.id)).map((p) => [p.vocab_id, p]));
    const favs = new Set((await db.prepare('SELECT vocab_id id FROM favorites WHERE user_id=?').all(user.id)).map((r) => r.id));
    const todayIds = (await getSession(db, user, now)).state.vocabIds;
    const matchesView = (v) => {
      if (view === 'hoy') return todayIds.includes(v.id);
      if (view === 'repaso') return progress.has(v.id) && progress.get(v.id).due_date <= today;
      if (view === 'favoritas') return favs.has(v.id);
      if (view === 'consolidar') return progress.has(v.id) && isPendingConsolidation(progress.get(v.id));
      return true;
    };
    const filtered = VOCAB.filter((v) => matchesView(v)
      && (!category || v.category === category)
      && (!difficulty || v.difficulty === difficulty)
      && (!q || SEARCH_INDEX.get(v.id).includes(q)));
    // Orden estable: la paginacion no omite ni repite registros.
    if (q) filtered.sort((a, b) => searchRank(a, q) - searchRank(b, q));
    const known = [...progress.values()];
    return {
      today,
      todayIds,
      total: filtered.length,
      offset,
      limit,
      catalogSize: VOCAB.length,
      categories: CATEGORIES,
      dueCount: known.filter((p) => p.due_date <= today).length,
      pendingCount: known.filter(isPendingConsolidation).length,
      entries: filtered.slice(offset, offset + limit).map((v) => ({
        id: v.id, en: v.en, es: v.es, category: v.category, difficulty: v.difficulty,
        favorite: favs.has(v.id), ...vocabStatus(progress.get(v.id), today),
      })),
      phrases: await db.prepare('SELECT id, en, es FROM personal_phrases WHERE user_id=? ORDER BY id DESC').all(user.id),
    };
  });
  route('GET', '/api/vocab/:id', async ({ user, params }) => {
    const v = VOCAB_BY_ID.get(params.id) ?? fail(404, 'not_found', 'Esa expresión no existe.');
    const today = localDate(clock(), user.timezone);
    const p = await db.prepare('SELECT * FROM vocab_progress WHERE user_id=? AND vocab_id=?').get(user.id, v.id);
    const favorite = Boolean(await db.prepare('SELECT 1 FROM favorites WHERE user_id=? AND vocab_id=?').get(user.id, v.id));
    return { entry: { ...v, favorite, ...vocabStatus(p, today) } };
  });
  route('POST', '/api/vocab/:id/favorite', async ({ user, params, body }) => {
    if (!VOCAB_BY_ID.has(params.id)) fail(404, 'not_found', 'Esa expresión no existe.');
    if (body.favorite) await db.prepare('INSERT INTO favorites (user_id, vocab_id) VALUES (?,?) ON CONFLICT DO NOTHING').run(user.id, params.id);
    else await db.prepare('DELETE FROM favorites WHERE user_id=? AND vocab_id=?').run(user.id, params.id);
    return { favorite: Boolean(body.favorite) };
  });
  route('POST', '/api/phrases', async ({ user, body }) => {
    const en = String(body.en ?? '').trim().slice(0, 200);
    const es = String(body.es ?? '').trim().slice(0, 200);
    if (!en) fail(400, 'empty', 'Escribe la frase en inglés.');
    const existing = await db.prepare('SELECT id, en, es FROM personal_phrases WHERE user_id=? AND en=?').get(user.id, en);
    if (existing) return { ...existing, duplicate: true };
    const r = await db.prepare('INSERT INTO personal_phrases (user_id, en, es, created_at) VALUES (?,?,?,?) RETURNING id').run(user.id, en, es, new Date(clock()).toISOString());
    return { id: Number(r.lastInsertRowid), en, es };
  });
  route('DELETE', '/api/phrases/:id', async ({ user, params }) => {
    await db.prepare('DELETE FROM personal_phrases WHERE id=? AND user_id=?').run(Number(params.id), user.id);
    return { ok: true };
  });
  // Repaso libre: accesible siempre. Cuenta para el calendario de repaso, no para la racha.
  route('GET', '/api/practice', async ({ user, req }) => {
    const now = clock();
    const today = localDate(now, user.timezone);
    const rng = seededRng(`${user.id}:${now}`);
    const vocabId = new URL(req.url, 'http://x').searchParams.get('vocab');
    const types = ['listen_choose', 'complete', 'recall', 'respond', 'repeat'];
    // Practicar una sola expresion desde su ficha.
    if (vocabId) {
      if (!VOCAB_BY_ID.has(vocabId)) fail(404, 'not_found', 'Esa expresión no existe.');
      return { exercises: ['listen_choose', 'recall', 'respond'].map((t) => publicExercise(buildExercise(t, vocabId, rng))) };
    }
    const due = (await db.prepare(
      `SELECT vocab_id id FROM vocab_progress WHERE user_id=? ORDER BY (due_date<=?) DESC, lapses DESC, due_date LIMIT 5`,
    ).all(user.id, today)).map((r) => r.id);
    const ids = due.length ? due : VOCAB.slice(0, 5).map((v) => v.id);
    return { exercises: ids.map((id, i) => publicExercise(buildExercise(types[i % types.length], id, rng))) };
  });
  route('POST', '/api/practice/answer', async ({ user, body }) => {
    const ex = body.exercise;
    if (!ex || !VOCAB_BY_ID.has(ex.vocabId) || !['listen_choose', 'complete', 'recall', 'respond', 'repeat'].includes(ex.type)) fail(400, 'bad_request', 'Ejercicio no válido.');
    const rebuilt = { type: ex.type, vocabId: ex.vocabId, text: VOCAB_BY_ID.get(ex.vocabId).phrase };
    const now = clock();
    const today = localDate(now, user.timezone);
    // El mismo envio el mismo dia devuelve lo registrado y no agrega evidencia.
    const key = `practice:${ex.vocabId}:${ex.type}:${today}:${answerHash(body.answer)}`;
    const seen = await db.prepare('SELECT response FROM idempotency WHERE user_id=? AND key=?').get(user.id, key);
    if (seen) return { result: JSON.parse(seen.response), duplicate: true };
    const result = checkAnswer(rebuilt, body.answer);
    const isFail = result.srs === 'fail';
    if (ex.type === 'repeat' && !result.correct) return { result, retry: true };
    const saved = { ...result, reviewScheduled: isFail };
    await tx(db, async () => {
      if (result.srs !== 'none' && !(body.retry && isFail)) {
        await recordResult(db, user.id, ex.vocabId, { level: result.level, correct: !isFail }, today);
      }
      await db.prepare('INSERT INTO idempotency (user_id, key, response, created_at) VALUES (?,?,?,?)').run(user.id, key, JSON.stringify(saved), new Date(now).toISOString());
    });
    return { result: saved };
  });

  // --- Comentarios del piloto: los ve solo la administracion, sin audio ni capturas. ---
  const FEEDBACK_SECTIONS = ['Hoy', 'Práctica de hoy', 'Ruta', 'Hablar', 'Palabras', 'Perfil', 'Acceso', 'Otra'];
  route('POST', '/api/feedback', async ({ user, body }) => {
    const section = FEEDBACK_SECTIONS.includes(body.section) ? body.section : 'Otra';
    const trying = String(body.trying ?? '').trim().slice(0, 300);
    const problem = String(body.problem ?? '').trim().slice(0, 600);
    const comment = String(body.comment ?? '').trim().slice(0, 600);
    if (!trying || !problem) fail(400, 'empty', 'Cuéntanos qué intentabas hacer y qué pasó.');
    const now = clock();
    const recent = (await db.prepare('SELECT COUNT(*) n FROM feedback WHERE user_id=? AND created_at>?').get(user.id, new Date(now - 86400000).toISOString())).n;
    if (recent >= 20) fail(429, 'too_many', 'Ya recibimos varios comentarios tuyos hoy. Gracias: vuelve a intentarlo mañana.');
    const requestId = String(body.requestId ?? '').slice(0, 64) || null;
    await db.prepare('INSERT INTO feedback (user_id, request_id, section, trying, problem, comment, created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING')
      .run(user.id, requestId, section, trying, problem, comment || null, new Date(now).toISOString());
    return { ok: true };
  });
  route('GET', '/api/feedback/sections', async () => ({ sections: FEEDBACK_SECTIONS }));

  // Fallos técnicos: solo códigos conocidos y el tipo de teléfono. Nunca audio, frases ni texto libre.
  const TECH_PROBLEMS = {
    audio_blocked: 'El teléfono bloqueó el audio del cliente.',
    speech_fallback: 'La voz del servidor no respondió y se usó la del teléfono.',
    mic_denied: 'El alumno no dio permiso al micrófono.',
    mic_no_device: 'No se encontró un micrófono.',
    mic_busy: 'Otra app estaba usando el micrófono.',
    mic_error: 'El micrófono falló al empezar a grabar.',
    assess_failed: 'No se pudo revisar la voz.',
    voice_limit: 'Se acabó el cupo de revisión de voz.',
    js_error: 'La app tuvo un error en la pantalla.',
  };
  const deviceOf = (agent = '') => {
    const system = /iPhone|iPad/.test(agent) ? 'iPhone' : /Android/.test(agent) ? 'Android' : /Windows/.test(agent) ? 'Windows' : /Mac OS/.test(agent) ? 'Mac' : 'Otro equipo';
    const browser = /EdgA?\//.test(agent) ? 'Edge' : /CriOS|Chrome\//.test(agent) ? 'Chrome' : /FxiOS|Firefox\//.test(agent) ? 'Firefox' : /Safari\//.test(agent) ? 'Safari' : 'otro navegador';
    return `${system}, ${browser}`;
  };
  route('POST', '/api/problema-tecnico', async ({ req, user, body }) => {
    const text = TECH_PROBLEMS[body.code];
    if (!text) fail(400, 'bad_code', 'Código no válido.');
    const now = clock();
    const where = /^[\w.-]{1,40}:\d{1,6}$/.test(body.where ?? '') ? ` (${body.where})` : '';
    // Una vez al día por alumno y tipo de fallo: la clave repetida no se inserta.
    await db.prepare('INSERT INTO feedback (user_id, request_id, section, trying, problem, comment, created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING')
      .run(user.id, `auto:${body.code}:${localDate(now, user.timezone)}`, 'Técnico', 'Aviso automático', `${text}${where}`, deviceOf(req.headers['user-agent']), new Date(now).toISOString());
    return { ok: true };
  });

  // --- Simulaciones ---
  const OUTCOME_RANK = { not_started: 0, attempted: 1, completed: 2, resolved: 3 };
  /** Mejor resultado por escenario de este alumno. */
  async function scenarioOutcomes(user) {
    const best = new Map();
    for (const r of await db.prepare(`SELECT scenario_id id, outcome FROM sim_sessions WHERE user_id=? AND status='finished' AND outcome IS NOT NULL`).all(user.id)) {
      if ((OUTCOME_RANK[r.outcome] ?? 0) > (OUTCOME_RANK[best.get(r.id)] ?? 0)) best.set(r.id, r.outcome);
    }
    return best;
  }

  route('GET', '/api/scenarios', async ({ user }) => {
    const outcomes = await scenarioOutcomes(user);
    const unitTitle = new Map(UNITS.map((u) => [u.id, u.title]));
    return {
      scenarios: SCENARIOS.map((s) => ({ id: s.id, title: s.title, titleEs: s.titleEs, unit: s.unit, unitTitle: unitTitle.get(s.unit), difficulty: s.difficulty, objective: s.objective, featured: Boolean(s.featured), variantOf: s.variantOf ?? null, outcome: outcomes.get(s.id) ?? null, done: outcomes.get(s.id) === 'resolved' })),
      voice: voiceStatus(services, config),
      menu: MENU,
    };
  });
  route('POST', '/api/sim', async ({ user, body }) => {
    const now = clock();
    const r = fromResult(await createSim(db, user, { scenarioId: body.scenarioId, mode: body.mode === 'ai' ? 'ai' : 'demo', helpMode: body.helpMode ?? user.help_mode }, services, config, now));
    if (body.daily) await linkSimulation(db, user, r.sim.id, body.scenarioId, now);
    return { sim: publicSim(r.sim, Boolean(user.keep_transcripts)) };
  });
  route('GET', '/api/sim/:id', async ({ user, params }) => {
    const row = await db.prepare('SELECT * FROM sim_sessions WHERE id=? AND user_id=?').get(Number(params.id), user.id) ?? fail(404, 'not_found', 'No encontramos esa simulación.');
    return { sim: publicSim({ ...row, state: JSON.parse(row.state), summary: row.summary ? JSON.parse(row.summary) : null }, Boolean(user.keep_transcripts)) };
  });
  route('POST', '/api/sim/:id/turn', async ({ user, params, body }) => {
    const now = clock();
    const simId = Number(params.id);
    const r = fromResult(await takeTurn(db, user, simId, { text: body.text, source: body.source, requestId: body.requestId }, services, config, now));
    const rewards = r.duplicate ? null : await noteTalkTurn(db, user, simId, r.meaningful, now);
    return { sim: publicSim(r.sim, Boolean(user.keep_transcripts)), rewards };
  });
  route('POST', '/api/sim/:id/hint', async ({ user, params }) => fromResult(await hintFor(db, user, Number(params.id))));
  route('POST', '/api/sim/:id/rephrase', async ({ user, params }) => {
    const r = fromResult(await rephrase(db, user, Number(params.id), services, config, clock()));
    return { sim: publicSim(r.sim, Boolean(user.keep_transcripts)) };
  });
  route('POST', '/api/sim/:id/finish', async ({ user, params }) => {
    const now = clock();
    const simId = Number(params.id);
    const r = fromResult(await finishSim(db, user, simId, services, config, now, {
      onFinished: async (summary, outcome) => await finishTalkStep(db, user, simId, summary, outcome, now),
    }));
    const sim = publicSim(r.sim, Boolean(user.keep_transcripts));
    // Las citas se muestran solo en esta respuesta; lo guardado no las lleva sin permiso.
    if (r.shownNow) sim.summary = r.shownNow;
    return { sim, rewards: r.rewards, quotesSaved: Boolean(user.keep_transcripts), stats: await statsFor(user, now) };
  });
  route('POST', '/api/sim/:id/comfort', async ({ user, params, body }) => fromResult(await setComfort(db, user, Number(params.id), body.value)));
  route('POST', '/api/sim/:id/retry', async ({ user, params, body }) => fromResult(await retryAttempt(db, user, Number(params.id), { index: body.index, text: body.text, recordedMs: body.recordedMs }, clock())));

  // --- Voz: el audio se procesa y se descarta; nunca se guarda. ---
  route('GET', '/api/voice/status', async () => voiceStatus(services, config));
  route('POST', '/api/voice/transcribe', async ({ user, req }) => {
    const now = clock();
    if (!services.stt) fail(409, 'stt_unavailable', 'La transcripción no está conectada.');
    const limit = await checkLimit(db, config, user, 'stt', now);
    if (limit) fail(429, limit.code, limit.message);
    const type = String(req.headers['content-type'] ?? '');
    const supportedAudio = new Set(['audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/flac']);
    if (!supportedAudio.has(type.split(';')[0].trim().toLowerCase())) fail(415, 'bad_audio', 'Formato de audio no compatible. Vuelve a grabar o responde por texto.');
    const audioMs = Number(req.headers['x-audio-ms']);
    if (!Number.isFinite(audioMs) || audioMs < 400 || audioMs > 60000) fail(400, 'bad_duration', 'Graba entre medio segundo y un minuto por respuesta.');
    const audio = await readBody(req, config.pilotFree ? 960044 : MAX_AUDIO);
    const measured = config.pilotFree ? pilotWavSeconds(audio) : null;
    if (config.pilotFree && (type !== 'audio/wav' || measured < 0.4)) fail(400, 'bad_audio', 'Graba una frase de hasta 30 segundos o responde por texto.');
    if (audio.length < 800) return { status: 'silence', text: '' };
    // Estimacion del cliente para los limites; no equivale a duracion facturada verificada.
    const seconds = measured ?? Math.max(1, audioMs / 1000);
    try {
      const { text } = await services.stt.transcribe({ audio, mimeType: type });
      await logUsage(db, user, 'stt', services.stt.name, seconds, 'seconds', now);
      if (!/[a-zA-Z]{2,}/.test(text)) return { status: 'unclear', text };
      return { status: text.trim().split(/\s+/).length >= 3 ? 'ok' : 'confirm', text, requiresConfirmation: true };
    } catch (err) {
      if (config.pilotFree && err.code === 'rate_limited') fail(429,'limit_reached','La cuota de transcripción se agotó. Puedes seguir por texto.');
      if (err instanceof ProviderError) fail(502, `provider_${err.code}`, 'No pudimos transcribir tu audio. Inténtalo de nuevo o escribe tu respuesta.');
      throw err;
    }
  }, { raw: true });
  // --- Práctica diaria: Aprender palabras, Mesas, Pronunciar y escuchar ---
  const practiceOut = async (user, now, out) => ({ ...out, stats: await statsFor(user, now) });
  route('GET', '/api/aprender', async ({ user }) => await learnHome(db, user, clock()));
  route('POST', '/api/aprender/generar', async ({ user, body }) => await generateLearn(db, user, clock(), body.tema ? String(body.tema) : null));
  route('POST', '/api/aprender/terminar', async ({ user }) => {
    const now = clock();
    return await practiceOut(user, now, fromResult(await finishLearn(db, user, now)));
  });
  route('GET', '/api/vip', async () => vipTables());
  route('POST', '/api/aprender/tema', async ({ user, body }) => fromResult(await generateGame(db, user, clock(), String(body.tema ?? ''))));
  route('POST', '/api/aprender/tema/terminar', async ({ user }) => {
    const now = clock();
    return await practiceOut(user, now, fromResult(await finishGame(db, user, now)));
  });
  route('GET', '/api/ranking', async ({ user }) => await leaderboard(db, user, clock()));
  route('GET', '/api/mesas', async ({ user }) => await currentMesa(db, user, clock()));
  route('POST', '/api/mesas/generar', async ({ user }) => await generateMesa(db, user, clock()));
  route('POST', '/api/mesas/:id/turno', async ({ user, params, body }) => fromResult(await mesaTurn(db, user, Number(params.id), { index: Number(body.index), heard: body.heard, selfCheck: Boolean(body.selfCheck) }, clock())));
  route('POST', '/api/mesas/:id/terminar', async ({ user, params }) => {
    const now = clock();
    return await practiceOut(user, now, fromResult(await finishMesa(db, user, Number(params.id), now)));
  });
  route('GET', '/api/mejorar', async ({ user }) => await improveHome(db, user, clock()));
  route('POST', '/api/mejorar/generar', async ({ user, body }) => await generateImprove(db, user, body.modo === 'escuchar' ? 'escuchar' : 'pronunciar', clock()));
  route('POST', '/api/mejorar/intento', async ({ user, body }) => {
    const now = clock();
    const out = fromResult(await improveAttempt(db, user, { id: Number(body.id), heard: body.heard, selfCheck: Boolean(body.selfCheck) }, now));
    if (out.daily) out.daily.stats = await statsFor(user, now);
    return out;
  });

  // Evalúa la pronunciación contra la frase guía que el servidor tiene guardada. El audio se descarta.
  route('POST', '/api/voz/evaluar', async ({ user, req }) => {
    const now = clock();
    if (!services.pronunciation) fail(409, 'assess_unavailable', 'La evaluación de pronunciación no está conectada.');
    const query = new URL(req.url, 'http://x').searchParams;
    const place = { tipo: query.get('tipo'), id: Number(query.get('id')), index: Number(query.get('index')) };
    const limit = await checkLimit(db, config, user, 'stt', now);
    if (limit) fail(429, limit.code, limit.message);
    if (String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase() !== 'audio/wav') fail(415, 'bad_audio', 'Formato de audio no compatible. Vuelve a grabar.');
    const audio = await readBody(req, 960044);
    const seconds = pilotWavSeconds(audio);
    if (seconds < 0.4) fail(400, 'bad_audio', 'Graba una frase de hasta 30 segundos.');
    const reference = await speechTarget(db, user, place, now);
    if (reference === null) fail(404, 'not_found', 'Esa frase ya no está disponible.');
    let assessment;
    try {
      assessment = await services.pronunciation.assess({ audio, reference });
      await logUsage(db, user, 'stt', services.pronunciation.name, seconds, 'seconds', now);
    } catch (err) {
      if (err instanceof ProviderError) {
        if (err.code === 'rate_limited') fail(429, 'limit_reached', 'Se agotó la revisión de voz por ahora.');
        fail(502, `provider_${err.code}`, 'No pudimos revisar tu voz. Inténtalo de nuevo.');
      }
      throw err;
    }
    if (assessment.status === 'silence') return { status: 'silence' };
    const out = fromResult(place.tipo === 'mesa'
      ? await mesaTurn(db, user, place.id, { index: place.index, assessment }, now)
      : await improveAttempt(db, user, { id: place.id, assessment }, now));
    if (out.daily) out.daily.stats = await statsFor(user, now);
    return { status: 'ok', heard: assessment.text, result: out.result, attempts: out.attempts ?? null, daily: out.daily ?? null };
  }, { raw: true });

  route('POST', '/api/voice/speak', async ({ user, body, res }) => {
    const now = clock();
    if (!services.tts) fail(409, 'tts_unavailable', 'La voz del servidor no está conectada.');
    const text = String(body.text ?? '').trim().slice(0, 800);
    if (!text) fail(400, 'empty', 'No hay texto para leer.');
    const persona = speechPersona(body.persona);
    const limit = await checkLimit(db, config, user, 'tts', now);
    if (limit) fail(429, limit.code, limit.message);
    const controller = new AbortController();
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close', cancel);
    try {
      const { audio, mimeType } = await services.tts.speak({ text, signal: controller.signal, voice: persona?.voice, style: persona?.style, azure: persona?.azure, rate: persona?.rate });
      if (res.destroyed) return;
      await logUsage(db, user, 'tts', services.tts.name, text.length, 'chars', now);
      return { audio, mimeType };
    } catch (err) {
      if (res.destroyed) return;
      if (err instanceof ProviderError) fail(502, `provider_${err.code}`, 'La voz no respondió. Puedes leer el texto o usar la voz del dispositivo.');
      if (!res.destroyed) throw err;
    } finally { res.off('close', cancel); }
  });

  // --- Perfil ---
  route('GET', '/api/profile', async ({ user }) => {
    const now = clock();
    const stats = await statsFor(user, now);
    const u = await fresh(user);
    const earned = new Map((await db.prepare('SELECT key, created_at FROM achievements WHERE user_id=? AND created_at>=?').all(u.id, seasonStart())).map((a) => [a.key, a.created_at]));
    const unlocked = await ownedItems(db, u.id);
    const evidence = await db.prepare('SELECT task, COUNT(*) n FROM task_evidence WHERE user_id=? GROUP BY task').all(u.id);
    const counts = Object.fromEntries(evidence.map((e) => [e.task, e.n]));
    const comfort = await db.prepare('SELECT comfort, finished_at FROM sim_sessions WHERE user_id=? AND comfort IS NOT NULL ORDER BY id DESC LIMIT 5').all(u.id);
    const vocabRows = await db.prepare('SELECT * FROM vocab_progress WHERE user_id=?').all(u.id);
    const vocabStats = {
      recognized: vocabRows.filter((p) => p.recognized_count > 0).length,
      used: vocabRows.filter((p) => p.used_count > 0).length,
      pending: vocabRows.filter(isPendingConsolidation).length,
    };
    const outcomes = [...(await scenarioOutcomes(u)).values()];
    return {
      simulationStats: {
        attempted: outcomes.filter((o) => o === 'attempted').length,
        completed: outcomes.filter((o) => o === 'completed').length,
        resolved: outcomes.filter((o) => o === 'resolved').length,
        total: SCENARIOS.length,
      },
      storedQuotes: await countStoredQuotes(db, u.id),
      mesas: await mesaProgress(db, u),
      units: UNITS.map((x) => ({ id: x.id, title: x.title })),
      user: userPublic(u),
      stats,
      calendar: await calendar(db, u.id, stats.today, 35),
      achievements: Object.entries(ACHIEVEMENTS).map(([key, a]) => ({ key, ...a, earnedAt: earned.get(key) ?? null })),
      shop: SHOP_ITEMS.map((i) => ({ ...i, owned: unlocked.has(i.id) })),
      maxShields: RULES.MAX_SHIELDS,
      tasks: [
        { id: 'clarify', name: 'Pedir aclaraciones', evidence: counts.clarify ?? 0 },
        { id: 'explain_dish', name: 'Explicar un plato', evidence: counts.explain_dish ?? 0 },
        { id: 'confirm_mods', name: 'Confirmar modificaciones', evidence: counts.confirm_mods ?? 0 },
      ],
      comfort: comfort.map((c) => c.comfort),
      vocabStats: { ...vocabStats, total: VOCAB.length },
      challenge: JOB_CHALLENGES[Math.abs(hashDay(stats.today)) % JOB_CHALLENGES.length],
      jobLogs: await db.prepare('SELECT local_date date, challenge, result FROM job_logs WHERE user_id=? ORDER BY id DESC LIMIT 5').all(u.id),
    };
  });
  route('POST', '/api/settings', async ({ user, body }) => {
    if (body.timezone !== undefined) {
      if (!isValidTimeZone(body.timezone)) fail(400, 'bad_timezone', 'Esa zona horaria no es válida.');
      await db.prepare('UPDATE users SET timezone=? WHERE id=?').run(body.timezone, user.id);
    }
    if (body.helpMode === 'help' || body.helpMode === 'work') await db.prepare('UPDATE users SET help_mode=? WHERE id=?').run(body.helpMode, user.id);
    if (typeof body.soundOn === 'boolean') await db.prepare('UPDATE users SET sound_on=? WHERE id=?').run(body.soundOn ? 1 : 0, user.id);
    if (typeof body.keepTranscripts === 'boolean') await db.prepare('UPDATE users SET keep_transcripts=? WHERE id=?').run(body.keepTranscripts ? 1 : 0, user.id);
    if (body.dailyNew !== undefined) {
      const n = Number(body.dailyNew);
      if (!Number.isInteger(n) || n < 3 || n > 10) fail(400, 'bad_value', 'Elige entre 3 y 10 expresiones nuevas al día.');
      await db.prepare('UPDATE users SET daily_new=? WHERE id=?').run(n, user.id);
    }
    return { user: userPublic(await fresh(user)) };
  });
  route('POST', '/api/shop/buy', async ({ user, body }) => {
    const r = await buyItem(db, user, body.itemId, body.requestId, clock());
    if (!r.ok) fail(400, r.code, r.message);
    return { ...r, stats: await statsFor(user, clock()) };
  });
  route('POST', '/api/avatar/equip', async ({ user, body }) => {
    if (body.slot && !['vest', 'hat', 'glasses', 'neck', 'animal'].includes(body.slot)) fail(400, 'unknown_item', 'Ese accesorio no existe.');
    const item = SHOP_ITEMS.find((i) => i.id === body.itemId && i.kind !== 'shield');
    const u = await fresh(user);
    const equipped = readEquipped(u.equipped);
    if (body.slot && !body.itemId) {
      delete equipped[body.slot];
    } else {
      if (!item) fail(400, 'unknown_item', 'Ese accesorio no existe.');
      const owned = (await ownedItems(db, u.id)).has(item.id);
      if (!owned) fail(403, 'not_owned', 'Todavía no tienes ese accesorio.');
      equipped[item.kind] = item.id;
    }
    await db.prepare('UPDATE users SET equipped=? WHERE id=?').run(writeEquipped(equipped), u.id);
    return { equipped };
  });
  route('POST', '/api/challenge/log', async ({ user, body }) => {
    const now = clock();
    const result = String(body.result ?? '').trim().slice(0, 300);
    if (!result) fail(400, 'empty', 'Cuéntanos brevemente cómo te fue.');
    await db.prepare('INSERT INTO job_logs (user_id, local_date, challenge, result, created_at) VALUES (?,?,?,?,?)')
      .run(user.id, localDate(now, user.timezone), String(body.challenge ?? '').slice(0, 200), result, new Date(now).toISOString());
    return { ok: true };
  });
  route('POST', '/api/privacy/delete-history', async ({ user }) => {
    await removeStoredQuotes(db, user.id);
    await db.prepare(`UPDATE sim_sessions SET summary=NULL, has_quotes=0, state='{"turns":[],"met":[],"beat":0,"done":true,"heardVia":"text"}' WHERE user_id=? AND status='finished'`).run(user.id);
    await db.prepare('DELETE FROM job_logs WHERE user_id=?').run(user.id);
    return { ok: true };
  });
  // Solo quita citas antiguas: los resultados y recomendaciones se conservan.
  route('POST', '/api/privacy/remove-quotes', async ({ user }) => ({ removed: await removeStoredQuotes(db, user.id) }));

  // --- Administracion: gestiona acceso y consumo. No ve el historial de voz de los alumnos. ---
  route('GET', '/api/admin/overview', async () => {
    const now = clock();
    const students = await db.prepare(`SELECT id, username, display_name "displayName", active, created_at "createdAt" FROM users WHERE role='student' ORDER BY id`).all();
    return {
      feedback: await db.prepare(
        `SELECT f.id, f.section, f.trying, f.problem, f.comment, f.status, f.created_at "createdAt", u.display_name "displayName"
         FROM feedback f JOIN users u ON u.id = f.user_id ORDER BY f.status='open' DESC, f.id DESC LIMIT 50`,
      ).all(),
      students: students.map((s) => ({ ...s, active: Boolean(s.active) })),
      seats: { max: MAX_STUDENTS, used: await activeStudents(db), pendingInvites: await pendingStudentInvites(db, now) },
      invitations: await db.prepare('SELECT id, label, role, expires_at "expiresAt", used_at "usedAt", revoked FROM invitations ORDER BY id DESC LIMIT 15').all(),
      usage: await usageReport(db, config, now),
      voice: voiceStatus(services, config),
    };
  }, { auth: 'admin' });
  route('POST', '/api/admin/feedback/:id/status', async ({ params, body }) => {
    await db.prepare('UPDATE feedback SET status=? WHERE id=?').run(body.status === 'open' ? 'open' : 'done', Number(params.id));
    return { ok: true };
  }, { auth: 'admin' });
  route('POST', '/api/admin/invite', async ({ user, body }) => {
    const r = await createInvitation(db, { role: 'student', label: String(body.label ?? '').slice(0, 60) || null, createdBy: user.id }, clock());
    if (!r.ok) fail(409, r.code, r.message);
    return { code: r.code };
  }, { auth: 'admin' });
  route('POST', '/api/admin/invite/:id/revoke', async ({ params }) => {
    await db.prepare('UPDATE invitations SET revoked=1 WHERE id=? AND used_by IS NULL').run(Number(params.id));
    return { ok: true };
  }, { auth: 'admin' });
  route('POST', '/api/admin/student/:id/password', async ({ params }) => {
    const id = Number(params.id);
    const student = await db.prepare("SELECT id FROM users WHERE role='student' AND id=?").get(id);
    if (!student) fail(404, 'not_found', 'No encontramos ese alumno.');
    const password = temporaryPassword();
    await setPassword(db, id, password);
    return { password };
  }, { auth: 'admin' });
  route('POST', '/api/admin/student/:id/active', async ({ params, body }) => {
    const id = Number(params.id);
    if (db.lock) { await db.lock(id); await db.lock(-1); }
    const student = await db.prepare("SELECT active FROM users WHERE role='student' AND id=?").get(id);
    if (!student) fail(404, 'not_found', 'No encontramos ese alumno.');
    if (body.active && !student.active && await activeStudents(db) + await pendingStudentInvites(db, clock()) >= MAX_STUDENTS) {
      fail(409, 'seats_full', `Las ${MAX_STUDENTS} plazas ya están ocupadas o reservadas.`);
    }
    await db.prepare(`UPDATE users SET active=? WHERE id=? AND role='student'`).run(body.active ? 1 : 0, id);
    if (!body.active) await db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
    return { ok: true };
  }, { auth: 'admin' });

  function hashDay(day) {
    return [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
  }

  function serveStatic(req, res, pathname) {
    let rel = pathname === '/' ? '/index.html' : pathname;
    const full = normalizePath(join(PUBLIC_DIR, decodeURIComponent(rel)));
    if (!full.startsWith(PUBLIC_DIR + sep)) { res.writeHead(403); res.end(); return; }
    let info;
    try { info = statSync(full); } catch { info = null; }
    if (!info?.isFile()) {
      // La app usa rutas con # : cualquier otra ruta inexistente responde 404.
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('No encontrado');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[extname(full)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': extname(full) === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    createReadStream(full).pipe(res);
  }

  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-English47-Version', APP_VERSION);
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' blob:; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    const { pathname } = new URL(req.url, 'http://localhost');
    if (!pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
      serveStatic(req, res, pathname);
      return;
    }
    const send = (status, payload) => {
      if (res.writableEnded) return;
      if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(payload));
    };
    try {
      if (req.method !== 'GET') {
        const origin = req.headers.origin;
        if (origin && new URL(origin).host !== req.headers.host) fail(403, 'bad_origin', 'Origen no permitido.');
      }
      const match = routes.map((r) => ({ r, m: r.method === req.method ? pathname.match(r.re) : null })).find((x) => x.m);
      if (!match) fail(404, 'not_found', 'Ruta no encontrada.');
      const { r, m } = match;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const token = parseCookies(req.headers.cookie)[COOKIE];
      const body = r.raw || req.method === 'GET' || req.method === 'DELETE' ? {} : await readJson(req);
      const out = await tx(db, async () => {
        const identity = r.auth === 'none' ? null : await userFromToken(db, token, clock());
        if (r.auth !== 'none' && !identity) fail(401, 'not_authenticated', 'Tu sesión terminó. Vuelve a entrar.');
        // Serializa operaciones sobre el mismo alumno incluso con dos procesos Node.
        // Las solicitudes de otros alumnos pueden avanzar en conexiones separadas.
        if (db.lock) await db.lock(identity?.id ?? 0);
        const user = identity ? await userFromToken(db, token, clock()) : null;
        if (r.auth !== 'none' && !user) fail(401, 'not_authenticated', 'Tu sesión terminó. Vuelve a entrar.');
        if (r.auth === 'admin' && user.role !== 'admin') fail(403, 'forbidden', 'Solo para administración.');
        return r.handler({ req, res, user, params, body });
      });
      if (res.destroyed) return;
      if (out?.audio && Buffer.isBuffer(out.audio)) {
        res.writeHead(200, { 'Content-Type': out.mimeType, 'Content-Length': out.audio.length, 'Cache-Control': 'no-store' });
        res.end(out.audio);
        return;
      }
      if (out !== undefined) send(200, out);
    } catch (err) {
      if (!res.headersSent) res.removeHeader('Set-Cookie');
      if (err instanceof HttpError) { send(err.status, { error: err.code, message: err.message }); return; }
      console.error('Fallo de operación', err.code ?? err.name);
      send(500, { error: 'server_error', message: 'No pudimos confirmar esta operación. Revisa tu progreso y vuelve a intentarlo.' });
    }
  });
  return server;
}

export const newRequestId = randomUUID;
