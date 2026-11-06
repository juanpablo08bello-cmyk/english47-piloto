// Ejecutar solo contra una base de pruebas vacía. No borra una base existente.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../server/db.js';
import { createInvitation, redeemInvitation } from '../server/auth.js';
import { award, validatePracticeDay } from '../server/progress.js';
import { recordResult } from '../server/srs.js';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { createVoiceServices } from '../server/voice/index.js';
import { connectPostgres, installSchema, verifySchema } from '../server/storage/postgres.js';
import { openStorage } from '../server/storage/index.js';
import { importSqlite } from '../scripts/postgres.js';
import { correctAnswer } from './helpers.js';
import { VOCAB_BY_ID } from '../content/vocab.js';

const url = process.env.ENGLISH47_TEST_DATABASE_URL;
assert.ok(url, 'Requiere ENGLISH47_TEST_DATABASE_URL con una base vacía exclusiva de pruebas.');
const config = loadConfig({ DATABASE_URL:url, VOICE_ENABLED:'false' });
const dir = mkdtempSync(join(tmpdir(), 'english47-import-'));
const file = join(dir,'pilot.db');
const before = Date.parse('2026-11-04T21:00:00Z');
const today = before + 86400000;
let db = connectPostgres(url), server, base, cookie;
async function stop() {
  if (server) { server.closeAllConnections(); await new Promise(r=>server.close(r)); server=null; }
  await db.close();
}
async function start() {
  db = await openStorage(config);
  server = createApp({db,config,services:createVoiceServices(config),clock:()=>today});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  base = 'http://127.0.0.1:'+server.address().port;
}
async function api(path, body, expected=200) {
  const res=await fetch(base+'/api/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});
  const sessionCookie=res.headers.get('set-cookie');if(sessionCookie)cookie=sessionCookie.split(';')[0];
  const json=await res.json();
  assert.equal(res.status,expected,JSON.stringify({path,...json}));
  return json;
}
try {
  assert.equal((await db.query("SELECT to_regnamespace('english47') AS schema")).rows[0].schema,null,'Se necesita una base desechable sin esquema english47');
  await installSchema(db); await installSchema(db); await verifySchema(db);
  const source=openDb(file);
  const invite=await createInvitation(source,{role:'student'},before);
  const credentials={username:'pilot.test',password:'test-only-restaurant',displayName:'Prueba'};
  const redeemed=await redeemInvitation(source,{...credentials,code:invite.code},before);
  const user=source.prepare('SELECT * FROM users WHERE id=?').get(redeemed.userId);
  await award(source,user.id,'fixture:lesson',{xp:10},before);
  await validatePracticeDay(source,user,'brief',before);
  const word=[...VOCAB_BY_ID.keys()][0];
  await recordResult(source,user.id,word,{correct:true,level:'use'},'2026-11-04');
  source.prepare('INSERT INTO favorites VALUES (?,?)').run(user.id,word);
  source.close();
  const counts=await importSqlite(db,file);
  assert.equal(counts.users,1);assert.equal(counts.reward_events,2);
  await assert.rejects(importSqlite(db,file),/destino contiene datos/);
  await stop();await start();
  await api('profile',undefined,401);
  await api('auth/login',credentials);
  assert.equal((await api('profile')).stats.xp,10);
  let {session}=await api('daily/brief',{});
  const exercises=session.brief.exercises;
  for(const [i,exercise] of exercises.entries()) {
    const answer=correctAnswer(exercise,VOCAB_BY_ID);
    const body={step:'brief',index:i,answer};
    await api('daily/answer',body);await api('daily/answer',body);
  }
  const profile=await api('profile');
  assert.equal(profile.stats.current,2);assert.equal(profile.stats.coins,40);
  const favorites=await db.prepare('SELECT vocab_id FROM favorites WHERE user_id=?').all(user.id);
  assert.equal(favorites[0].vocab_id,word);
  const vocab=await db.prepare('SELECT used_count FROM vocab_progress WHERE user_id=? AND vocab_id=?').get(user.id,word);
  assert.ok(vocab.used_count>=1);
  const sim=(await api('sim',{scenarioId:'table_for_two',mode:'demo'})).sim;
  await api('sim/'+sim.id+'/turn',{text:'Good evening. Can I get you some water?',source:'text',requestId:'one-turn'});
  await api('sim/'+sim.id+'/finish',{});
  const after=await api('profile');
  await stop();await start();
  assert.deepEqual((await api('profile')).stats,after.stats);
  assert.equal((await api('daily')).session.brief.done,true);
  assert.ok((await api('vocab')).entries.length);
  assert.ok((await api('route')).units.length);
  console.log('OK: importación v3, repetición rechazada, login, práctica breve, racha 2, 40 monedas, palabras, mesa demo, mismo perfil tras reiniciar servidor y pool.');
} finally {
  await stop();rmSync(dir,{recursive:true,force:true});
}
