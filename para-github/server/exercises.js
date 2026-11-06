// Generacion y correccion de ejercicios. Las respuestas nunca viajan al navegador
// hasta que el alumno responde: publicExercise retira todo lo que las revelaria.
import { createHash } from 'node:crypto';
import { VOCAB, VOCAB_BY_ID } from '../content/vocab.js';
import { CATEGORY_BY_KEY } from '../content/categories.js';
import { normalize, similarity, tokens } from './text.js';
import {
  assessConfirm, assessExpression, assessFix, assessOpen, assessRephrase, buildResult, closedResult, politenessNote,
} from './evaluate.js';

export { normalize, similarity, politenessNote };

/** Huella de una respuesta: detecta el mismo envio repetido sin guardar el texto. */
export function answerHash(answer) {
  const value = typeof answer === 'string' ? answer : JSON.stringify(answer ?? '');
  return createHash('sha256').update(normalize(value)).digest('hex').slice(0, 16);
}

const TEAM_CATEGORY = CATEGORY_BY_KEY.get('team').name;

// Generador pseudoaleatorio con semilla: mismos ejercicios para el mismo alumno y dia.
export function seededRng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function shuffled(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function distractors(entry, field, rng, count = 3) {
  const same = VOCAB.filter((v) => v.id !== entry.id && v.category === entry.category);
  const other = VOCAB.filter((v) => v.id !== entry.id && v.category !== entry.category);
  const picks = [...shuffled(same, rng), ...shuffled(other, rng).slice(0, 12)].map((v) => v[field]);
  return [...new Set(picks)].filter((p) => p !== entry[field]).slice(0, count);
}

const isTeam = (entry) => entry.category === TEAM_CATEGORY;

function gapped(entry) {
  const re = new RegExp(entry.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return entry.phrase.replace(re, '_____');
}

export function buildExercise(type, vocabId, rng) {
  const entry = VOCAB_BY_ID.get(vocabId);
  const base = { type, vocabId };
  switch (type) {
    case 'listen_choose':
      // `expected` congela la respuesta: si el catalogo cambia, una sesion en curso sigue siendo coherente.
      return { ...base, audio: entry.en, prompt: '¿Qué significa lo que escuchaste?', options: shuffled([entry.es, ...distractors(entry, 'es', rng)], rng), expected: entry.es };
    case 'complete':
      return { ...base, audio: null, prompt: 'Completa la frase de servicio', text: gapped(entry), options: shuffled([entry.en, ...distractors(entry, 'en', rng)], rng), expected: entry.en };
    case 'recall':
      return { ...base, audio: null, prompt: 'Dilo en inglés, sin opciones', cue: entry.es };
    case 'respond':
      return { ...base, audio: entry.guest, prompt: isTeam(entry) ? 'Responde a tu compañero en inglés' : 'Responde al cliente en inglés', speaker: isTeam(entry) ? 'Compañero' : 'Cliente', guest: entry.guest, cue: entry.es };
    case 'repeat':
      return { ...base, audio: entry.phrase, prompt: 'Escucha y repítelo con intención', text: entry.phrase };
    default:
      throw new Error(`Tipo de ejercicio desconocido: ${type}`);
  }
}

/** Prepara un ejercicio escrito a mano: baraja lo que deba barajarse, con semilla. */
export function prepareAuthored(ex, rng) {
  const out = { ...ex };
  if (ex.options) out.options = shuffled(ex.options, rng);
  if (ex.reasons) out.reasons = shuffled(ex.reasons, rng);
  if (ex.type === 'order') out.tokens = shuffled(ex.answer.split(' '), rng);
  return out;
}

const SECRET_FIELDS = ['answer', 'reason', 'why', 'accept', 'bad', 'intents', 'required', 'avoid', 'reply', 'alt', 'details', 'hint', 'targets', 'acceptAlso', 'order', 'expected', 'vocabRef'];

export function publicExercise(ex) {
  const out = { ...ex };
  for (const f of SECRET_FIELDS) delete out[f];
  // Una respuesta libre solo muestra cuantos detalles pide, no cuales.
  if (ex.type === 'confirm') out.detailCount = ex.details?.length ?? null;
  return out;
}

function assessRepeat(ex, answer) {
  const recorded = Number(answer?.recordedMs ?? 0) >= 400;
  const typedText = answer?.text ?? '';
  const typed = typedText ? similarity(typedText, ex.text) >= 0.75 : false;
  const ok = recorded || typed;
  return {
    ...buildResult({
      status: ok ? 'correct' : 'review', level: 'recognize', expected: ex.text, meaning: ok ? 'ok' : 'none', meaningful: ok,
      srs: ok ? 'pass' : 'none',
      change: ok ? null : 'Graba tu voz o escribe la frase para continuar.',
    }),
    canRetry: !ok,
    evaluated: 'none',
    note: ok ? (recorded ? 'Registramos tu grabación. No evaluamos pronunciación.' : 'Registramos que la escribiste. No evaluamos pronunciación.') : null,
  };
}

function entrySpec(entry) {
  return { targets: [entry.en, ...entry.alts], reply: entry.reply, alt: entry.phrase, intents: entry.intents ?? [], required: entry.required, avoid: entry.avoid };
}

export function checkAnswer(ex, answer) {
  const given = typeof answer === 'string' ? answer : answer?.text ?? '';
  switch (ex.type) {
    case 'repeat':
      return assessRepeat(ex, answer);
    case 'listen_choose':
    case 'complete': {
      const entry = VOCAB_BY_ID.get(ex.vocabId);
      const expected = ex.expected ?? (ex.type === 'listen_choose' ? entry.es : entry.en);
      return closedResult({ correct: given === expected, expected, alt: entry?.phrase ?? null });
    }
    case 'recall':
      return assessExpression(given, VOCAB_BY_ID.get(ex.vocabId));
    case 'respond': {
      if (ex.vocabId) return assessOpen(given, entrySpec(VOCAB_BY_ID.get(ex.vocabId)));
      return assessOpen(given, ex);
    }
    case 'choice':
    case 'distinguish':
      return closedResult({ correct: given === ex.answer, expected: ex.answer, note: ex.why });
    case 'best_choice': {
      const option = answer?.option ?? given;
      const optionOk = option === ex.answer;
      const reasonOk = !ex.reason || answer?.reason === ex.reason;
      const out = closedResult({ correct: optionOk && reasonOk, expected: ex.answer, note: ex.why });
      if (optionOk && !reasonOk) return { ...out, status: 'close', srs: 'none', feedback: { ...out.feedback, answer: null, change: `Elegiste bien la frase, pero el motivo es otro. ${ex.why}` } };
      return out;
    }
    case 'order': {
      const list = Array.isArray(answer?.tokens) ? answer.tokens : tokens(given);
      const sent = normalize(list.join(' '));
      const ok = [ex.answer, ...(ex.acceptAlso ?? [])].some((a) => normalize(a) === sent);
      return closedResult({ correct: ok, expected: ex.answer, note: ex.why, level: 'use' });
    }
    case 'fix_error':
      return assessFix(given, ex);
    case 'rephrase':
      return assessRephrase(given, ex);
    case 'confirm':
      return assessConfirm(given, ex);
    default:
      throw new Error(`Tipo de ejercicio desconocido: ${ex.type}`);
  }
}
