// Cuentas privadas: sin registro publico, solo por invitacion de un solo uso.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { tx } from './db.js';

export const MAX_STUDENTS = 5;
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;
const INVITE_MS = 1000 * 60 * 60 * 24 * 7;
const sha = (s) => createHash('sha256').update(s).digest('hex');

export function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const candidate = scryptSync(password, Buffer.from(salt, 'hex'), 64);
  return timingSafeEqual(candidate, Buffer.from(key, 'hex'));
}

export const MIN_PASSWORD = 8;

/** Cambia la contraseña y cierra todas las sesiones de esa cuenta. */
export async function setPassword(db, userId, password) {
  await db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(password), userId);
  await db.prepare('DELETE FROM sessions WHERE user_id=?').run(userId);
}

/** Contraseña temporal fácil de dictar: sin letras ni números que se confundan. */
export function temporaryPassword() {
  const letters = 'abcdefghjkmnpqrstuvwxyz23456789';
  return [...randomBytes(10)].map((b) => letters[b % letters.length]).join('');
}

export async function createSession(db, userId, nowMs) {
  const token = randomBytes(32).toString('base64url');
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)')
    .run(sha(token), userId, nowMs + SESSION_MS);
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowMs);
  return token;
}

export async function userFromToken(db, token, nowMs) {
  if (!token) return null;
  return await db.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`,
  ).get(sha(token), nowMs) || null;
}

export async function destroySession(db, token) {
  if (token) await db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token));
}

export async function activeStudents(db) {
  return (await db.prepare(`SELECT COUNT(*) n FROM users WHERE role='student' AND active=1`).get()).n;
}

export async function pendingStudentInvites(db, nowMs) {
  return (await db.prepare(
    `SELECT COUNT(*) n FROM invitations WHERE role='student' AND used_by IS NULL AND revoked=0 AND expires_at>?`,
  ).get(nowMs)).n;
}

export async function createInvitation(db, { role = 'student', label = null, createdBy = null, bootstrapCode }, nowMs) {
  return tx(db, async () => {
    if (db.lock) await db.lock(-1);
    if (role === 'student' && await activeStudents(db) + await pendingStudentInvites(db, nowMs) >= MAX_STUDENTS) {
      return { ok: false, code: 'seats_full', message: `Ya están ocupadas las ${MAX_STUDENTS} plazas de alumno.` };
    }
    const code = role === 'admin' && bootstrapCode ? bootstrapCode : randomBytes(9).toString('base64url');
    await db.prepare('INSERT INTO invitations (code_hash, role, label, created_by, expires_at) VALUES (?,?,?,?,?)')
      .run(sha(code), role, label, createdBy, nowMs + INVITE_MS);
    return { ok: true, code };
  });
}

export async function redeemInvitation(db, { code, username, displayName, password }, nowMs) {
  const name = String(username || '').trim().toLowerCase();
  const display = String(displayName || '').trim();
  if (!/^[a-z0-9._-]{3,24}$/.test(name)) {
    return { ok: false, code: 'bad_username', message: 'Usa de 3 a 24 letras o números, sin espacios.' };
  }
  if (display.length < 2 || display.length > 40) {
    return { ok: false, code: 'bad_name', message: 'Escribe tu nombre (2 a 40 caracteres).' };
  }
  if (String(password || '').length < 8) {
    return { ok: false, code: 'bad_password', message: 'La contraseña necesita al menos 8 caracteres.' };
  }
  return await tx(db, async () => {
    if (db.lock) await db.lock(-1);
    const inv = await db.prepare(
      'SELECT * FROM invitations WHERE code_hash=? AND used_by IS NULL AND revoked=0 AND expires_at>?',
    ).get(sha(String(code || '').trim()), nowMs);
    if (!inv) return { ok: false, code: 'bad_invite', message: 'La invitación no es válida o ya se usó. Pide una nueva.' };
    if (await db.prepare('SELECT 1 FROM users WHERE username=?').get(name)) {
      return { ok: false, code: 'username_taken', message: 'Ese usuario ya existe. Prueba con otro.' };
    }
    if (inv.role === 'student' && await activeStudents(db) >= MAX_STUDENTS) {
      return { ok: false, code: 'seats_full', message: 'Ya no quedan plazas disponibles.' };
    }
    const created = await db.prepare(
      'INSERT INTO users (username, display_name, password_hash, role, created_at) VALUES (?,?,?,?,?) RETURNING id',
    ).run(name, display, hashPassword(password), inv.role, new Date(nowMs).toISOString());
    const userId = Number(created.lastInsertRowid);
    await db.prepare('UPDATE invitations SET used_by=?, used_at=? WHERE id=?')
      .run(userId, new Date(nowMs).toISOString(), inv.id);
    return { ok: true, userId };
  });
}

/** Limite de intentos de acceso por usuario e IP (en memoria, suficiente para un solo servidor). */
export function createLoginLimiter({ max = 6, windowMs = 15 * 60 * 1000 } = {}) {
  const hits = new Map();
  return {
    blocked(key, nowMs) {
      const h = hits.get(key);
      if (!h) return false;
      if (nowMs - h.first > windowMs) { hits.delete(key); return false; }
      return h.count >= max;
    },
    fail(key, nowMs) {
      const h = hits.get(key);
      if (!h || nowMs - h.first > windowMs) hits.set(key, { first: nowMs, count: 1 });
      else h.count += 1;
    },
    clear(key) { hits.delete(key); },
  };
}
