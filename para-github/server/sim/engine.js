// Motor de simulaciones. Dos modos, nunca mezclados:
//  - demo: practica guiada con guion y evaluacion por reglas; no entiende conversacion libre.
//  - ai: cliente y evaluador conectados a un proveedor real.
// Resultado de cada simulacion:
//  - attempted: hubo participacion.
//  - completed: se recorrio la escena respondiendo a la situacion.
//  - resolved: ademas se cumplieron sus criterios esenciales.
//  «Para reforzar» lista lo que debe reaparecer, sea cual sea el resultado.
import { pronounce } from '../../content/pronunciacion.js';
import { tx } from '../db.js';
import { localDate } from '../dates.js';
import { award, grantAchievement, RULES } from '../progress.js';
import { scheduleSoon } from '../srs.js';
import { politenessNote, seededRng, similarity } from '../exercises.js';
import { findViolation, isSubstantive, phrasePresent, rejectedBy } from '../evaluate.js';
import { checkOrder } from '../order.js';
import { SCENARIO_BY_ID } from '../../content/scenarios.js';
import { VOCAB_BY_ID } from '../../content/vocab.js';
import { ProviderError } from '../voice/providers.js';
import { checkLimit, logUsage } from '../voice/index.js';

const XP_ATTEMPT = 5;
const RESOLVE_SHARE = 0.7;
const ABANDONED_MS = 24 * 60 * 60 * 1000;

/** Todas las palabras de un grupo, como palabras completas y sin negar. */
const anyGroup = (text, groups = []) => groups.some((g) => g.every((k) => phrasePresent(text, k)));

async function loadSim(db, userId, simId) {
  const row = await db.prepare('SELECT * FROM sim_sessions WHERE id=? AND user_id=?').get(simId, userId);
  if (!row) return null;
  return { ...row, state: JSON.parse(row.state), summary: row.summary ? JSON.parse(row.summary) : null };
}

const saveState = async (db, sim) => await db.prepare('UPDATE sim_sessions SET state=? WHERE id=?').run(JSON.stringify(sim.state), sim.id);

function guideBeat(sim, scenario) {
  const last = scenario.beats.length - 1;
  if (sim.mode === 'demo') return scenario.beats[Math.min(sim.state.beat, last)];
  return scenario.beats[Math.min(sim.state.turns.filter((t) => t.role === 'waiter').length, last)];
}

/** Sin consentimiento nunca se muestra una cita, aunque exista en un resumen antiguo. */
export function sanitizeSummary(summary, keepQuotes) {
  if (!summary || keepQuotes) return summary;
  return {
    ...summary,
    didWell: /[«»]/.test(summary.didWell ?? '') ? genericDidWell(summary) : summary.didWell,
    improvements: (summary.improvements ?? []).map(({ yours, ...rest }) => rest),
  };
}

function genericDidWell(summary) {
  const met = (summary.criteria ?? []).filter((c) => c.met);
  if (met.length) return `${met.length === 1 ? 'Punto' : 'Puntos'} de servicio ${met.length === 1 ? 'cumplido' : 'cumplidos'}: ${met.map((c) => c.es.toLowerCase()).join('; ')}.`;
  return 'Participaste en la conversación. Revisa abajo lo que conviene reforzar.';
}

export function publicSim(sim, keepQuotes) {
  const scenario = SCENARIO_BY_ID.get(sim.scenario_id);
  const { state } = sim;
  const beat = guideBeat(sim, scenario);
  return {
    id: sim.id,
    scenarioId: sim.scenario_id,
    title: scenario.title,
    titleEs: scenario.titleEs,
    objective: scenario.objective,
    mode: sim.mode,
    helpMode: sim.help_mode,
    status: sim.status,
    outcome: sim.outcome ?? null,
    done: state.done,
    turns: state.turns.map(({ text, role, source }) => ({ text, role, source })),
    waiterTurns: state.turns.filter((t) => t.role === 'waiter').length,
    goal: sim.help_mode === 'help' && !state.done ? beat.goal : null,
    demoOptions: !state.done && sim.mode === 'demo' ? beat.options : null,
    demoPron: !state.done && sim.mode === 'demo' ? Object.fromEntries(beat.options.map((o) => [o, pronounce(o)])) : null,
    summary: sanitizeSummary(sim.summary, keepQuotes),
    comfort: sim.comfort,
  };
}

/** Cierra simulaciones abandonadas: sin permiso de guardar, sus turnos no se quedan. */
export async function closeAbandoned(db, user, nowMs) {
  const cutoff = new Date(nowMs - ABANDONED_MS).toISOString();
  for (const row of await db.prepare(`SELECT id, state FROM sim_sessions WHERE user_id=? AND status='active' AND created_at<?`).all(user.id, cutoff)) {
    const state = JSON.parse(row.state);
    const participated = state.turns.some((t) => t.role === 'waiter');
    if (!user.keep_transcripts) { state.turns = []; state.ledger = ''; }
    state.done = true;
    await db.prepare(`UPDATE sim_sessions SET status='finished', outcome=?, state=?, finished_at=? WHERE id=?`)
      .run(participated ? 'attempted' : 'not_started', JSON.stringify(state), new Date(nowMs).toISOString(), row.id);
  }
}

export async function createSim(db, user, { scenarioId, mode, helpMode }, services, config, nowMs) {
  const scenario = SCENARIO_BY_ID.get(scenarioId);
  if (!scenario) return { error: 'not_found', message: 'Ese escenario no existe.' };
  if (mode === 'ai' && !services.llm) return { error: 'ai_unavailable', message: 'La conversación con IA no está conectada. Puedes usar la práctica guiada.' };
  await closeAbandoned(db, user, nowMs);
  const help = helpMode === 'work' ? 'work' : 'help';
  const seed = `${user.id}:${scenarioId}:${nowMs}`;
  const rng = seededRng(seed);
  const state = { beat: 0, seed, met: [], rejected: [], turns: [], ledger: '', retried: false, done: false, heardVia: 'text' };

  if (mode === 'ai') {
    const limit = await checkLimit(db, config, user, 'llm', nowMs);
    if (limit) return { error: limit.code, message: limit.message };
    try {
      const opening = await services.llm.customerTurn({ scenario, turns: [], ledger: '' });
      await logUsage(db, user, 'llm', services.llm.name, opening.tokens, 'tokens', nowMs);
      state.turns.push({ role: 'guest', text: opening.say });
      state.ledger = opening.ledger;
    } catch (err) {
      return providerFailure(err);
    }
  } else {
    const variants = scenario.beats[0].guest;
    state.turns.push({ role: 'guest', text: variants[Math.floor(rng() * variants.length)] });
  }
  const created = await db.prepare(
    'INSERT INTO sim_sessions (user_id, scenario_id, mode, help_mode, state, created_at) VALUES (?,?,?,?,?,?) RETURNING id',
  ).run(user.id, scenarioId, mode, help, JSON.stringify(state), new Date(nowMs).toISOString());
  return { sim: await loadSim(db, user.id, Number(created.lastInsertRowid)) };
}

function providerFailure(err) {
  if (err instanceof ProviderError && err.code === 'rate_limited') return { error: 'provider_rate_limited', message: 'La cuota de IA está agotada. Puedes continuar en la práctica guiada.' };
  if (err instanceof ProviderError) return { error: `provider_${err.code}`, message: 'El servicio de voz no respondió. Tu práctica sigue guardada: intenta de nuevo o continúa por texto.' };
  throw err;
}

function demoTurn(sim, scenario, text) {
  const { state } = sim;
  const beat = scenario.beats[state.beat];
  const nonsense = !isSubstantive(text);
  const violation = findViolation(text, beat.avoid ?? []);
  const rejected = Boolean(violation) || rejectedBy(text, beat.reject);
  // Una orden se comprueba por sus datos, no por nombrar los platos.
  const order = beat.check ? checkOrder(text, beat.check) : null;
  const met = !nonsense && !rejected && (order ? order.ok : anyGroup(text, beat.accept));
  const lastWaiter = state.turns[state.turns.length - 1];
  lastWaiter.beat = state.beat;
  lastWaiter.met = met;
  lastWaiter.meaningful = !nonsense;
  if (order && !order.ok) lastWaiter.orderProblems = order.problems;
  if (rejected) state.rejected.push(beat.criterion);
  if (met) {
    for (const id of [beat.criterion, ...(beat.also ?? [])]) if (!state.met.includes(id)) state.met.push(id);
  }

  // Con ayuda, el cliente da una segunda oportunidad una vez por momento de la escena.
  if (!met && sim.help_mode === 'help' && !state.retried && !rejected) {
    state.retried = true;
    if (order && !nonsense) return { guest: "Hmm, I don't think that's quite what we said. Could you check that again?", done: false };
    return { guest: nonsense ? "Sorry, I didn't understand that. Could you say it again?" : "Sorry, I'm not sure I followed. Could you say that another way?", done: false };
  }
  state.retried = false;
  state.beat += 1;
  if (state.beat >= scenario.beats.length) {
    // El cierre del guion aprueba la orden: no se dice si la confirmacion quedo mal.
    return { guest: order && !met ? "Hmm, that's not what we ordered. We'll check the food when it comes out." : scenario.closingLine, done: true };
  }
  const rng = seededRng(`${state.seed}:${state.beat}`);
  const variants = scenario.beats[state.beat].guest;
  return { guest: variants[Math.floor(rng() * variants.length)], done: false };
}

export async function takeTurn(db, user, simId, { text, source, requestId }, services, config, nowMs) {
  const sim = await loadSim(db, user.id, simId);
  if (!sim) return { error: 'not_found', message: 'No encontramos esa simulación.' };
  if (requestId) {
    const dup = await db.prepare('SELECT response FROM sim_requests WHERE sim_id=? AND request_id=?').get(simId, requestId);
    if (dup) return { sim: await loadSim(db, user.id, simId), duplicate: true };
  }
  if (sim.status !== 'active' || sim.state.done) return { error: 'finished', message: 'Esta simulación ya terminó.' };
  const clean = String(text ?? '').trim().slice(0, 600);
  if (clean.length < 2) return { error: 'empty', message: 'No recibimos tu respuesta. Inténtalo otra vez.' };
  const scenario = SCENARIO_BY_ID.get(sim.scenario_id);
  const turn = { role: 'waiter', text: clean, source: source === 'audio' ? 'audio' : 'text', meaningful: isSubstantive(clean) };
  sim.state.turns.push(turn);
  if (source === 'audio') sim.state.heardVia = 'audio';

  let reply;
  if (sim.mode === 'demo') {
    reply = demoTurn(sim, scenario, clean);
  } else {
    const limit = await checkLimit(db, config, user, 'llm', nowMs);
    if (limit) return { error: limit.code, message: limit.message };
    try {
      const out = await services.llm.customerTurn({ scenario, turns: sim.state.turns, ledger: sim.state.ledger });
      await logUsage(db, user, 'llm', services.llm.name, out.tokens, 'tokens', nowMs);
      sim.state.ledger = out.ledger;
      reply = { guest: out.say, done: out.done || (config.pilotFree ? sim.state.turns.filter(t => t.role === 'waiter').length >= 6 : sim.state.turns.length > 40) };
    } catch (err) {
      return providerFailure(err);
    }
  }
  sim.state.turns.push({ role: 'guest', text: reply.guest });
  sim.state.done = reply.done;
  await tx(db, async () => {
    await saveState(db, sim);
    if (requestId) await db.prepare('INSERT INTO sim_requests (sim_id, request_id, response) VALUES (?,?,?) ON CONFLICT DO NOTHING').run(simId, requestId, '1');
  });
  return { sim, meaningful: turn.meaningful };
}

export async function hintFor(db, user, simId) {
  const sim = await loadSim(db, user.id, simId);
  if (!sim) return { error: 'not_found', message: 'No encontramos esa simulación.' };
  if (sim.help_mode !== 'help') return { error: 'work_mode', message: 'En «Como en el trabajo» la corrección llega al final.' };
  const scenario = SCENARIO_BY_ID.get(sim.scenario_id);
  const beat = guideBeat(sim, scenario);
  // Con IA la conversacion es libre: la pista es orientativa, no la siguiente linea exacta.
  return { hint: beat.hint, goal: beat.goal, generic: sim.mode === 'ai' };
}

export async function rephrase(db, user, simId, services, config, nowMs) {
  const sim = await loadSim(db, user.id, simId);
  if (!sim) return { error: 'not_found', message: 'No encontramos esa simulación.' };
  if (sim.state.done) return { error: 'finished', message: 'Esta simulación ya terminó.' };
  const scenario = SCENARIO_BY_ID.get(sim.scenario_id);
  let text;
  if (sim.mode === 'demo') {
    const variants = scenario.beats[sim.state.beat].guest;
    const current = sim.state.turns[sim.state.turns.length - 1].text;
    text = variants.find((v) => v !== current) ?? `Let me say it again, slowly: ${current}`;
  } else {
    const limit = await checkLimit(db, config, user, 'llm', nowMs);
    if (limit) return { error: limit.code, message: limit.message };
    try {
      const out = await services.llm.customerTurn({
        scenario, turns: sim.state.turns, ledger: sim.state.ledger,
        instruction: 'The server did not understand your last line. Say the same thing again in simpler words. Do not add anything new.',
      });
      await logUsage(db, user, 'llm', services.llm.name, out.tokens, 'tokens', nowMs);
      text = out.say;
    } catch (err) {
      return providerFailure(err);
    }
  }
  sim.state.turns.push({ role: 'guest', text, rephrase: true });
  await saveState(db, sim);
  return { sim };
}

/** Evaluacion de la practica guiada: reglas sobre lo recibido. No dice nada de pronunciacion. */
export function ruleSummary(sim, scenario) {
  const { state } = sim;
  const waiterTurns = state.turns.filter((t) => t.role === 'waiter');
  const metTurn = waiterTurns.find((t) => t.met && !politenessNote(t.text)) ?? waiterTurns.find((t) => t.met);
  const metBeat = metTurn != null ? scenario.beats[metTurn.beat] : null;
  const crit = scenario.criteria.find((c) => c.id === metBeat?.criterion);
  const meaningful = waiterTurns.filter((t) => t.meaningful).length;
  let didWell;
  if (metTurn) didWell = `Punto de servicio cumplido: ${crit.es.toLowerCase()}. Dijiste: «${metTurn.text.replace(/[.!?]+$/, '')}».`;
  else if (meaningful) didWell = `Respondiste ${meaningful} ${meaningful === 1 ? 'vez' : 'veces'} a la situación y seguiste la conversación. Todavía no se cumplió ningún criterio de servicio.`;
  else didWell = 'Abriste la conversación, pero tus respuestas no se relacionan con la situación, así que no cuentan como práctica resuelta.';

  const seen = new Set(waiterTurns.map((t) => t.beat));
  const improvements = [];
  const unmetBeats = scenario.beats
    .filter((b) => !state.met.includes(b.criterion))
    .sort((a, b) => Number(b.criterion === scenario.critical) - Number(a.criterion === scenario.critical));
  for (const beat of unmetBeats.slice(0, 2)) {
    const index = scenario.beats.indexOf(beat);
    const answered = seen.has(index);
    const lastTurn = [...waiterTurns].reverse().find((t) => t.beat === index);
    const yours = lastTurn?.text ?? null;
    const isCritical = beat.criterion === scenario.critical;
    improvements.push({
      yours,
      communicated: !answered ? 'No llegaste a este momento de la escena.' : (yours && !isSubstantive(yours) ? 'No identificamos una respuesta relacionada.' : 'Respondiste, pero sin cumplir este punto de servicio.'),
      corrected: beat.model,
      alternative: beat.alt,
      why: lastTurn?.orderProblems?.slice(0, 3).join(' ') ?? (yours && politenessNote(yours)) ?? (isCritical ? `Punto clave de servicio: ${beat.goal}` : `En este momento hacía falta: ${beat.goal}`),
    });
  }
  if (improvements.length < 2) {
    for (const t of waiterTurns) {
      const note = politenessNote(t.text);
      if (note && improvements.length < 2 && t.beat != null && !improvements.some((i) => i.yours === t.text)) {
        const beat = scenario.beats[t.beat];
        improvements.push({ yours: t.text, communicated: 'La idea se entiende.', corrected: beat.model, alternative: beat.alt, why: note });
      }
    }
  }
  return {
    didWell,
    improvements,
    criteria: scenario.criteria.map((c) => ({ id: c.id, es: c.es, met: state.met.includes(c.id) })),
    vocab: [...new Set(unmetBeats.flatMap((b) => b.vocab))],
    evaluator: 'rules',
  };
}

function aiSummary(raw, scenario) {
  const metIds = new Set((raw.criteria ?? []).filter((c) => c.met).map((c) => c.id));
  const unmet = scenario.beats.filter((b) => !metIds.has(b.criterion));
  return {
    didWell: String(raw.did_well),
    improvements: (raw.improvements ?? []).slice(0, 2).map((i) => ({ yours: i.yours, communicated: i.communicated ?? null, corrected: i.corrected, alternative: i.alternative, why: i.why })),
    criteria: scenario.criteria.map((c) => ({ id: c.id, es: c.es, met: metIds.has(c.id) })),
    vocab: [...new Set(unmet.flatMap((b) => b.vocab))],
    evaluator: 'ai',
  };
}

/** Quita cualquier fragmento literal del alumno de un texto generado. */
function scrubQuotes(text, waiterTurns) {
  let out = String(text ?? '');
  for (const t of waiterTurns) {
    if (t.text.length >= 8 && out.includes(t.text)) out = out.split(t.text).join('[respuesta omitida]');
  }
  return out;
}

function computeOutcome(sim, scenario, summary) {
  const waiterTurns = sim.state.turns.filter((t) => t.role === 'waiter');
  const meaningful = waiterTurns.filter((t) => t.meaningful).length;
  // Recorrer la escena repitiendo palabras no es completarla.
  const needed = sim.mode === 'demo' ? Math.ceil(scenario.beats.length / 2) : 1;
  if (!sim.state.done || meaningful < needed) return 'attempted';
  if (summary.evaluator === 'unavailable') return 'completed';
  const met = summary.criteria.filter((c) => c.met).length;
  const criticalOk = !scenario.critical || summary.criteria.find((c) => c.id === scenario.critical)?.met;
  // Si la escena termina confirmando una orden, confirmarla mal impide resolverla.
  const finalBeat = scenario.beats.at(-1);
  const orderOk = !finalBeat.check || summary.criteria.find((c) => c.id === finalBeat.criterion)?.met;
  return criticalOk && orderOk && met / summary.criteria.length >= RESOLVE_SHARE ? 'resolved' : 'completed';
}

export async function finishSim(db, user, simId, services, config, nowMs, hooks = {}) {
  const sim = await loadSim(db, user.id, simId);
  if (!sim) return { error: 'not_found', message: 'No encontramos esa simulación.' };
  if (sim.status === 'finished') return { sim, rewards: { xp: 0, coins: 0, bonus: 0, newDay: false }, duplicate: true };
  const scenario = SCENARIO_BY_ID.get(sim.scenario_id);
  const waiterTurns = sim.state.turns.filter((t) => t.role === 'waiter');
  if (!waiterTurns.length) return { error: 'no_turns', message: 'Responde al menos una vez al cliente para poder darte una corrección.' };
  const meaningfulCount = waiterTurns.filter((t) => t.meaningful).length;

  let summary;
  let aiFailed = false;
  if (sim.mode === 'ai' && meaningfulCount && !await checkLimit(db, config, user, 'llm', nowMs)) {
    try {
      const out = await services.llm.evaluate({ scenario, turns: sim.state.turns, heardVia: sim.state.heardVia });
      await logUsage(db, user, 'llm', services.llm.name, out.tokens, 'tokens', nowMs);
      summary = aiSummary(out.summary, scenario);
      sim.state.met = summary.criteria.filter((c) => c.met).map((c) => c.id);
    } catch (err) {
      if (!(err instanceof ProviderError)) throw err;
      aiFailed = true;
    }
  } else if (sim.mode === 'ai') {
    aiFailed = meaningfulCount > 0;
  }
  if (!summary) {
    summary = sim.mode === 'ai'
      ? { didWell: `Respondiste ${waiterTurns.length} ${waiterTurns.length === 1 ? 'vez' : 'veces'} al cliente IA. El evaluador no respondió, así que no hay corrección de esta sesión.`, improvements: [], criteria: scenario.criteria.map((c) => ({ id: c.id, es: c.es, met: false, unknown: true })), vocab: [], evaluator: 'unavailable' }
      : ruleSummary(sim, scenario);
  }
  const outcome = computeOutcome(sim, scenario, summary);
  summary.outcome = outcome;
  summary.endedEarly = !sim.state.done;
  summary.reinforce = summary.evaluator === 'unavailable' ? [] : summary.criteria.filter((c) => !c.met).map((c) => c.es);
  summary.evaluationBasis = sim.state.heardVia === 'audio' ? 'transcript' : 'text';
  summary.pronunciation = 'not_evaluated';
  summary.aiFailed = aiFailed;
  summary.modelLine = scenario.beats[scenario.beats.length - 1].model;
  summary.reviewVocab = summary.vocab.map((id) => ({ id, en: VOCAB_BY_ID.get(id)?.en })).filter((v) => v.en);
  summary.criticalMet = scenario.critical && summary.evaluator !== 'unavailable' ? summary.criteria.find((c) => c.id === scenario.critical)?.met ?? false : null;

  // Lo que se muestra ahora puede citar al alumno; lo que se guarda, solo con su permiso.
  const shownNow = { ...summary, improvements: summary.improvements.map((i) => ({ ...i })) };
  const keep = Boolean(user.keep_transcripts);
  let stored = summary;
  if (!keep) {
    stored = {
      ...summary,
      didWell: scrubQuotes(/[«»]/.test(summary.didWell) ? genericDidWell(summary) : summary.didWell, waiterTurns),
      improvements: summary.improvements.map(({ yours, ...rest }) => ({
        ...rest,
        communicated: rest.communicated ? scrubQuotes(rest.communicated, waiterTurns) : rest.communicated,
        why: scrubQuotes(rest.why, waiterTurns),
        corrected: scrubQuotes(rest.corrected, waiterTurns),
        alternative: scrubQuotes(rest.alternative, waiterTurns),
      })),
    };
  }

  const today = localDate(nowMs, user.timezone);
  const result = await tx(db, async () => {
    const fresh = await db.prepare('SELECT status FROM sim_sessions WHERE id=?').get(simId);
    if (fresh.status === 'finished') return { xp: 0, achievements: [] };
    // Se premia el esfuerzo real, y se separa de resolver: decir cualquier cosa no suma.
    let xp = 0;
    if (meaningfulCount && outcome !== 'attempted') {
      if (await award(db, user.id, `sim:${sim.scenario_id}:${today}`, { xp: RULES.XP_SIMULATION }, nowMs)) xp = RULES.XP_SIMULATION;
    } else if (meaningfulCount) {
      if (await award(db, user.id, `sim_try:${sim.scenario_id}:${today}`, { xp: XP_ATTEMPT }, nowMs)) xp = XP_ATTEMPT;
    }
    for (const id of summary.vocab) if (VOCAB_BY_ID.has(id)) await scheduleSoon(db, user.id, id, today);
    for (const c of summary.criteria) {
      const task = scenario.criteria.find((x) => x.id === c.id)?.task;
      if (c.met && task) {
        await db.prepare('INSERT INTO task_evidence (user_id, task, source, created_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING')
          .run(user.id, task, `sim:${sim.id}`, new Date(nowMs).toISOString());
      }
    }
    const earned = [];
    if (outcome !== 'attempted' && await grantAchievement(db, user.id, 'first_conversation', nowMs)) earned.push('first_conversation');
    if (summary.criteria.find((c) => c.id === 'confirm')?.met && await grantAchievement(db, user.id, 'confirmed_order', nowMs)) earned.push('confirmed_order');
    if (scenario.complaint && outcome === 'resolved' && await grantAchievement(db, user.id, 'solved_complaint', nowMs)) earned.push('solved_complaint');

    sim.state.done = true;
    // Sin permiso expreso, la conversacion no queda guardada al terminar.
    if (!keep) { sim.state.turns = []; sim.state.ledger = ''; }
    await db.prepare(`UPDATE sim_sessions SET status='finished', outcome=?, summary=?, has_quotes=?, state=?, finished_at=? WHERE id=?`)
      .run(outcome, JSON.stringify(stored), keep ? 1 : 0, JSON.stringify(sim.state), new Date(nowMs).toISOString(), simId);
    return { xp, achievements: earned };
  });
  const talkRewards = (await hooks.onFinished?.(stored, outcome)) ?? null;
  const merged = {
    xp: result.xp + (talkRewards?.xp ?? 0),
    coins: talkRewards?.coins ?? 0,
    bonus: talkRewards?.bonus ?? 0,
    newDay: talkRewards?.newDay ?? false,
    achievements: result.achievements,
  };
  return { sim: await loadSim(db, user.id, simId), rewards: merged, shownNow };
}

/**
 * Reintento real tras una correccion: exige un intento nuevo y lo compara con la version corregida.
 * Escuchar el audio no pasa por aqui. El texto no se guarda.
 */
export async function retryAttempt(db, user, simId, { index, text, recordedMs }, nowMs) {
  const sim = await loadSim(db, user.id, simId);
  if (!sim) return { error: 'not_found', message: 'No encontramos esa simulación.' };
  const target = sim.summary?.improvements?.[Number(index)];
  if (!target) return { error: 'not_found', message: 'No encontramos esa corrección.' };
  const typed = String(text ?? '').trim();
  const recorded = Number(recordedMs ?? 0) >= 400;
  if (!typed && !recorded) return { error: 'empty', message: 'Escribe o graba tu nuevo intento.' };
  if (typed && !isSubstantive(typed)) {
    return { ok: false, status: 'review', message: 'Eso no parece un intento de la frase. Inténtalo otra vez.', corrected: target.corrected };
  }
  const score = typed ? similarity(typed, target.corrected) : null;
  const alternative = target.alternative ? similarity(typed, target.alternative) : 0;
  const best = Math.max(score ?? 0, alternative);
  const earned = await grantAchievement(db, user.id, 'retried_phrase', nowMs);
  if (recorded && !typed) {
    return { ok: true, status: 'needs_review', message: 'Registramos tu nuevo intento grabado. No evaluamos pronunciación: escúchate y compáralo con la versión corregida.', corrected: target.corrected, earned };
  }
  if (best >= 0.8) return { ok: true, status: 'correct', message: 'Muy cerca de la versión corregida. Buen intento.', corrected: target.corrected, earned };
  return { ok: true, status: 'needs_review', message: 'Registramos tu intento. Se aleja de la versión corregida, pero puede ser una variante válida: compáralos.', corrected: target.corrected, earned };
}

export async function setComfort(db, user, simId, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return { error: 'bad_value', message: 'Elige un valor del 1 al 5.' };
  const res = await db.prepare('UPDATE sim_sessions SET comfort=? WHERE id=? AND user_id=?').run(n, simId, user.id);
  return res.changes ? { ok: true } : { error: 'not_found', message: 'No encontramos esa simulación.' };
}

/** Quita citas de resumenes guardados y de la sesion diaria. Lo pide el alumno; no borra resultados. */
export async function removeStoredQuotes(db, userId) {
  return await tx(db, async () => {
    let count = 0;
    for (const row of await db.prepare('SELECT id, summary FROM sim_sessions WHERE user_id=? AND summary IS NOT NULL AND has_quotes=1').all(userId)) {
      const clean = sanitizeSummary(JSON.parse(row.summary), false);
      await db.prepare('UPDATE sim_sessions SET summary=?, has_quotes=0 WHERE id=?').run(JSON.stringify(clean), row.id);
      count += 1;
    }
    for (const row of await db.prepare('SELECT local_date, state FROM daily_sessions WHERE user_id=?').all(userId)) {
      const state = JSON.parse(row.state);
      const items = state.steps?.improve?.items;
      if (items?.some((i) => i.yours)) {
        state.steps.improve.items = items.map(({ yours, ...rest }) => rest);
        await db.prepare('UPDATE daily_sessions SET state=? WHERE user_id=? AND local_date=?').run(JSON.stringify(state), userId, row.local_date);
      }
    }
    return count;
  });
}

export async function countStoredQuotes(db, userId) {
  return (await db.prepare('SELECT COUNT(*) n FROM sim_sessions WHERE user_id=? AND has_quotes=1').get(userId)).n;
}
