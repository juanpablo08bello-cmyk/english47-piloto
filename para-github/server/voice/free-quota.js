import { AsyncLocalStorage } from 'node:async_hooks';
import { ProviderError } from './providers.js';

const actor = new AsyncLocalStorage();
export const asLearner = (user, action) => actor.run(user, action);
const perLearner = { stt: 8, tts: 10, llm: 10 };

// Conexión independiente: un rechazo del proveedor no revierte la reserva ya consumida.
export function freeQuota(db, limits) {
  return async (capability, opening = false) => {
    const user = actor.getStore();
    const day = new Date().toISOString().slice(0,10);
    if (!user?.id || !(limits[capability] > 0)) throw new ProviderError('rate_limited','Cuota deshabilitada.');
    await db.transaction(async () => {
      await db.lock(-48);
      const entries = [
        [0, capability, limits[capability]],
        [user.id, capability, perLearner[capability]],
      ];
      if (opening) entries.push([user.id, 'opening', 1]);
      for (const [account, kind, limit] of entries) {
        const result = await db.prepare(`INSERT INTO free_requests (day, account, kind, used) VALUES (?,?,?,1)
          ON CONFLICT (day,account,kind) DO UPDATE SET used=free_requests.used+1 WHERE free_requests.used < ?`).run(day,account,kind,limit);
        if (!result.changes) throw new ProviderError('rate_limited','Alcanzaste el límite del piloto.');
      }
    });
  };
}
