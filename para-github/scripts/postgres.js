// Utilidad de preparación. La importación exige un destino vacío y una copia SQLite v3 coherente.
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { connectPostgres, installSchema, verifySchema } from '../server/storage/postgres.js';
import { loadDotEnv } from '../server/config.js';
import { SCHEMA_VERSION } from '../server/db.js';

export async function importSqlite(db, sourcePath) {
  const sqlite = new DatabaseSync(sourcePath, { readOnly:true });
  try {
    sqlite.exec('BEGIN');
    if (sqlite.prepare('PRAGMA user_version').get().user_version !== SCHEMA_VERSION) {
      throw Error('Usa una copia de la base actualizada al esquema SQLite v3.');
    }
    if (sqlite.prepare('PRAGMA foreign_key_check').get()) throw Error('La copia de origen contiene referencias inválidas.');
    await verifySchema(db);
    return await db.transaction(async () => {
      await db.lock(-47);
      // Orden por dependencias. Solo se interpolan nombres de la lista de tablas
      // y columnas del destino, nunca identificadores procedentes del archivo.
      const { rows: tables } = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='english47' AND table_type='BASE TABLE' AND table_name NOT IN ('schema_versions','free_requests') ORDER BY CASE table_name WHEN 'users' THEN 0 WHEN 'sim_sessions' THEN 1 ELSE 2 END, table_name`);
      const origin = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(t=>t.name);
      if (origin.join() !== tables.map(t=>t.table_name).sort().join()) throw Error('Las tablas del origen no coinciden con las del destino.');
      const counts = {};
      for (const { table_name: table } of tables) {
        await db.query(`LOCK TABLE "${table}" IN ACCESS EXCLUSIVE MODE`);
        if ((await db.query(`SELECT 1 FROM "${table}" LIMIT 1`)).rowCount) throw Error('El destino contiene datos. Se canceló toda la importación.');
      }
      for (const { table_name: table } of tables) {
        const info = await db.query('SELECT column_name,is_identity FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position',['english47',table]);
        const columns = info.rows.map(c=>c.column_name);
        const sourceColumns = sqlite.prepare(`PRAGMA table_info("${table}")`).all().map(c=>c.name).sort();
        if (sourceColumns.join() !== [...columns].sort().join()) throw Error('Las columnas difieren en '+table);
        const list = columns.map(c=>'"'+c+'"').join(',');
        counts[table] = 0;
        for (const row of sqlite.prepare(`SELECT ${list} FROM "${table}"`).iterate()) {
          await db.query(`INSERT INTO "${table}" (${list}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(c=>row[c]));
          counts[table]++;
        }
        if (info.rows.some(c=>c.is_identity==='YES')) {
          const {rows:[{ next }]} = await db.query(`SELECT COALESCE(MAX(id),0)+1 AS next FROM "${table}"`);
          // ALTER ... RESTART es transaccional, a diferencia de setval().
          await db.query(`ALTER TABLE "${table}" ALTER COLUMN id RESTART WITH ${Number(next)}`);
        }
      }
      return counts;
    });
  } finally { sqlite.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadDotEnv();
  const db = connectPostgres(process.env.DATABASE_URL);
  try {
    const [command,source] = process.argv.slice(2);
    if (command === 'init') { await installSchema(db); console.log('Esquema privado preparado.'); }
    else if (command === 'import' && source) console.log(await importSqlite(db, source));
    else throw Error('Uso: npm run db:init o npm run db:import -- copia.db');
  } finally { await db.close(); }
}
