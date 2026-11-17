// Conversación: reglas puras del pack diario y del repaso espaciado (sin base de datos).
// El estado vive dentro de la jornada (`practice.conv`) y pasa de un día al siguiente, como la memoria de Aprender.
import { addDays, diffDays } from './dates.js';
import { DIAS, FRASES_CONV_CUE, PACKS } from '../content/conversacion.js';

export const DAYS_PER_PACK = 5;
export const GRAD_INTERVALS = [3, 7, 14, 30, 60];
export const MAX_REVIEW = 5;
export const MIN_VOICE_ATTEMPTS = 3;
export const GOOD_STARS = 4;
export const RESET_AFTER_DAYS = 7;

export const freshConv = () => ({ packIdx: 0, day: 0, lastDate: null, hist: {}, grad: {}, today: { date: null, best: {}, counted: false, reviewCounted: false, silent: false } });

/** Normaliza el estado (jornadas de versiones anteriores) y lo deja al día: nuevo día = intentos de hoy en cero. */
export function convFor(p, today) {
  const conv = p.conv && typeof p.conv === 'object' ? p.conv : (p.conv = freshConv());
  const base = freshConv();
  for (const k of Object.keys(base)) conv[k] ??= base[k];
  for (const k of Object.keys(base.today)) conv.today[k] ??= base.today[k];
  if (conv.today.date !== today) conv.today = { ...base.today, date: today };
  // Una semana o más sin practicar: el pack vuelve a su primer día, sin culpas.
  if (conv.lastDate && conv.day > 0 && diffDays(today, conv.lastDate) >= RESET_AFTER_DAYS) conv.day = 0;
  conv.dueN = dueIds(conv, today).length;
  return conv;
}

/** Lo que se carga al día siguiente: todo menos los intentos de hoy. */
export function carryConv(before) {
  if (!before?.conv) return freshConv();
  return { ...freshConv(), ...before.conv, today: freshConv().today };
}

export const packIds = (conv) => PACKS[conv.packIdx] ?? null;
export const dayInfo = (conv) => DIAS[Math.min(conv.day, DIAS.length - 1)];

/** Frases graduadas que toca repasar hoy: las más atrasadas y flojas primero, máximo 5 por sesión. */
export function dueIds(conv, today) {
  return Object.entries(conv.grad ?? {})
    .filter(([, g]) => g.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || (b[1].lapses ?? 0) - (a[1].lapses ?? 0))
    .slice(0, MAX_REVIEW).map(([id]) => Number(id));
}

/** ¿Está esta frase disponible hoy? (la del pack o una de repaso). */
export function allowedToday(conv, idx, today) {
  return Boolean(packIds(conv)?.includes(idx) || dueIds(conv, today).includes(idx));
}

export function targetOf(conv, idx, today) {
  return allowedToday(conv, idx, today) ? FRASES_CONV_CUE[idx]?.en ?? null : null;
}

/** Anota un intento hablado. `stars` 0-5. Se guarda la mejor nota del día. */
export function recordAttempt(conv, idx, stars, today) {
  const s = Math.max(0, Math.min(5, Math.round(stars)));
  conv.today.best[idx] = Math.max(conv.today.best[idx] ?? 0, s);
  if (s >= GOOD_STARS && packIds(conv)?.includes(idx)) {
    const h = (conv.hist[idx] ??= { days: [], blind: false });
    if (!h.days.includes(today)) h.days.push(today);
    // «Sin ver el texto» = días 4 y 5 del pack (decir desde el español y ráfaga).
    if (conv.day >= 3) h.blind = true;
  }
}

const attempted = (conv, ids) => ids.filter((id) => (conv.today.best[id] ?? 0) >= 1).length;

/** Cierra la pasada del pack de hoy. Cuenta con 3 frases dichas en voz (o en modo silencioso). */
export function finishPack(conv, today, { silent = false } = {}) {
  const ids = packIds(conv);
  if (!ids) return { ok: false, reason: 'no_pack' };
  if (conv.today.counted) return { ok: true, already: true, day: conv.day, graduated: false };
  if (!silent && attempted(conv, ids) < MIN_VOICE_ATTEMPTS) return { ok: false, reason: 'few_attempts', need: MIN_VOICE_ATTEMPTS, have: attempted(conv, ids) };
  conv.today.counted = true;
  conv.today.silent = Boolean(silent);
  conv.lastDate = today;
  conv.day += 1;
  let graduated = false;
  if (conv.day >= DAYS_PER_PACK) {
    for (const id of ids) {
      const h = conv.hist[id];
      const good = Boolean(h && h.days.length >= 2 && h.blind);
      conv.grad[id] = { stage: 0, due: addDays(today, good ? GRAD_INTERVALS[0] : 1), lapses: 0, weak: !good };
      delete conv.hist[id];
    }
    conv.packIdx += 1;
    conv.day = 0;
    graduated = true;
  }
  return { ok: true, day: conv.day, graduated };
}

/** Cierra el repaso de hoy: acierto (≥3 estrellas) alarga el intervalo; fallo vuelve mañana. */
export function finishReview(conv, today, { silent = false } = {}) {
  const ids = dueIds(conv, today);
  if (!ids.length) return { ok: false, reason: 'nothing_due' };
  if (conv.today.reviewCounted) return { ok: true, already: true };
  const need = Math.min(MIN_VOICE_ATTEMPTS, ids.length);
  if (!silent && attempted(conv, ids) < need) return { ok: false, reason: 'few_attempts', need, have: attempted(conv, ids) };
  for (const id of ids) {
    const g = conv.grad[id];
    const stars = conv.today.best[id];
    if (stars == null) continue; // no tocada: sigue pendiente, no se acumula
    if (stars >= 3) { g.stage = Math.min(g.stage + 1, GRAD_INTERVALS.length - 1); g.due = addDays(today, GRAD_INTERVALS[g.stage]); g.weak = false; }
    else { g.stage = Math.max(0, g.stage - 1); g.lapses = (g.lapses ?? 0) + 1; g.due = addDays(today, 1); g.weak = true; }
  }
  conv.today.reviewCounted = true;
  conv.lastDate = today;
  return { ok: true, done: ids.length };
}

/** Resumen para el plan del día. */
export function planConv(conv) {
  return {
    done: Boolean(conv.today.counted), count: conv.today.counted ? 1 : 0, goal: 1,
    day: conv.day, days: DAYS_PER_PACK, pack: packIds(conv) ? conv.packIdx + 1 : null, packs: PACKS.length,
    finishedAll: !packIds(conv),
  };
}
