// Reglas de racha, recompensas, protectores y tienda. Todo se decide en el servidor.
import { tx } from './db.js';
import { addDays, diffDays, localDate, weekStart } from './dates.js';
import { season, seasonKey, seasonStart } from './season.js';
import { TIENDA_ITEMS } from '../content/tienda.js';

export const RULES = {
  // Un día completo: 15 + 25 + 15 = 55 XP.
  XP_LESSON: 15,
  XP_SIMULATION: 25,
  XP_REVIEW: 15,
  COINS_PER_DAY: 20,
  COINS_PER_7_DAYS: 50,
  SHIELD_PRICE: 60,
  MAX_SHIELDS: 2,
  WEEKLY_GOAL_DAYS: 4,
};

// La tienda: se compran animales y, por separado, los looks (fotos completas generadas en Flow) de CADA animal.
// Un look solo sirve al animal para el que se compró; hace falta tener el animal. Catálogo generado por art/flow/exportar_looks.py.
export const SHOP_ITEMS = [
  { id: 'shield', kind: 'shield', name: 'Protector de racha', price: RULES.SHIELD_PRICE, desc: 'Cubre un día perdido. Máximo dos guardados.' },
  ...TIENDA_ITEMS,
];
export const EQUIP_SLOTS = ['animal', 'look'];

export const ACHIEVEMENTS = {
  first_conversation: { name: 'Primera conversación', desc: 'Recorriste completa una simulación con un cliente, respondiendo a la situación.' },
  confirmed_order: { name: 'Confirmé una orden', desc: 'Repetiste una orden para confirmarla dentro de una simulación, por voz o por escrito.' },
  solved_complaint: { name: 'Resolví una queja', desc: 'Resolviste la simulación de una queja, sin prometer de más.' },
  retried_phrase: { name: 'Volví a intentar una frase difícil', desc: 'Diste una respuesta nueva después de una corrección.' },
};

// Nivel general de la cuenta. Cada nivel cuesta 80 XP más que el anterior: con un día completo (55 XP)
// el nivel 2 toma unos 5 días, el 3 unos 6 más, y así sucesivamente.
const FIRST_LEVEL_COST = 250;
const LEVEL_COST_STEP = 80;
export const LEVEL_NAMES = ['Aprendiz', 'Ayudante', 'Mesero', 'Mesero experto', 'Capitán de sala', 'Jefe de sala', 'Maître', 'Leyenda'];

export function xpLevel(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  let level = 1;
  let spent = 0;
  let need = FIRST_LEVEL_COST;
  while (xp >= spent + need) {
    spent += need;
    level += 1;
    need += LEVEL_COST_STEP;
  }
  const into = xp - spent;
  return { level, name: LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length) - 1], xp, into, need, left: need - into, pct: Math.floor((into / need) * 100) };
}

const iso = (nowMs) => new Date(nowMs).toISOString();

export async function award(db, userId, key, { xp = 0, coins = 0 }, nowMs) {
  const res = await db.prepare(
    'INSERT INTO reward_events (user_id, key, xp, coins, created_at) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING',
  ).run(userId, key, xp, coins, iso(nowMs));
  return res.changes === 1;
}

// Lo que lleva puesto vale solo para la temporada en que se eligió: al empezar otra, vuelve la capibara.
export function readEquipped(json) {
  try {
    const { season: from = 0, ...look } = JSON.parse(json ?? '{}');
    return from === season().id ? look : {};
  } catch { return {}; }
}
export const writeEquipped = (look) => JSON.stringify(season().id ? { ...look, season: season().id } : look);

/** Artículos comprados en esta temporada. */
export async function ownedItems(db, userId) {
  const prefix = seasonKey('shop:item:');
  const rows = await db.prepare('SELECT key FROM reward_events WHERE user_id=? AND key LIKE ? AND created_at>=?').all(userId, `${prefix}%`, seasonStart());
  return new Set(rows.map((r) => r.key.slice(prefix.length)));
}

export async function balance(db, userId) {
  const row = await db.prepare(
    'SELECT COALESCE(SUM(xp),0) xp, COALESCE(SUM(coins),0) coins FROM reward_events WHERE user_id=? AND created_at>=?',
  ).get(userId, seasonStart());
  return { xp: Number(row.xp), coins: Number(row.coins) };
}

export async function grantAchievement(db, userId, key, nowMs) {
  // Un logro de otra temporada se puede volver a ganar.
  const again = await db.prepare('UPDATE achievements SET created_at=? WHERE user_id=? AND key=? AND created_at<?').run(iso(nowMs), userId, key, seasonStart());
  if (again.changes === 1) return true;
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
    // Primera visita en una temporada nueva: protectores en cero y capibara.
    const account = await db.prepare('SELECT shields, equipped FROM users WHERE id=?').get(user.id);
    let { shields } = account;
    if (season().id && (JSON.parse(account.equipped ?? '{}').season ?? 0) !== season().id) {
      await db.prepare('UPDATE users SET shields=0, equipped=? WHERE id=?').run(writeEquipped({}), user.id);
      shields = 0;
    }
    const last = (await db.prepare('SELECT MAX(local_date) d FROM streak_days WHERE user_id=? AND local_date<? AND completed_at>=?')
      .get(user.id, today, seasonStart())).d;
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
  const days = await db.prepare('SELECT local_date, status FROM streak_days WHERE user_id=? AND completed_at>=? ORDER BY local_date')
    .all(userId, seasonStart());
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
    // Si hoy ya contaba en la temporada anterior, vuelve a contar como día nuevo de esta.
    const revived = (await db.prepare(
      "UPDATE streak_days SET status='practiced', full_done=?, brief_done=?, completed_at=? WHERE user_id=? AND local_date=? AND completed_at<?",
    ).run(fullFlag, briefFlag, iso(nowMs), user.id, today, seasonStart())).changes === 1;
    const inserted = revived || (await db.prepare(
      `INSERT INTO streak_days (user_id, local_date, status, full_done, brief_done, completed_at)
       VALUES (?,?,'practiced',?,?,?) ON CONFLICT DO NOTHING`,
    ).run(user.id, today, fullFlag, briefFlag, iso(nowMs))).changes === 1;
    if (!inserted) {
      await db.prepare(
        'UPDATE streak_days SET full_done = CASE WHEN full_done=1 THEN 1 ELSE ? END, brief_done = CASE WHEN brief_done=1 THEN 1 ELSE ? END WHERE user_id=? AND local_date=?',
      ).run(fullFlag, briefFlag, user.id, today);
    }
    const coins = await award(db, user.id, seasonKey(`day:${today}`), { coins: RULES.COINS_PER_DAY }, nowMs) ? RULES.COINS_PER_DAY : 0;
    let bonus = 0;
    const { practicedTotal } = await streakStats(db, user.id, today);
    for (let n = 1; n <= Math.floor(practicedTotal / 7); n++) {
      if (await award(db, user.id, seasonKey(`block7:${n}`), { coins: RULES.COINS_PER_7_DAYS }, nowMs)) bonus += RULES.COINS_PER_7_DAYS;
    }
    return { date: today, newDay: inserted, coins, bonus };
  });
}

export async function buyItem(db, user, itemId, requestId, nowMs) {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return { ok: false, code: 'unknown_item', message: 'Ese artículo no existe.' };
  if (item.kind === 'look' && item.animal !== 'animal_capybara' && !(await ownedItems(db, user.id)).has(item.animal)) {
    return { ok: false, code: 'need_animal', message: 'Primero compra ese animal para comprarle looks.' };
  }
  if (item.earn) return { ok: false, code: 'earned_only', message: `No se compra: se gana con un logro (${item.earn}).` };
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
    if ((await ownedItems(db, user.id)).has(item.id)) {
      return { ok: true, duplicate: true };
    }
    if (coins < item.price) return { ok: false, code: 'not_enough', message: `Te faltan ${item.price - coins} monedas.` };
    await award(db, user.id, seasonKey(`shop:item:${item.id}`), { coins: -item.price }, nowMs);
    await db.prepare('INSERT INTO unlocks (user_id, item_id) VALUES (?,?) ON CONFLICT DO NOTHING').run(user.id, item.id);
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
    'SELECT local_date date, status, full_done "fullDone", brief_done "briefDone" FROM streak_days WHERE user_id=? AND local_date>=? AND completed_at>=? ORDER BY local_date',
  ).all(userId, from, seasonStart());
}

// --- Looks legendarios: no se compran, se ganan. Se conceden solos al cumplir el logro (y tener al animal). ---
export const EARN_RULES = {
  'Racha de 14 días': (ctx) => ctx.practicedTotal >= 14,
  'Nivel 4 en Mesas (20 mesas de Turno)': (ctx) => ctx.mesasHechas >= 20,
};
/** Concede los looks ganados. ctx: { practicedTotal, mesasHechas }. Devuelve los ids nuevos. Idempotente. */
export async function grantEarnedItems(db, userId, ctx, nowMs) {
  const owned = await ownedItems(db, userId);
  const given = [];
  for (const item of SHOP_ITEMS) {
    if (!item.earn || owned.has(item.id)) continue;
    const rule = EARN_RULES[item.earn];
    if (!rule || !rule(ctx)) continue;
    if (item.animal !== 'animal_capybara' && !owned.has(item.animal)) continue;
    if (await award(db, userId, seasonKey(`shop:item:${item.id}`), {}, nowMs)) {
      await db.prepare('INSERT INTO unlocks (user_id, item_id) VALUES (?,?) ON CONFLICT DO NOTHING').run(userId, item.id);
      given.push(item.id);
    }
  }
  return given;
}
