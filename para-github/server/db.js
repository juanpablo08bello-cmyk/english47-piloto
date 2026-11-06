import { AsyncLocalStorage } from 'node:async_hooks';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','admin')),
  active INTEGER NOT NULL DEFAULT 1,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  help_mode TEXT NOT NULL DEFAULT 'help' CHECK (help_mode IN ('help','work')),
  sound_on INTEGER NOT NULL DEFAULT 1,
  keep_transcripts INTEGER NOT NULL DEFAULT 0,
  shields INTEGER NOT NULL DEFAULT 0,
  equipped TEXT NOT NULL DEFAULT '{}',
  placement_unit INTEGER NOT NULL DEFAULT 1,
  diagnostic_status TEXT NOT NULL DEFAULT 'pending',
  diagnostic_result TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  label TEXT,
  created_by INTEGER,
  expires_at INTEGER NOT NULL,
  used_by INTEGER,
  used_at TEXT,
  revoked INTEGER NOT NULL DEFAULT 0
);
-- Un registro por usuario y fecha local: es el evento unico de finalizacion de la jornada.
CREATE TABLE IF NOT EXISTS streak_days (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('practiced','shielded')),
  full_done INTEGER NOT NULL DEFAULT 0,
  brief_done INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, local_date)
);
-- Libro mayor de recompensas: la clave unica impide pagar dos veces la misma actividad.
CREATE TABLE IF NOT EXISTS reward_events (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
CREATE TABLE IF NOT EXISTS unlocks (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS achievements (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
CREATE TABLE IF NOT EXISTS vocab_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  introduced_date TEXT NOT NULL,
  last_review_date TEXT,
  last_fail_date TEXT,
  recognized_count INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, vocab_id)
);
CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vocab_id TEXT NOT NULL,
  PRIMARY KEY (user_id, vocab_id)
);
CREATE TABLE IF NOT EXISTS personal_phrases (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  en TEXT NOT NULL,
  es TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS daily_sessions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date TEXT NOT NULL,
  state TEXT NOT NULL,
  completed_date TEXT,
  last_action_at INTEGER,
  PRIMARY KEY (user_id, local_date)
);
CREATE TABLE IF NOT EXISTS lesson_answers (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  PRIMARY KEY (user_id, lesson_id, idx)
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  times INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS sim_sessions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('demo','ai')),
  help_mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  state TEXT NOT NULL,
  summary TEXT,
  comfort INTEGER,
  created_at TEXT NOT NULL,
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sim_user ON sim_sessions(user_id, id);
CREATE TABLE IF NOT EXISTS sim_requests (
  sim_id INTEGER NOT NULL REFERENCES sim_sessions(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  response TEXT NOT NULL,
  PRIMARY KEY (sim_id, request_id)
);
CREATE TABLE IF NOT EXISTS task_evidence (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, task, source)
);
CREATE TABLE IF NOT EXISTS job_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date TEXT NOT NULL,
  challenge TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  capability TEXT NOT NULL,
  provider TEXT NOT NULL,
  units REAL NOT NULL,
  unit_type TEXT NOT NULL,
  day TEXT NOT NULL,
  month TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_usage_month ON usage_log(month, capability);
CREATE TABLE IF NOT EXISTS idempotency (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
-- Comentarios del piloto: bandeja del administrador, separada del historial de aprendizaje.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id TEXT,
  section TEXT NOT NULL,
  trying TEXT NOT NULL,
  problem TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  UNIQUE (user_id, request_id)
);
`;

export const SCHEMA_VERSION = 3;

const hasColumn = (db, table, column) => db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);

/** Clasifica una simulacion antigua. La XP ya pagada no se toca. */
export function legacyOutcome(summary, critical) {
  const criteria = summary?.criteria ?? [];
  const met = criteria.filter((c) => c.met);
  if (!met.length) return 'attempted';
  const criticalOk = !critical || criteria.find((c) => c.id === critical)?.met;
  return criticalOk && met.length / criteria.length >= 0.7 ? 'resolved' : 'completed';
}

const CRITICAL = { nut_allergy: 'no_guarantee', order_not_right: 'escalate' };

/**
 * Migracion v1 -> v2. Solo anade columnas y rellena datos nuevos; no borra progreso.
 * Antes de cambiar una base existente guarda una copia junto a ella (ver README).
 */
export function migrate(db, path) {
  const version = db.prepare('PRAGMA user_version').get().user_version;
  if (version >= SCHEMA_VERSION) return { from: version, migrated: false };
  const existing = db.prepare('SELECT COUNT(*) n FROM users').get().n > 0;
  let backup = null;
  if (existing && path !== ':memory:') {
    backup = `${path}.respaldo-v${version}-${Date.now()}`;
    db.exec(`VACUUM INTO '${backup.replace(/'/g, "''")}'`);
  }
  syncTransaction(db, () => {
    if (!hasColumn(db, 'users', 'daily_new')) db.exec('ALTER TABLE users ADD COLUMN daily_new INTEGER NOT NULL DEFAULT 5');
    if (!hasColumn(db, 'users', 'placement_source')) db.exec(`ALTER TABLE users ADD COLUMN placement_source TEXT NOT NULL DEFAULT 'default'`);
    if (!hasColumn(db, 'sim_sessions', 'outcome')) db.exec(`ALTER TABLE sim_sessions ADD COLUMN outcome TEXT`);
    if (!hasColumn(db, 'sim_sessions', 'has_quotes')) db.exec('ALTER TABLE sim_sessions ADD COLUMN has_quotes INTEGER NOT NULL DEFAULT 0');
    if (!hasColumn(db, 'lesson_progress', 'last_correct')) db.exec('ALTER TABLE lesson_progress ADD COLUMN last_correct INTEGER');
    if (!hasColumn(db, 'lesson_progress', 'last_total')) db.exec('ALTER TABLE lesson_progress ADD COLUMN last_total INTEGER');
    // v3: la respuesta registrada se devuelve tal cual ante una peticion repetida.
    if (!hasColumn(db, 'lesson_answers', 'result')) db.exec('ALTER TABLE lesson_answers ADD COLUMN result TEXT');
    if (!hasColumn(db, 'lesson_answers', 'answer_hash')) db.exec('ALTER TABLE lesson_answers ADD COLUMN answer_hash TEXT');
    for (const row of db.prepare(`SELECT id, scenario_id, summary FROM sim_sessions WHERE status='finished' AND outcome IS NULL`).all()) {
      const summary = row.summary ? JSON.parse(row.summary) : null;
      const hasQuotes = Boolean(summary && (summary.improvements?.some((i) => i.yours) || /[«»]/.test(summary.didWell ?? '')));
      db.prepare('UPDATE sim_sessions SET outcome=?, has_quotes=? WHERE id=?')
        .run(summary ? legacyOutcome(summary, CRITICAL[row.scenario_id]) : 'attempted', hasQuotes ? 1 : 0, row.id);
    }
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
  return { from: version, migrated: true, backup };
}

const depth = new WeakMap();

export function openDb(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  const out = migrate(db, path);
  if (out.backup) console.log(`Base migrada de v${out.from} a v${SCHEMA_VERSION}. Copia previa: ${out.backup}`);
  return db;
}

/** Transaccion reentrante: las llamadas anidadas se unen a la transaccion exterior. */
function syncTransaction(db, fn) {
  const d = depth.get(db) || 0;
  if (d > 0) return fn();
  depth.set(db, 1);
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    depth.set(db, 0);
  }
}

// Las rutas pueden esperar consultas PostgreSQL. SQLite conserva una sola conexión
// por instancia y encola transacciones exteriores para aislar solicitudes concurrentes.
const activeTransaction = new AsyncLocalStorage();
const queues = new WeakMap();
export async function tx(db, operation) {
  if (db.transaction) return db.transaction(operation);
  if (activeTransaction.getStore() === db) return operation();
  const previous = queues.get(db) ?? Promise.resolve();
  let release;
  queues.set(db, new Promise(resolve => { release = resolve; }));
  await previous;
  try {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = await activeTransaction.run(db, operation);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  } finally {
    release();
  }
}
