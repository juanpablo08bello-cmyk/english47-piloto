// Arranque de DESARROLLO: base SQLite propia, nunca la de produccion (ver dev-env.js).
// Las claves de voz/IA del .env si se conservan para poder probar el microfono (cuota gratuita).
//   npm run dev               -> sirve el cliente actual (public/)
//   npm run dev -- --nuevo    -> sirve el cliente 2.0 compilado (web/dist)
//   npm run dev -- --limpio   -> borra la base de desarrollo antes de arrancar
import { rmSync } from 'node:fs';
import { applyDevEnv } from './dev-env.js';

if (process.argv.includes('--nuevo')) process.env.CLIENT_DIR = 'web/dist';
const dbPath = process.env.DB_PATH || 'data/dev-reforma.db';
if (process.argv.includes('--limpio')) {
  for (const sufijo of ['', '-wal', '-shm']) rmSync(dbPath + sufijo, { force: true });
}

const cfg = applyDevEnv();
console.log(`[dev-local] SQLite ${cfg.dbPath} · puerto ${cfg.port} · produccion NO conectada`);
await import('../server/index.js');
