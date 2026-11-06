// Copia consistente de la base, aun con el servidor encendido. Uso: npm run respaldar
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { loadConfig, loadDotEnv } from '../server/config.js';

loadDotEnv();
const { dbPath, storage } = loadConfig();
if (storage === 'postgres') throw Error('Para PostgreSQL usa pg_dump con el esquema english47. Ver POSTGRES.md.');
mkdirSync('respaldos', { recursive: true });
const target = `respaldos/english47-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
const db = new DatabaseSync(dbPath);
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();
console.log(`Respaldo guardado en ${target}`);
