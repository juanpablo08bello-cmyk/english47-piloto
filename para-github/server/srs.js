// Repaso espaciado: 1, 3, 7, 14 y 30 dias. Un fallo adelanta el proximo repaso.
import { addDays } from './dates.js';

export const INTERVALS = [1, 3, 7, 14, 30];

export async function recordResult(db, userId, vocabId, { level, correct }, today) {
  const row = await db.prepare('SELECT * FROM vocab_progress WHERE user_id=? AND vocab_id=?').get(userId, vocabId);
  if (!row) {
    await db.prepare(
      `INSERT INTO vocab_progress (user_id, vocab_id, stage, due_date, introduced_date, last_review_date,
        last_fail_date, recognized_count, used_count, lapses)
       VALUES (?,?,0,?,?,?,?,?,?,?)`,
    ).run(
      userId, vocabId, addDays(today, INTERVALS[0]), today, today,
      correct ? null : today,
      correct && level === 'recognize' ? 1 : 0,
      correct && level === 'use' ? 1 : 0,
      correct ? 0 : 1,
    );
    return;
  }
  const recognized = row.recognized_count + (correct && level === 'recognize' ? 1 : 0);
  const used = row.used_count + (correct && level === 'use' ? 1 : 0);
  if (!correct) {
    await db.prepare(
      `UPDATE vocab_progress SET stage=?, due_date=?, last_fail_date=?, lapses=lapses+1,
        recognized_count=?, used_count=? WHERE user_id=? AND vocab_id=?`,
    ).run(Math.max(0, row.stage - 1), addDays(today, 1), today, recognized, used, userId, vocabId);
    return;
  }
  // Solo avanza una vez por dia, nunca el dia en que se presento o fallo.
  const canAdvance = row.introduced_date !== today && row.last_review_date !== today
    && row.last_fail_date !== today && row.due_date <= today;
  const stage = canAdvance ? Math.min(row.stage + 1, INTERVALS.length - 1) : row.stage;
  const due = canAdvance ? addDays(today, INTERVALS[stage]) : row.due_date;
  await db.prepare(
    `UPDATE vocab_progress SET stage=?, due_date=?, last_review_date=?, recognized_count=?, used_count=?
     WHERE user_id=? AND vocab_id=?`,
  ).run(stage, due, canAdvance ? today : row.last_review_date, recognized, used, userId, vocabId);
}

/**
 * Por consolidar: ya aparecio, pero falta usarla bien o la ultima practica fallo.
 * Es una etiqueta para orientar el repaso, no una medida de dominio.
 */
export function isPendingConsolidation(p) {
  return p.used_count === 0 || p.stage < 2 || p.last_fail_date != null && (p.last_review_date == null || p.last_fail_date >= p.last_review_date);
}

/** Pendientes primero; dentro de ellos, los que mas fallos acumulan. */
export async function dueVocab(db, userId, today, limit) {
  return (await db.prepare(
    `SELECT vocab_id id FROM vocab_progress WHERE user_id=? AND due_date<=?
     ORDER BY lapses DESC, due_date ASC, vocab_id LIMIT ?`,
  ).all(userId, today, limit)).map((r) => r.id);
}

/** Forzar un repaso pronto para expresiones que salieron en una correccion. */
export async function scheduleSoon(db, userId, vocabId, today) {
  const row = await db.prepare('SELECT stage FROM vocab_progress WHERE user_id=? AND vocab_id=?').get(userId, vocabId);
  if (!row) {
    await recordResult(db, userId, vocabId, { level: 'recognize', correct: false }, today);
    await db.prepare('UPDATE vocab_progress SET lapses=0 WHERE user_id=? AND vocab_id=?').run(userId, vocabId);
    return;
  }
  const tomorrow = addDays(today, 1);
  await db.prepare('UPDATE vocab_progress SET due_date=? WHERE user_id=? AND vocab_id=? AND due_date>?')
    .run(tomorrow, userId, vocabId, tomorrow);
}
