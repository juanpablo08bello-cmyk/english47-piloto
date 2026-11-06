import { openDb } from '../db.js';
import { connectPostgres, verifySchema } from './postgres.js';

export async function openStorage(config) {
  if (config.storage === 'sqlite') return openDb(config.dbPath);
  const db = connectPostgres(config.databaseUrl);
  try {
    await verifySchema(db);
    return db;
  } catch (err) {
    await db.close();
    throw err;
  }
}
