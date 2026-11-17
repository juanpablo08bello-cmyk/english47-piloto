// Entorno de DESARROLLO/PRUEBAS aislado: SQLite propia, nunca la base de produccion.
// El .env real trae DATABASE_URL (PostgreSQL con alumnos reales). Aqui se anula ANTES de cargarlo
// y se aborta si no se logro aislar. Lo usan dev-local.js y dev-seed.js.
import { loadConfig, loadDotEnv } from '../server/config.js';

export function applyDevEnv({ db = 'data/dev-reforma.db', port = '4748' } = {}) {
  process.env.DATABASE_URL = '';
  process.env.PILOT_FREE = 'false';
  process.env.STORAGE_DRIVER = 'sqlite';
  process.env.DB_PATH = process.env.DB_PATH || db;
  process.env.PORT = process.env.PORT || port;
  process.env.HOST = '127.0.0.1';
  process.env.COOKIE_SECURE = 'false';
  delete process.env.RENDER;
  loadDotEnv();
  const cfg = loadConfig();
  if (cfg.storage !== 'sqlite' || cfg.databaseUrl) {
    console.error('ABORTADO: no se logro forzar SQLite. No se continua para no tocar produccion.');
    process.exit(1);
  }
  return cfg;
}
