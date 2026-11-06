// Reglas de racha, recompensas, protectores y tienda. Todo se decide en el servidor.
import { tx } from './db.js';
import { addDays, diffDays, localDate, weekStart } from './dates.js';

export const RULES = {
  XP_LESSON: 10,
  XP_SIMULATION: 20,
  XP_REVIEW: 10,
  COINS_PER_DAY: 20,
  COINS_PER_7_DAYS: 50,
  SHIELD_PRICE: 60,
  MAX_SHIELDS: 2,
  WEEKLY_GOAL_DAYS: 4,
};

export const SHOP_ITEMS = [
  { id: 'shield', kind: 'shield', name: 'Protector de racha', price: RULES.SHIELD_PRICE, desc: 'Cubre un día perdido. Máximo dos guardados.' },
  { id: 'vest_green', kind: 'vest', name: 'Chaleco verde', price: 40, desc: 'Color de chaleco.' },
  { id: 'vest_blue', kind: 'vest', name: 'Chaleco azul', price: 40, desc: 'Color de chaleco.' },
  { id: 'vest_wine', kind: 'vest', name: 'Chaleco vino', price: 40, desc: 'Color de chaleco.' },
  { id: 'hat_beret', kind: 'hat', name: 'Boina', price: 80, desc: 'Accesorio para la cabeza.' },
  { id: 'hat_flower', kind: 'hat', name: 'Flor de hibisco', price: 80, desc: 'Muy Miami Beach.' },
  { id: 'glasses_round', kind: 'glasses', name: 'Lentes redondos', price: 60, desc: 'Para leer el menú con estilo.' },
];

export const ACHIEVEMENTS = {
  first_conversation: { name: 'Primera conversación', desc: 'Recorriste completa una simulación con un cliente, respondiendo a la situación.' },
  confirmed_order: { name: 'Confirmé una orden', desc: 'Repetiste una orden para confirmarla dentro de una simulación, por voz o por escrito.' },
  solved_complaint: { name: 'Resolví una queja', desc: 'Resolviste la simulación de una queja, sin prometer de más.' },
  retried_phrase: { name: 'Volví a intentar una frase difícil', desc: 'Diste una respuesta nueva después de una corrección.' },
};

const iso = (nowMs) => new Date(nowMs).toISOString();

export async function award(db, userId, key, { xp = 0, coins = 0 }, nowMs) {
  const res = await db.prepare(
    'INSERT INTO reward_events (user_id, key, xp, coins, created_at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING',
  ).run(userId, key, xp, coins, iso(nowMs));
  return res.changes === 1;
}

export async function balance(db, userId) {
  const row = await db.prepare(
    'SELECT COALESCE(SUM(xp),0) xp, COALESCE(SUM(coins),0) coins FROM reward_events WHERE user_id=?',
  ).get(userId);
  return { xp: Number(row.xp), coins: Number(row.coins) };
}

export async function grantAchievement(db, userId, key, nowMs) {
  const res = await db.prepare('INSERT INTO achievements (user_id, key, created_at) VALUES (?,?,?) ON CONFLICT DO NOTHING')
    .run(userId, key, iso(nowMs));
  return res.changes === 1;
}

/**
 * Aplica protectores a los dias perdidos entre el ultimo dia cubierto y ayer.
 * Cada unidad cubre exactamente un dia. Si no alcanzan para todo el hueco no se
 * consume ninguno: gastarlos no salvaria la racha. Es idempotente porque, una vez
 * cubierto, el hueco deja de existir.
 */
export async function reconcileShields(db, user, nowMs) {
  const today = localDate(nowMs, user.timezone);
  return await tx(db, async () => {
    const { shields } = await db.prepare('SELECT shields FROM users WHERE id=?').get(user.id);
    const last = (await db.prepare('SELECT MAX(local_date) d FROM streak_days WHERE user_id=? AND local_date<?')
      .get(user.id, today)).d;
    if (!last) return [];
    const gap = diffDays(today, last) - 1;
    if (gap <= 0 || gap > shields) return [];
    const covered = [];
    for (let i = 1; i <= gap; i++) {
      const date = addDays(last, i);
      await db.prepare(
        `INSERT INTO streak_days (user_id, local_date, status, completed_at) VALUES (?,?,'shielded',?) ON CONFLICT DO NOTHING`,
      ).run(user.id, date, iso(nowMs));
      covered.push(date);
    }
    await db.prepare('UPDATE users SET shields = shields - ? WHERE id=?').run(covered.length, user.id);
    return covered;
  });
}

/**
 * La racha cuenta dias realmente practicados dentro de una cadena continua.
 * Un dia con protector mantiene la cadena pero no suma.
 */
export async function streakStats(db, userId, today) {
  const days = await db.prepare('SELECT local_date, status FROM streak_days WHERE user_id=? ORDER BY local_date')
    .all(userId);
  const byDate = new Map(days.map((d) => [d.local_date, d.status]));
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    if (prev && diffDays(d.local_date, prev) !== 1) run = 0;
    if (d.status === 'practiced') run += 1;
    if (run > best) best = run;
    prev = d.local_date;
  }
  let current = 0;
  let cursor = byDate.has(today) ? today : addDays(today, -1);
  while (byDate.has(cursor)) {
    if (byDate.get(cursor) === 'practiced') current += 1;
    cursor = addDays(cursor, -1);
  }
  const practicedTotal = days.filter((d) => d.status === 'practiced').length;
  const weekFrom = weekStart(today);
  const practicedThisWeek = days.filter((d) => d.status === 'practiced' && d.local_date >= weekFrom && d.local_date <= today).length;
  return {
    current,
    best,
    practicedTotal,
    practicedThisWeek,
    todayStatus: byDate.get(today) || null,
    interrupted: current === 0 && practicedTotal > 0,
  };
}

/**
 * Valida la jornada con la fecha local del momento de finalizar.
 * Devuelve lo que se concedio en esta llamada (nada si ya estaba validada).
 */
export async function validatePracticeDay(db, user, kind, nowMs) {
  const today = localDate(nowMs, user.timezone);
  return await tx(db, async () => {
    await reconcileShields(db, user, nowMs);
    const fullFlag = kind === 'full' ? 1 : 0;
    const briefFlag = kind === 'brief' ? 1 : 0;
    const inserted = (await db.prepare(
      `INSERT INTO streak_days (user_id, local_date, status, full_done, brief_done, completed_at)
       VALUES (?,?,'practiced',?,?,?) ON CONFLICT DO NOTHING`,
    ).run(user.id, today, fullFlag, briefFlag, iso(nowMs))).changes === 1;
    if (!inserted) {
      await db.prepare(
        'UPDATE streak_days SET full_done = CASE WHEN full_done=1 THEN 1 ELSE ? END, brief_done = CASE WHEN brief_done=1 THEN 1 ELSE ? END WHERE user_id=? AND local_date=?',
      ).run(fullFlag, briefFlag, user.id, today);
    }
    const coins = await award(db, user.id, `day:${today}`, { coins: RULES.COINS_PER_DAY }, nowMs) ? RULES.COINS_PER_DAY : 0;
    let bonus = 0;
    const { practicedTotal } = await streakStats(db, user.id, today);
    for (let n = 1; n <= Math.floor(practicedTotal / 7); n++) {
      if (await award(db, user.id, `block7:${n}`, { coins: RULES.COINS_PER_7_DAYS }, nowMs)) bonus += RULES.COINS_PER_7_DAYS;
    }
    return { date: today, newDay: inserted, coins, bonus };
  });
}

export async function buyItem(db, user, itemId, requestId, nowMs) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, code: 'unknown_item', message: 'Ese artículo no existe.' };
  return await tx(db, async () => {
    const { coins } = await balance(db, user.id);
    if (item.kind === 'shield') {
      if (!requestId) return { ok: false, code: 'bad_request', message: 'Falta el identificador de compra.' };
      const key = `shop:shield:${requestId}`;
      const dup = await db.prepare('SELECT 1 FROM reward_events WHERE user_id=? AND key=?').get(user.id, key);
      if (dup) return { ok: true, duplicate: true };
      const { shields } = await db.prepare('SELECT shields FROM users WHERE id=?').get(user.id);
      if (shields >= RULES.MAX_SHIELDS) return { ok: false, code: 'max_shields', message: 'Ya tienes dos protectores guardados.' };
      if (coins < item.price) return { ok: false, code: 'not_enough', message: `Te faltan ${item.price - coins} monedas.` };
      await award(db, user.id, key, { coins: -item.price }, nowMs);
      await db.prepare('UPDATE users SET shields = shields + 1 WHERE id=?').run(user.id);
      return { ok: true };
    }
    if (await db.prepare('SELECT 1 FROM unlocks WHERE user_id=? AND item_id=?').get(user.id, item.id)) {
      return { ok: true, duplicate: true };
    }
    if (coins < item.price) return { ok: false, code: 'not_enough', message: `Te faltan ${item.price - coins} monedas.` };
    await award(db, user.id, `shop:item:${item.id}`, { coins: -item.price }, nowMs);
    await db.prepare('INSERT INTO unlocks (user_id, item_id) VALUES (?,?)').run(user.id, item.id);
    return { ok: true };
  });
}

export function nextReward(stats) {
  const left = 7 - (stats.practicedTotal % 7);
  return { daysLeft: left, coins: RULES.COINS_PER_7_DAYS };
}

export async function calendar(db, userId, today, days = 42) {
  const from = addDays(today, -(days - 1));
  return await db.prepare(
    'SELECT local_date date, status, full_done "fullDone", brief_done "briefDone" FROM streak_days WHERE user_id=? AND local_date>=? ORDER BY local_date',
  ).all(userId, from);
}
