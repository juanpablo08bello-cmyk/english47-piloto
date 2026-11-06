import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile } from 'node:fs/promises';
import pg from 'pg';

// Solo SQL estático de la aplicación. Las cadenas entre comillas se conservan.
function bindParameters(sql) {
  let index = 0;
  return sql.replace(/'(?:''|[^'])*'|\?/g, token => token === '?' ? '$' + (++index) : token);
}

export function connectPostgres(connectionString, maxConnections = 5) {
  if (!connectionString) throw Error('Falta DATABASE_URL para PostgreSQL.');
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw Error('DATABASE_URL requiere PostgreSQL.');
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('ssl') || ['host','options'].includes(key)) throw Error('Configura TLS con PG_CA_PEM y usa la URL sin parámetros SSL.');
  }
  const pool = new pg.Pool({
    connectionString: url.href, max: maxConnections, connectionTimeoutMillis: 8000,
    onConnect: client => client.query('SET search_path TO english47, pg_catalog'),
    ssl: local ? false : { rejectUnauthorized: true, ...(process.env.PG_CA_PEM ? { ca: process.env.PG_CA_PEM.replace(/\\n/g, '\n') } : {}) },
    types: { getTypeParser: (oid, format) => oid === 20 ? Number : pg.types.getTypeParser(oid, format) },
  });
  pool.on('error', () => console.error('Se interrumpió una conexión inactiva a la base.'));
  const context = new AsyncLocalStorage();
  const query = (sql, values) => (context.getStore() ?? pool).query(sql, values);
  const transaction = async operation => {
    if (context.getStore()) return operation();
    const client = await pool.connect();
    let discard = false;
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL search_path TO english47, pg_catalog');
      const value = await context.run(client, operation);
      await client.query('COMMIT');
      return value;
    } catch (err) {
      try { await client.query('ROLLBACK'); } catch { discard = true; }
      throw err;
    } finally {
      client.release(discard);
    }
  };
  return {
    dialect: 'postgres', query, transaction, close: () => pool.end(),
    lock: id => query('SELECT pg_advisory_xact_lock(47147, $1)', [id]),
    prepare(sql) {
      const statement = bindParameters(sql);
      return {
        get: async (...args) => (await query(statement, args)).rows[0],
        all: async (...args) => (await query(statement, args)).rows,
        run: async (...args) => {
          const result = await query(statement, args);
          return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
        },
      };
    },
  };
}

export async function installSchema(db) {
  const schema = await readFile(new URL('./001-pilot.sql', import.meta.url), 'utf8');
  await db.transaction(async () => {
    await db.lock(-47);
    await db.query('CREATE SCHEMA IF NOT EXISTS english47');
    await db.query('REVOKE ALL ON SCHEMA english47 FROM PUBLIC');
    await db.query('CREATE TABLE IF NOT EXISTS english47.schema_versions (version integer primary key)');
    const { rows } = await db.query('SELECT max(version) v FROM english47.schema_versions');
    if (rows[0].v === 1) return;
    if (rows[0].v !== null) throw Error('Versión de esquema no compatible.');
    await db.query(schema);
    await db.query('INSERT INTO english47.schema_versions VALUES (1)');
  });
}

export async function verifySchema(db) {
  const { rows } = await db.query('SELECT max(version) v FROM english47.schema_versions');
  if (rows[0].v !== 1) throw Error('Se requiere la migración de PostgreSQL del piloto.');
}
