// Crea (o recrea) una cuenta de alumno de PRUEBA en la base de desarrollo aislada y escribe sus datos en JSON.
//   node scripts/dev-seed.js <db> <salida.json> [usuario]
// Nunca toca produccion: usa dev-env.js. La contrasena es aleatoria y solo queda en el JSON de salida (ignorado por git).
import { randomBytes } from 'node:crypto';
import { rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { applyDevEnv } from './dev-env.js';

const [db = 'data/e2e.db', out = 'data/e2e-cuenta.json', username = 'alumno.prueba'] = process.argv.slice(2);
for (const s of ['', '-wal', '-shm']) rmSync(db + s, { force: true });
process.env.DB_PATH = db;
const cfg = applyDevEnv({ db });

const { openStorage } = await import('../server/storage/index.js');
const { createInvitation, redeemInvitation } = await import('../server/auth.js');
const conn = await openStorage(cfg);
const now = Date.now();
const inv = await createInvitation(conn, { role: 'student', label: 'Cuenta de prueba' }, now);
if (!inv.ok) { console.error(inv.message); process.exit(1); }
const password = randomBytes(12).toString('base64url');
const r = await redeemInvitation(conn, { code: inv.code, username, displayName: 'Alumno Prueba', password }, now);
await conn.close();
if (!r.ok) { console.error(r.message); process.exit(1); }
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ username, password }));
console.log(`cuenta de prueba lista en ${db} (datos en ${out})`);
