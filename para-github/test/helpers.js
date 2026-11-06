import { openDb } from '../server/db.js';
import { createApp } from '../server/app.js';
import { createInvitation, redeemInvitation } from '../server/auth.js';
import { loadConfig } from '../server/config.js';
import { createVoiceServices } from '../server/voice/index.js';

/** Hora de Nueva York expresada como instante UTC (en noviembre, despues del cambio: UTC-5). */
export const at = (iso) => Date.parse(iso);

export async function makeUser(db, name, nowMs, role = 'student') {
  const { code } = await createInvitation(db, { role }, nowMs);
  const r = await redeemInvitation(db, { code, username: name, displayName: name, password: 'password123' }, nowMs);
  return db.prepare('SELECT * FROM users WHERE id=?').get(r.userId);
}

export async function startApp({ env = {}, services, now } = {}) {
  const db = openDb(':memory:');
  const config = loadConfig({ ...env });
  const clockBox = { now: now ?? Date.parse('2026-11-05T15:00:00Z') };
  const server = createApp({ db, config, services: services ?? createVoiceServices(config), clock: () => clockBox.now });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = () => {
    let cookie = '';
    return async (method, path, body, headers = {}) => {
      const res = await fetch(base + path, {
        method,
        headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
      });
      const set = res.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0];
      const type = res.headers.get('content-type') ?? '';
      return { status: res.status, data: type.includes('json') ? await res.json() : await res.arrayBuffer() };
    };
  };
  return { db, base, config, server, clockBox, client, stop: () => new Promise((ok) => { server.closeAllConnections(); server.close(ok); }) };
}

export async function login(app, name) {
  const api = app.client();
  const { code } = await createInvitation(app.db, { role: 'student' }, app.clockBox.now);
  const r = await api('POST', '/api/auth/redeem', { code, username: name, displayName: name, password: 'password123' });
  if (r.status !== 200) throw new Error(JSON.stringify(r.data));
  return api;
}

/** Responde correctamente segun el catalogo; sirve para recorrer sesiones completas. */
export function correctAnswer(ex, VOCAB_BY_ID) {
  if (ex.type === 'repeat') return { recordedMs: 1500 };
  // Los ejercicios escritos a mano no revelan su respuesta: basta una respuesta real y relacionada.
  if (ex.type === 'choice' || ex.type === 'distinguish') return ex.options[0];
  if (ex.type === 'best_choice') return { option: ex.options[0], reason: ex.reasons?.[0] };
  if (ex.type === 'order') return { tokens: ex.tokens };
  if (!ex.vocabId) return 'Of course, let me check with the kitchen and come right back.';
  const entry = VOCAB_BY_ID.get(ex.vocabId);
  if (ex.type === 'listen_choose') return entry.es;
  if (ex.type === 'complete') return entry.en;
  if (ex.type === 'recall') return entry.en;
  return entry.reply;
}
